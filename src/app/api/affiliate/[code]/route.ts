import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRepeatTier } from "@/lib/affiliates/tiers";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  // Tight limit for portal password attempts.
  const ip = getClientIp(request);
  const limit = rateLimit(`affiliate-portal:${ip}`, 10, 10 / 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { code } = await params;
  const password = request.headers.get("x-portal-password") || new URL(request.url).searchParams.get("password");

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 401 });
  }

  // Fetch affiliate by canonical code OR any legacy alias (D3) so old
  // bookmarks and printed materials with the original code still load
  // the right portal after a rename.
  const codeLower = code.trim().toLowerCase();
  const { data: affiliate, error: affError } = await supabaseAdmin
    .from("affiliates")
    .select("*")
    .or(`code.eq.${codeLower},aliases.cs.{${codeLower}}`)
    .maybeSingle();

  if (affError || !affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  // Verify password
  if (!affiliate.portal_password || affiliate.portal_password !== password) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Fetch referrals
  const { data: referrals } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("*")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Calculate stats
  const allReferrals = referrals || [];
  const totalReferrals = allReferrals.length;
  const totalEarned = allReferrals.reduce((sum, r) => sum + r.commission_amount, 0);
  const totalPaid = allReferrals.filter((r) => r.paid).reduce((sum, r) => sum + r.commission_amount, 0);
  const pendingPayout = totalEarned - totalPaid;

  // Also get the full count (not just last 50)
  const { count: fullCount } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("*", { count: "exact", head: true })
    .eq("affiliate_id", affiliate.id);

  // D7: paid referral count drives the repeat-commission tier the
  // affiliate is currently in (and the count needed for the next tier).
  const { count: paidCountResult } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("*", { count: "exact", head: true })
    .eq("affiliate_id", affiliate.id)
    .eq("paid", true);
  const paidReferrals = paidCountResult || 0;
  const tierInfo = getRepeatTier(
    paidReferrals,
    Number(affiliate.repeat_commission_rate || 10)
  );

  // Get full totals from affiliate record (more accurate than just last 50)
  const stats = {
    total_referrals: fullCount || totalReferrals,
    total_earned: affiliate.total_earned || 0,
    total_paid: affiliate.total_paid || 0,
    pending_payout: (affiliate.total_earned || 0) - (affiliate.total_paid || 0),
    paid_referrals: paidReferrals,
    tier: tierInfo,
  };

  // D10 Gift Kits: pull this affiliate's gifts so the portal can show the
  // Send→Claimed→Activated→Converted funnel. Activation requires a vault
  // stamped with this affiliate id (memory_requests.gifted_by_affiliate_id);
  // conversion requires a paid affiliate_referrals row for the claiming user.
  const { data: giftGrants } = await supabaseAdmin
    .from("affiliate_grants")
    .select("id, recipient_email, created_at, expires_at, claimed_user_id, claimed_at")
    .eq("affiliate_id", affiliate.id)
    .eq("source", "affiliate_gift")
    .order("created_at", { ascending: false });

  const claimedUserIds = (giftGrants || [])
    .map((g) => g.claimed_user_id)
    .filter((v): v is string => !!v);

  const activatedUserIds = new Set<string>();
  const convertedUserIds = new Set<string>();

  if (claimedUserIds.length > 0) {
    const { data: activated } = await supabaseAdmin
      .from("memory_requests")
      .select("requester_id")
      .eq("gifted_by_affiliate_id", affiliate.id)
      .in("requester_id", claimedUserIds);
    for (const r of activated || []) {
      if (r.requester_id) activatedUserIds.add(r.requester_id as string);
    }

    const { data: claimedProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .in("id", claimedUserIds);
    const emailsByUserId = new Map<string, string>();
    for (const p of claimedProfiles || []) {
      if (p.email)
        emailsByUserId.set(p.id as string, String(p.email).toLowerCase());
    }
    const candidateEmails = Array.from(emailsByUserId.values());
    if (candidateEmails.length > 0) {
      const { data: convertedRefs } = await supabaseAdmin
        .from("affiliate_referrals")
        .select("customer_email")
        .eq("affiliate_id", affiliate.id)
        .eq("paid", true)
        .in("customer_email", candidateEmails);
      const convertedEmailSet = new Set(
        (convertedRefs || []).map((r) =>
          String(r.customer_email || "").toLowerCase()
        )
      );
      for (const [uid, email] of emailsByUserId) {
        if (convertedEmailSet.has(email)) convertedUserIds.add(uid);
      }
    }
  }

  const nowMs = Date.now();
  const gifts = (giftGrants || []).map((g) => {
    const expired =
      !g.claimed_user_id &&
      !!g.expires_at &&
      new Date(g.expires_at).getTime() < nowMs;
    let status: "sent" | "claimed" | "activated" | "converted" | "expired";
    if (expired) {
      status = "expired";
    } else if (!g.claimed_user_id) {
      status = "sent";
    } else if (g.claimed_user_id && convertedUserIds.has(g.claimed_user_id)) {
      status = "converted";
    } else if (g.claimed_user_id && activatedUserIds.has(g.claimed_user_id)) {
      status = "activated";
    } else {
      status = "claimed";
    }
    return {
      id: g.id,
      recipient_email: maskEmail(g.recipient_email || ""),
      sent_at: g.created_at,
      expires_at: g.expires_at,
      claimed_at: g.claimed_at,
      status,
    };
  });

  const giftCounts = {
    sent: gifts.filter((g) => g.status === "sent").length,
    claimed: gifts.filter((g) => g.status === "claimed").length,
    activated: gifts.filter((g) => g.status === "activated").length,
    converted: gifts.filter((g) => g.status === "converted").length,
    expired: gifts.filter((g) => g.status === "expired").length,
  };

  // Mask customer emails in referrals
  const maskedReferrals = allReferrals.map((r) => ({
    id: r.id,
    customer_email: maskEmail(r.customer_email),
    amount_paid: r.amount_paid,
    commission_amount: r.commission_amount,
    commission_rate: r.commission_rate,
    referral_type: r.referral_type,
    paid: r.paid,
    paid_at: r.paid_at,
    created_at: r.created_at,
  }));

  return NextResponse.json({
    affiliate: {
      name: affiliate.name,
      code: affiliate.code,
      business_name: affiliate.business_name || null,
      aliases: Array.isArray(affiliate.aliases) ? affiliate.aliases : [],
      first_commission_rate: affiliate.first_commission_rate,
      repeat_commission_rate: affiliate.repeat_commission_rate,
      gift_credits: affiliate.gift_credits || 0,
    },
    stats,
    referrals: maskedReferrals,
    gifts,
    gift_counts: giftCounts,
    last_updated: new Date().toISOString(),
  });
}
