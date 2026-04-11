import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST: mark all unpaid referrals for this affiliate as paid
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get all unpaid referrals for this affiliate
  const { data: unpaidReferrals, error: fetchError } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("id, commission_amount")
    .eq("affiliate_id", id)
    .eq("paid", false);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!unpaidReferrals || unpaidReferrals.length === 0) {
    return NextResponse.json({ message: "No unpaid referrals found" });
  }

  const totalPaying = unpaidReferrals.reduce((sum, r) => sum + r.commission_amount, 0);
  const now = new Date().toISOString();

  // Mark all as paid
  const { error: updateError } = await supabaseAdmin
    .from("affiliate_referrals")
    .update({ paid: true, paid_at: now })
    .eq("affiliate_id", id)
    .eq("paid", false);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Update affiliate total_paid
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("total_paid")
    .eq("id", id)
    .single();

  await supabaseAdmin
    .from("affiliates")
    .update({ total_paid: (affiliate?.total_paid || 0) + totalPaying })
    .eq("id", id);

  return NextResponse.json({
    message: `Marked ${unpaidReferrals.length} referrals as paid`,
    amount_paid: totalPaying,
  });
}
