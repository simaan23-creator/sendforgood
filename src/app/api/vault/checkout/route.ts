import { NextResponse } from "next/server";
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

  const body = await request.json();
  const { audioCredits, videoCredits, photoCredits, vaultFeeQty, targetVaultId } = body;

  const audio = Math.max(0, Math.floor(audioCredits || 0));
  const video = Math.max(0, Math.floor(videoCredits || 0));
  const photo = Math.max(0, Math.floor(photoCredits || 0));
  const vaultFees = Math.max(0, Math.floor(vaultFeeQty || 0));
  const targetVault = typeof targetVaultId === "string" && targetVaultId.length > 0 ? targetVaultId : null;

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
    },
    customer_email: user.email,
    // session_id is replaced by Stripe at redirect time and used by the
  // success page as transaction_id for analytics deduplication.
  success_url: `${baseUrl}/vault/success?audio=${audio}&video=${video}&photo=${photo}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/vault/buy`,
  });

  return NextResponse.json({ url: session.url });
}
