import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateClaimCode } from "@/lib/leads/gift-code";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/admin/etsy/mint-code
 * Body: { password: string, etsyOrderId: string }
 *
 * Manually mints a vault_gift_purchases row keyed to an Etsy order, returning
 * a bearer claim URL to paste back into the Etsy order conversation.
 *
 * Bearer mode means any signed-in user can claim — necessary because the
 * Etsy buyer paid on Etsy (no Stripe session, no recipient_email at mint
 * time), and may forward the code to the actual couple as the gift.
 *
 * Idempotency: a partial unique index on (source, external_order_id) prevents
 * accidental double-minting on the same Etsy order. On 23505 we look up the
 * existing row and return its code so duplicate clicks surface the original.
 */

const ETSY_ORDER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(request: Request) {
  // 20/hr per IP — Etsy fulfillment is manual, no legitimate need for more.
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-etsy-mint:${ip}`, 20, 20 / 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let body: { password?: string; etsyOrderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const provided = body.password ?? "";
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const etsyOrderId = (body.etsyOrderId || "").trim();
  if (!etsyOrderId || !ETSY_ORDER_ID_RE.test(etsyOrderId)) {
    return NextResponse.json(
      { error: "etsyOrderId must be 1-64 chars (letters, digits, _ or -)" },
      { status: 400 }
    );
  }

  // Same package as the in-app Anniversary Capsule (matches BUNDLES.anniversary
  // in src/app/api/vault/checkout/route.ts). If that bundle ever changes, mirror
  // it here.
  const giftRow = {
    purchaser_user_id: null,
    purchaser_email: "etsy@sealtheday.com",
    recipient_email: null,
    bundle: "anniversary",
    audio_credits: 0,
    video_credits: 6,
    photo_credits: 15,
    vault_fees: 1,
    stripe_payment_intent_id: `etsy_${etsyOrderId}`,
    source: "etsy_order",
    external_order_id: etsyOrderId,
    redeemable_by_anyone: true,
    status: "pending",
  };

  // Retry only on claim_code uniqueness collision; external_order_id collision
  // is the dedup signal, handled separately below.
  let claimCode = generateClaimCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("vault_gift_purchases")
      .insert({ ...giftRow, claim_code: claimCode })
      .select("claim_code")
      .single();

    if (!error && data) {
      return NextResponse.json({
        claimUrl: buildClaimUrl(data.claim_code),
        code: data.claim_code,
        duplicate: false,
      });
    }

    if (error?.code === "23505") {
      // Distinguish (source, external_order_id) collision (Etsy order already
      // minted — return the existing code) from (claim_code) collision (just
      // pick a new one and retry).
      const isOrderDup = error.message?.includes("external_order_id");
      if (isOrderDup) {
        const { data: existing } = await supabaseAdmin
          .from("vault_gift_purchases")
          .select("claim_code")
          .eq("source", "etsy_order")
          .eq("external_order_id", etsyOrderId)
          .maybeSingle();
        if (existing?.claim_code) {
          return NextResponse.json({
            claimUrl: buildClaimUrl(existing.claim_code),
            code: existing.claim_code,
            duplicate: true,
          });
        }
      }
      claimCode = generateClaimCode();
      continue;
    }

    if (error) {
      console.error("etsy mint-code insert failed", error);
      return NextResponse.json(
        { error: "Could not mint code. Check server logs." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Could not generate unique claim code after 5 attempts" },
    { status: 500 }
  );
}

function buildClaimUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";
  return `${base}/gift/vault/claim/${code}`;
}
