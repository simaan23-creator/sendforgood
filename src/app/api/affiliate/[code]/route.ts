import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
  const { code } = await params;
  const password = request.headers.get("x-portal-password") || new URL(request.url).searchParams.get("password");

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 401 });
  }

  // Fetch affiliate by code
  const { data: affiliate, error: affError } = await supabaseAdmin
    .from("affiliates")
    .select("*")
    .eq("code", code)
    .single();

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

  // Get full totals from affiliate record (more accurate than just last 50)
  const stats = {
    total_referrals: fullCount || totalReferrals,
    total_earned: affiliate.total_earned || 0,
    total_paid: affiliate.total_paid || 0,
    pending_payout: (affiliate.total_earned || 0) - (affiliate.total_paid || 0),
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
      first_commission_rate: affiliate.first_commission_rate,
      repeat_commission_rate: affiliate.repeat_commission_rate,
    },
    stats,
    referrals: maskedReferrals,
    last_updated: new Date().toISOString(),
  });
}
