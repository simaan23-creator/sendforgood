import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Claim endpoint for direct vault gift purchases (vault_gift_purchases).
//
// Distinct from /api/gift/claim/[id] which handles affiliate_grants
// (photographer-driven freebies). This route handles guest-purchased
// Anniversary Capsule gifts where the purchaser paid via Stripe at
// /vault/buy?bundle=anniversary with gift mode on.
//
// Public GET → redacted summary for the claim landing page.
// Auth POST → materializes vault_fees + memory_credits on the
// signed-in user's account (must match recipient_email).

const CODE_RE = /^[A-Za-z0-9]{16}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code || !CODE_RE.test(code)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: gift } = await supabaseAdmin
    .from("vault_gift_purchases")
    .select(
      "id, purchaser_email, personal_message, recipient_name, recipient_email, redeemable_by_anyone, status, claimed_user_id, vault_fees, audio_credits, video_credits, photo_credits, bundle, created_at"
    )
    .eq("claim_code", code)
    .maybeSingle();

  if (!gift) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Bearer mode: open-redemption codes (e.g. Etsy orders) have no specific
  // recipient. The claim page renders a generic "ready to claim" pitch
  // instead of "from {purchaser} to {recipient}".
  const isBearer = !!gift.redeemable_by_anyone || !gift.recipient_email;

  if (isBearer) {
    return NextResponse.json({
      mode: "bearer",
      bundle: gift.bundle,
      claimed: gift.status === "claimed" || !!gift.claimed_user_id,
      contents: {
        vault_fees: gift.vault_fees || 0,
        audio_credits: gift.audio_credits || 0,
        video_credits: gift.video_credits || 0,
        photo_credits: gift.photo_credits || 0,
      },
    });
  }

  return NextResponse.json({
    mode: "email_match",
    from: gift.purchaser_email || "A friend",
    recipient_name: gift.recipient_name,
    personal_message: gift.personal_message,
    bundle: gift.bundle,
    claimed: gift.status === "claimed" || !!gift.claimed_user_id,
    contents: {
      vault_fees: gift.vault_fees || 0,
      audio_credits: gift.audio_credits || 0,
      video_credits: gift.video_credits || 0,
      photo_credits: gift.photo_credits || 0,
    },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code || !CODE_RE.test(code)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: gift } = await supabaseAdmin
    .from("vault_gift_purchases")
    .select(
      "id, recipient_email, redeemable_by_anyone, status, claimed_user_id, vault_fees, audio_credits, video_credits, photo_credits, bundle"
    )
    .eq("claim_code", code)
    .maybeSingle();

  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  if (gift.status === "claimed" || gift.claimed_user_id) {
    return NextResponse.json(
      { error: "This gift has already been claimed." },
      { status: 409 }
    );
  }

  // Bearer mode (e.g. Etsy): any signed-in user can claim. Email-match mode:
  // the user must sign in with the address the purchaser specified.
  if (!gift.redeemable_by_anyone) {
    const userEmail = user.email.toLowerCase();
    const recipient = (gift.recipient_email || "").toLowerCase();
    if (!recipient || recipient !== userEmail) {
      return NextResponse.json(
        {
          error:
            "This gift was sent to a different email address. Please sign in with the address the gift was sent to.",
        },
        { status: 403 }
      );
    }
  }

  // Lock the gift row FIRST via optimistic update. If two users race for
  // the same bearer code, only one update will affect a row; the loser
  // sees count=0 and bails before any credits are written. This is the
  // key correctness guarantee for open-redemption codes.
  const { data: locked, error: lockError } = await supabaseAdmin
    .from("vault_gift_purchases")
    .update({
      status: "claimed",
      claimed_user_id: user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", gift.id)
    .is("claimed_user_id", null)
    .select("id");

  if (lockError) {
    console.error("vault gift claim: lock failed", lockError);
    return NextResponse.json(
      { error: "Could not claim gift. Please try again." },
      { status: 500 }
    );
  }
  if (!locked || locked.length === 0) {
    return NextResponse.json(
      { error: "This gift has already been claimed." },
      { status: 409 }
    );
  }

  // Materialize: vault_fees row(s) + memory_credits row. The lock above
  // makes this safe to run unconditionally for the claiming user.
  if ((gift.vault_fees || 0) > 0) {
    const vaultFeeRows = Array.from({ length: gift.vault_fees || 0 }, () => ({
      user_id: user.id,
      source: "vault_gift_purchase",
      source_id: gift.id,
    }));
    const { error: feeError } = await supabaseAdmin
      .from("vault_fees")
      .insert(vaultFeeRows);
    if (feeError) {
      console.error("vault gift claim: vault_fees insert failed", feeError);
      return NextResponse.json(
        { error: "Could not claim gift. Please try again." },
        { status: 500 }
      );
    }
  }

  if (
    (gift.audio_credits || 0) > 0 ||
    (gift.video_credits || 0) > 0 ||
    (gift.photo_credits || 0) > 0
  ) {
    const { error: creditError } = await supabaseAdmin
      .from("memory_credits")
      .insert({
        user_id: user.id,
        audio_credits: gift.audio_credits || 0,
        video_credits: gift.video_credits || 0,
        photo_credits: gift.photo_credits || 0,
        stripe_payment_intent_id: `vault_gift_${gift.id}`,
        ...(gift.bundle ? { bundle: gift.bundle } : {}),
      });
    if (creditError) {
      console.error("vault gift claim: memory_credits insert failed", creditError);
      return NextResponse.json(
        { error: "Could not claim gift. Please try again." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ claimed: true });
}
