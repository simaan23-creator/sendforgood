import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { renderDigestEmail } from "@/lib/affiliates/digest-email";

// D4: monthly leaderboard digest. Runs the 1st of each month at 14:00
// UTC (9am ET). One email per active affiliate with prior-month stats,
// lifetime totals, rank, and current tier.

function priorMonthRange(): { start: string; end: string; monthStart: string; label: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    monthStart: start.toISOString().split("T")[0]!,
    label: start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start, end, label } = priorMonthRange();

  const { data: activeAffiliates } = await supabaseAdmin
    .from("affiliates")
    .select("id, name, business_name, email, code, repeat_commission_rate")
    .eq("active", true);

  if (!activeAffiliates || activeAffiliates.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  // Prior-month paid referrals, grouped per affiliate.
  const { data: priorRefs } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("affiliate_id, commission_amount")
    .gte("created_at", start)
    .lt("created_at", end)
    .eq("paid", true);

  const priorByAffiliate = new Map<string, { count: number; commission: number }>();
  for (const r of priorRefs || []) {
    const cur = priorByAffiliate.get(r.affiliate_id) || { count: 0, commission: 0 };
    cur.count += 1;
    cur.commission += Number(r.commission_amount) || 0;
    priorByAffiliate.set(r.affiliate_id, cur);
  }

  // Lifetime paid referrals per affiliate.
  const { data: lifetimeRefs } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("affiliate_id, commission_amount")
    .eq("paid", true);

  const lifetimeByAffiliate = new Map<string, { count: number; commission: number }>();
  for (const r of lifetimeRefs || []) {
    const cur = lifetimeByAffiliate.get(r.affiliate_id) || { count: 0, commission: 0 };
    cur.count += 1;
    cur.commission += Number(r.commission_amount) || 0;
    lifetimeByAffiliate.set(r.affiliate_id, cur);
  }

  // Leaderboard: every active affiliate ranked by prior-month paid count
  // (0 counted, so newcomers still get a "rank #N of N" line).
  const leaderboard = activeAffiliates
    .map((a) => ({
      id: a.id,
      prior_count: priorByAffiliate.get(a.id)?.count || 0,
    }))
    .sort((a, b) => b.prior_count - a.prior_count);

  const rankById = new Map<string, number>();
  leaderboard.forEach((r, i) => rankById.set(r.id, i + 1));
  const topReferrals = leaderboard[0]?.prior_count || 0;
  const rankTotal = activeAffiliates.length;

  const portalBase = process.env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";

  let sent = 0;
  let failed = 0;
  for (const a of activeAffiliates) {
    const prior = priorByAffiliate.get(a.id) || { count: 0, commission: 0 };
    const lifetime = lifetimeByAffiliate.get(a.id) || { count: 0, commission: 0 };
    const { subject, html } = renderDigestEmail({
      name: a.name,
      business_name: a.business_name || a.name,
      code: a.code,
      prior_month_label: label,
      prior_month_referrals: prior.count,
      prior_month_commission_cents: prior.commission,
      lifetime_referrals: lifetime.count,
      lifetime_earned_cents: lifetime.commission,
      rank: rankById.get(a.id) || rankTotal,
      rank_total: rankTotal,
      top_referrals: topReferrals,
      base_repeat_rate: Number(a.repeat_commission_rate) || 10,
      paid_referrals_to_date: lifetime.count,
      portal_url: `${portalBase}/affiliate/${a.code}`,
    });

    try {
      await resend.emails.send({
        from: "SealTheDay <noreply@sealtheday.com>",
        to: a.email,
        subject,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Digest send failed for ${a.email}:`, err);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  return NextResponse.json({ sent, failed });
}
