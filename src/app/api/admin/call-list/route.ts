import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/admin/call-list
//
// Manual phone-call backup for "your vault just opened" notifications. The
// daily vault-opened email lands in some recipients' spam folders (Simaan saw
// his own go to spam on 2026-05-25). Until Twilio automation is justified,
// this list is what Simaan works from by hand.
//
// Three buckets, ordered by urgency:
//
//   1. opening_today — vaults whose seal lifts today AND delivery_date is on
//      or before today. The email has just been (or is about to be) sent;
//      these are the hot calls.
//
//   2. no_view_7d — vaults that unlocked 6–8 days ago and the owner has still
//      never viewed them (last_viewed_at is null, or was bumped before the
//      seal lifted which would only happen via test fixtures).
//
//   3. no_view_30d — same logic but at the 29–31 day mark. Last-chance nudge
//      before we give up.
//
// A vault appears in a bucket until a row exists for it in vault_call_log
// with a matching bucket and called_at within the bucket's window — meaning
// "Simaan already called about this one, don't show it again." For the 7d/30d
// buckets the window is the same 3-day range as the bucket itself; for
// opening_today it's "called today."
//
// All three buckets eagerly join owner email + phone so the admin page can
// render a one-click call/text link.

interface CallListRow {
  vault_id: string;
  title: string;
  owner_email: string | null;
  owner_phone: string | null;
  sealed_until: string | null;
  delivery_date: string | null;
  last_viewed_at: string | null;
  recording_count: number;
  bucket: "opening_today" | "no_view_7d" | "no_view_30d";
}

function isoDateUtc(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const today = isoDateUtc(0);
  const sevenAgo = isoDateUtc(-8);
  const sevenAgoEnd = isoDateUtc(-6);
  const thirtyAgo = isoDateUtc(-31);
  const thirtyAgoEnd = isoDateUtc(-29);

  // Fetch all candidate vaults across the three windows in one query so we
  // can compute everything client-side without N round-trips. The set is
  // bounded by ~weeks of unlocks, so it's never large.
  const { data: vaults, error: vaultErr } = await supabaseAdmin
    .from("memory_requests")
    .select(
      "id, title, requester_id, sealed_until, delivery_date, last_viewed_at"
    )
    .or(
      `and(sealed_until.eq.${today},delivery_date.lte.${today}),` +
        `and(sealed_until.gte.${sevenAgo},sealed_until.lte.${sevenAgoEnd}),` +
        `and(sealed_until.gte.${thirtyAgo},sealed_until.lte.${thirtyAgoEnd})`
    );

  if (vaultErr) {
    return NextResponse.json({ error: vaultErr.message }, { status: 500 });
  }

  const candidateIds = (vaults || []).map((v) => v.id);
  if (candidateIds.length === 0) {
    return NextResponse.json({
      opening_today: [],
      no_view_7d: [],
      no_view_30d: [],
      generated_at: new Date().toISOString(),
    });
  }

  // Recording counts per vault.
  const { data: counts } = await supabaseAdmin
    .from("memory_recordings")
    .select("request_id")
    .in("request_id", candidateIds);
  const countByVault = new Map<string, number>();
  for (const r of counts || []) {
    countByVault.set(r.request_id, (countByVault.get(r.request_id) || 0) + 1);
  }

  // Owner profiles (email + phone).
  const ownerIds = Array.from(
    new Set((vaults || []).map((v) => v.requester_id).filter(Boolean))
  );
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, phone")
    .in("id", ownerIds);
  const profileById = new Map<string, { email: string | null; phone: string | null }>();
  for (const p of profiles || []) {
    profileById.set(p.id, { email: p.email ?? null, phone: p.phone ?? null });
  }

  // Already-called log within the last 35 days (covers the widest bucket).
  const sinceCalls = isoDateUtc(-35);
  const { data: calls } = await supabaseAdmin
    .from("vault_call_log")
    .select("vault_id, bucket, called_at")
    .in("vault_id", candidateIds)
    .gte("called_at", sinceCalls);
  const calledKeySet = new Set<string>();
  for (const c of calls || []) {
    calledKeySet.add(`${c.vault_id}:${c.bucket}`);
  }

  const opening_today: CallListRow[] = [];
  const no_view_7d: CallListRow[] = [];
  const no_view_30d: CallListRow[] = [];

  for (const v of vaults || []) {
    const owner = profileById.get(v.requester_id) ?? { email: null, phone: null };
    const base = {
      vault_id: v.id,
      title: v.title,
      owner_email: owner.email,
      owner_phone: owner.phone,
      sealed_until: v.sealed_until,
      delivery_date: v.delivery_date,
      last_viewed_at: v.last_viewed_at,
      recording_count: countByVault.get(v.id) ?? 0,
    };

    // Bucket 1: opening today.
    if (
      v.sealed_until === today &&
      v.delivery_date &&
      v.delivery_date <= today &&
      !calledKeySet.has(`${v.id}:opening_today`)
    ) {
      opening_today.push({ ...base, bucket: "opening_today" });
    }

    // Skip the no-view buckets if the owner has already viewed since unlock.
    const ownerSawSinceUnlock =
      v.last_viewed_at &&
      v.sealed_until &&
      v.last_viewed_at >= `${v.sealed_until}T00:00:00Z`;

    // Bucket 2: 7-day no-view.
    if (
      !ownerSawSinceUnlock &&
      v.sealed_until &&
      v.sealed_until >= sevenAgo &&
      v.sealed_until <= sevenAgoEnd &&
      !calledKeySet.has(`${v.id}:no_view_7d`)
    ) {
      no_view_7d.push({ ...base, bucket: "no_view_7d" });
    }

    // Bucket 3: 30-day no-view.
    if (
      !ownerSawSinceUnlock &&
      v.sealed_until &&
      v.sealed_until >= thirtyAgo &&
      v.sealed_until <= thirtyAgoEnd &&
      !calledKeySet.has(`${v.id}:no_view_30d`)
    ) {
      no_view_30d.push({ ...base, bucket: "no_view_30d" });
    }
  }

  return NextResponse.json({
    opening_today,
    no_view_7d,
    no_view_30d,
    generated_at: new Date().toISOString(),
  });
}
