import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Claims any unclaimed affiliate_grants whose affiliate.email matches the
// logged-in user's email. Materializes each grant into real vault_fees +
// memory_credits rows for the user, then marks the grant as claimed so we
// never double-credit.
//
// Designed to be safe to call repeatedly: it's a no-op once everything is
// claimed. The dashboard hits this on load and also exposes a manual
// "Claim now" button on the banner.

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const emailLower = user.email.toLowerCase();

  // Find affiliate accounts that match this user by email. A photographer
  // can technically have multiple historical affiliate rows under the same
  // email (rare but possible if they re-applied) — claim grants from all.
  const { data: affiliates } = await supabaseAdmin
    .from("affiliates")
    .select("id")
    .eq("email", emailLower);

  if (!affiliates || affiliates.length === 0) {
    return NextResponse.json({ claimed: 0 });
  }

  const affiliateIds = affiliates.map((a) => a.id);

  const { data: grants } = await supabaseAdmin
    .from("affiliate_grants")
    .select("id, vault_fees, audio_credits, video_credits, photo_credits, bundle, source")
    .in("affiliate_id", affiliateIds)
    .is("claimed_user_id", null);

  if (!grants || grants.length === 0) {
    return NextResponse.json({ claimed: 0 });
  }

  let claimed = 0;
  for (const g of grants) {
    // Insert vault fee rows (one row per vault) so the user can create that
    // many vaults later. source_id is the grant id so we can audit which
    // freebie produced which fee.
    if (g.vault_fees > 0) {
      const vaultFeeRows = Array.from({ length: g.vault_fees }, () => ({
        user_id: user.id,
        source: g.source,
        source_id: g.id,
      }));
      const { error: feeError } = await supabaseAdmin
        .from("vault_fees")
        .insert(vaultFeeRows);
      if (feeError) {
        console.error("claim-grants: vault_fees insert failed", feeError);
        continue;
      }
    }

    // Insert recording credits. bundle='anniversary' makes the 12-month
    // seal cap from migration 034 apply automatically when the user
    // creates a vault using these credits.
    if (
      (g.audio_credits || 0) > 0 ||
      (g.video_credits || 0) > 0 ||
      (g.photo_credits || 0) > 0
    ) {
      const { error: creditError } = await supabaseAdmin
        .from("memory_credits")
        .insert({
          user_id: user.id,
          audio_credits: g.audio_credits || 0,
          video_credits: g.video_credits || 0,
          photo_credits: g.photo_credits || 0,
          stripe_payment_intent_id: `grant_${g.id}`,
          ...(g.bundle ? { bundle: g.bundle } : {}),
        });
      if (creditError) {
        console.error("claim-grants: memory_credits insert failed", creditError);
        continue;
      }
    }

    // Mark grant claimed last so a partial failure can be retried.
    const { error: markError } = await supabaseAdmin
      .from("affiliate_grants")
      .update({ claimed_user_id: user.id, claimed_at: new Date().toISOString() })
      .eq("id", g.id);
    if (markError) {
      console.error("claim-grants: mark claimed failed", markError);
      continue;
    }

    claimed += 1;
  }

  return NextResponse.json({ claimed });
}

// GET returns whether the user has any unclaimed grants — used by the
// dashboard to show/hide the banner without committing the claim.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ pending: 0 });
  }

  const emailLower = user.email.toLowerCase();

  const { data: affiliates } = await supabaseAdmin
    .from("affiliates")
    .select("id")
    .eq("email", emailLower);

  if (!affiliates || affiliates.length === 0) {
    return NextResponse.json({ pending: 0 });
  }

  const affiliateIds = affiliates.map((a) => a.id);

  const { count } = await supabaseAdmin
    .from("affiliate_grants")
    .select("*", { count: "exact", head: true })
    .in("affiliate_id", affiliateIds)
    .is("claimed_user_id", null);

  return NextResponse.json({ pending: count || 0 });
}
