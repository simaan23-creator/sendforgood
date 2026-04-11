import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: return all referrals with affiliate info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const affiliateId = searchParams.get("affiliate_id");
  const paidFilter = searchParams.get("paid");

  let query = supabaseAdmin
    .from("affiliate_referrals")
    .select("*, affiliates(name, email, code)")
    .order("created_at", { ascending: false });

  if (affiliateId) {
    query = query.eq("affiliate_id", affiliateId);
  }

  if (paidFilter === "true") {
    query = query.eq("paid", true);
  } else if (paidFilter === "false") {
    query = query.eq("paid", false);
  }

  const { data: referrals, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate total unpaid
  const { data: unpaidData } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("commission_amount")
    .eq("paid", false);

  const totalUnpaid = (unpaidData || []).reduce((sum, r) => sum + r.commission_amount, 0);

  return NextResponse.json({ referrals: referrals || [], totalUnpaid });
}
