import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Looks up the most recently claimed gift for the authenticated user
// and returns the gifting photographer's business name so the welcome
// banner on /vault/my?gifted=1 can credit them by name.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ business_name: null });
  }

  const { data: grant } = await supabaseAdmin
    .from("affiliate_grants")
    .select("affiliate_id, claimed_at")
    .eq("claimed_user_id", user.id)
    .eq("source", "affiliate_gift")
    .order("claimed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!grant) {
    return NextResponse.json({ business_name: null });
  }

  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("business_name, name")
    .eq("id", grant.affiliate_id)
    .maybeSingle();

  return NextResponse.json({
    business_name: affiliate?.business_name || affiliate?.name || null,
  });
}
