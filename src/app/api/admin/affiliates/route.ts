import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: return all affiliates with referral counts and totals
export async function GET() {
  const { data: affiliates, error } = await supabaseAdmin
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get referral stats per affiliate
  const { data: referrals } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("affiliate_id, commission_amount, paid");

  const statsMap: Record<string, { referral_count: number; total_unpaid: number }> = {};
  for (const ref of referrals || []) {
    if (!statsMap[ref.affiliate_id]) {
      statsMap[ref.affiliate_id] = { referral_count: 0, total_unpaid: 0 };
    }
    statsMap[ref.affiliate_id].referral_count++;
    if (!ref.paid) {
      statsMap[ref.affiliate_id].total_unpaid += ref.commission_amount;
    }
  }

  const affiliatesWithStats = (affiliates || []).map((a) => ({
    ...a,
    referral_count: statsMap[a.id]?.referral_count || 0,
    total_unpaid: statsMap[a.id]?.total_unpaid || 0,
  }));

  return NextResponse.json({ affiliates: affiliatesWithStats });
}

// POST: create a new affiliate
export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, code, first_commission_rate, repeat_commission_rate, notes } = body;

  if (!name || !email || !code) {
    return NextResponse.json({ error: "Name, email, and code are required" }, { status: 400 });
  }

  // Validate code format
  if (!/^[a-z0-9_-]+$/.test(code)) {
    return NextResponse.json(
      { error: "Code must be lowercase letters, numbers, hyphens, or underscores only" },
      { status: 400 }
    );
  }

  // Check uniqueness
  const { data: existing } = await supabaseAdmin
    .from("affiliates")
    .select("id")
    .eq("code", code)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Code already in use" }, { status: 400 });
  }

  const { data: affiliate, error } = await supabaseAdmin
    .from("affiliates")
    .insert({
      name,
      email,
      code,
      first_commission_rate: first_commission_rate ?? 15,
      repeat_commission_rate: repeat_commission_rate ?? 10,
      notes: notes || null,
      active: true,
      total_earned: 0,
      total_paid: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ affiliate });
}

// PATCH: update an affiliate
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Affiliate ID is required" }, { status: 400 });
  }

  // Only allow specific fields to be updated
  const allowedFields: Record<string, unknown> = {};
  if (updates.first_commission_rate !== undefined) allowedFields.first_commission_rate = updates.first_commission_rate;
  if (updates.repeat_commission_rate !== undefined) allowedFields.repeat_commission_rate = updates.repeat_commission_rate;
  if (updates.active !== undefined) allowedFields.active = updates.active;
  if (updates.notes !== undefined) allowedFields.notes = updates.notes;
  if (updates.name !== undefined) allowedFields.name = updates.name;
  if (updates.email !== undefined) allowedFields.email = updates.email;

  const { data: affiliate, error } = await supabaseAdmin
    .from("affiliates")
    .update(allowedFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ affiliate });
}
