import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Affiliate referral: middleware writes sfg_affiliate when ?ref=CODE
  // arrives. Forward it as Stripe metadata so the webhook can credit the
  // commission to the right affiliate. Matches the pattern used by the
  // other checkout routes (src/app/api/checkout/route.ts:10).
  const cookieStore = await cookies();
  const affiliateCode = cookieStore.get("sfg_affiliate")?.value || "";

  const body = await request.json();
  const { audioCredits, videoCredits, photoCredits, vaultFeeQty, targetVaultId, bundle } = body;

  // ── Bundle presets ──
  // When a recognized bundle is requested, credit quantities and price are
  // server-controlled (so a client can't tamper with the discount).
  const BUNDLES: Record<string, { audio: number; video: number; photo: number; vaultFees: number; priceCents: number; label: string; maxSealMonths?: number }> = {
    starter: {
      audio: 0,
      video: 50,
      photo: 200,
      vaultFees: 1,
      priceCents: 9995,
      label: "Starter Package",
    },
    // Anniversary Capsule — sampler sized for a single 1st-anniversary reveal.
    // Lean credit counts (1 vault + 6 video + 15 photo) at $29.95 produce
    // ~$24 net for us after Stripe + 15% affiliate, and a $4.50 commission
    // to the photographer — above the threshold where they'll mention us
    // unprompted. The 12-month seal cap (enforced at vault-creation time
    // via memory_credits.bundle = 'anniversary') positions the 10-year
    // full vault as a true premium tier.
    anniversary: {
      audio: 0,
      video: 6,
      photo: 15,
      vaultFees: 1,
      priceCents: 2995,
      label: "Anniversary Capsule",
      maxSealMonths: 12,
    },
  };
  const bundleKey = typeof bundle === "string" && bundle in BUNDLES ? bundle : null;
  const bundleSpec = bundleKey ? BUNDLES[bundleKey] : null;

  const audio = bundleSpec ? bundleSpec.audio : Math.max(0, Math.floor(audioCredits || 0));
  const video = bundleSpec ? bundleSpec.video : Math.max(0, Math.floor(videoCredits || 0));
  const photo = bundleSpec ? bundleSpec.photo : Math.max(0, Math.floor(photoCredits || 0));
  const vaultFees = bundleSpec ? bundleSpec.vaultFees : Math.max(0, Math.floor(vaultFeeQty || 0));
  const targetVault =
    !bundleSpec && typeof targetVaultId === "string" && targetVaultId.length > 0
      ? targetVaultId
      : null;

  if (audio <= 0 && video <= 0 && photo <= 0) {
    return NextResponse.json(
      { error: "At least one credit type must be greater than 0" },
      { status: 400 }
    );
  }

  const lineItems: Array<{
    price_data: {
      currency: string;
      product_data: { name: string; description: string };
      unit_amount: number;
    };
    quantity: number;
  }> = [];

  if (bundleSpec) {
    // Single bundled line item at the discounted price. The webhook reads
    // credit counts from metadata (not line items), so a single line item is
    // safe and gives the cleanest Stripe receipt.
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `SealTheDay ${bundleSpec.label}`,
          description: `1 Memory Vault + ${bundleSpec.video} video slots + ${bundleSpec.photo} photo slots`,
        },
        unit_amount: bundleSpec.priceCents,
      },
      quantity: 1,
    });
  } else {
    // À la carte — separate line items per credit type.
    // Vault fee — $10 each (skipped when adding credits to an existing vault)
    if (vaultFees > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Memory Vault Fee",
            description: "One-time vault creation fee ($10 per vault)",
          },
          unit_amount: 1000,
        },
        quantity: vaultFees,
      });
    }

    if (audio > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Audio Memory Credit",
            description: "One person can record a voice message for your vault",
          },
          unit_amount: 25, // $0.25
        },
        quantity: audio,
      });
    }

    if (video > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Video Memory Credit",
            description: "One person can record a video message for your vault",
          },
          unit_amount: 100, // $1
        },
        quantity: video,
      });
    }

    if (photo > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Photo Memory Credit",
            description: "One person can upload a photo to your vault",
          },
          unit_amount: 25, // $0.25
        },
        quantity: photo,
      });
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    metadata: {
      isVaultOrder: "true",
      userId: user.id,
      audioCredits: String(audio),
      videoCredits: String(video),
      photoCredits: String(photo),
      vaultFeeQty: String(vaultFees),
      ...(targetVault ? { targetVaultId: targetVault } : {}),
      ...(bundleKey ? { bundle: bundleKey } : {}),
      ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
    },
    customer_email: user.email,
    // session_id is replaced by Stripe at redirect time and used by the
  // success page as transaction_id for analytics deduplication.
  success_url: `${baseUrl}/vault/success?audio=${audio}&video=${video}&photo=${photo}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/vault/buy`,
  });

  return NextResponse.json({ url: session.url });
}
