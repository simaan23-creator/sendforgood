import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Public GET returns a redacted summary of the gift used by the claim page.
// Authenticated POST materializes the grant into real vault_fees +
// memory_credits rows and stamps profiles.attributed_affiliate_id so
// future purchases by this recipient pay commission to the gifting
// photographer.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: grant } = await supabaseAdmin
    .from("affiliate_grants")
    .select(
      "id, affiliate_id, source, recipient_email, personal_message, expires_at, claimed_user_id, vault_fees, audio_credits, video_credits, photo_credits"
    )
    .eq("id", id)
    .maybeSingle();

  if (!grant || grant.source !== "affiliate_gift") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("business_name, name")
    .eq("id", grant.affiliate_id)
    .maybeSingle();

  const businessName =
    affiliate?.business_name || affiliate?.name || "Your photographer";

  const now = new Date();
  const expired = grant.expires_at
    ? new Date(grant.expires_at).getTime() < now.getTime()
    : false;
  const claimed = !!grant.claimed_user_id;

  return NextResponse.json({
    business_name: businessName,
    personal_message: grant.personal_message,
    expires_at: grant.expires_at,
    expired,
    claimed,
    contents: {
      vault_fees: grant.vault_fees || 0,
      audio_credits: grant.audio_credits || 0,
      video_credits: grant.video_credits || 0,
      photo_credits: grant.photo_credits || 0,
    },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: grant } = await supabaseAdmin
    .from("affiliate_grants")
    .select(
      "id, affiliate_id, source, recipient_email, expires_at, claimed_user_id, vault_fees, audio_credits, video_credits, photo_credits, bundle"
    )
    .eq("id", id)
    .maybeSingle();

  if (!grant || grant.source !== "affiliate_gift") {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  if (grant.claimed_user_id) {
    return NextResponse.json(
      { error: "This gift has already been claimed." },
      { status: 409 }
    );
  }
  if (grant.expires_at && new Date(grant.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This gift has expired." }, { status: 410 });
  }

  const userEmail = user.email.toLowerCase();
  const recipient = (grant.recipient_email || "").toLowerCase();
  if (!recipient || recipient !== userEmail) {
    return NextResponse.json(
      {
        error:
          "This gift was sent to a different email address. Please sign in with the address the gift was sent to.",
      },
      { status: 403 }
    );
  }

  // Materialize: vault_fees row(s) + memory_credits row, mirroring the
  // claim-grants endpoint's shape so downstream code treats these the
  // same as the signup-grant freebies.
  if ((grant.vault_fees || 0) > 0) {
    const vaultFeeRows = Array.from({ length: grant.vault_fees || 0 }, () => ({
      user_id: user.id,
      source: grant.source,
      source_id: grant.id,
    }));
    const { error: feeError } = await supabaseAdmin
      .from("vault_fees")
      .insert(vaultFeeRows);
    if (feeError) {
      console.error("gift claim: vault_fees insert failed", feeError);
      return NextResponse.json(
        { error: "Could not claim gift. Please try again." },
        { status: 500 }
      );
    }
  }

  if (
    (grant.audio_credits || 0) > 0 ||
    (grant.video_credits || 0) > 0 ||
    (grant.photo_credits || 0) > 0
  ) {
    const { error: creditError } = await supabaseAdmin
      .from("memory_credits")
      .insert({
        user_id: user.id,
        audio_credits: grant.audio_credits || 0,
        video_credits: grant.video_credits || 0,
        photo_credits: grant.photo_credits || 0,
        stripe_payment_intent_id: `grant_${grant.id}`,
        ...(grant.bundle ? { bundle: grant.bundle } : {}),
      });
    if (creditError) {
      console.error("gift claim: memory_credits insert failed", creditError);
      return NextResponse.json(
        { error: "Could not claim gift. Please try again." },
        { status: 500 }
      );
    }
  }

  // Persistent attribution — only set if currently null so we don't
  // overwrite an earlier attribution from another photographer.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("attributed_affiliate_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.attributed_affiliate_id) {
    await supabaseAdmin
      .from("profiles")
      .update({ attributed_affiliate_id: grant.affiliate_id })
      .eq("id", user.id);
  }

  const { error: markError } = await supabaseAdmin
    .from("affiliate_grants")
    .update({ claimed_user_id: user.id, claimed_at: new Date().toISOString() })
    .eq("id", grant.id)
    .is("claimed_user_id", null);

  if (markError) {
    console.error("gift claim: mark claimed failed", markError);
    return NextResponse.json(
      { error: "Could not claim gift. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ claimed: true });
}
