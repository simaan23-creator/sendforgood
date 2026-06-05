import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Returns the affiliate record (code + gift_credits) matching the logged-in
// user's email, if any. Used by the dashboard to deep-link photographers
// into their portal when they have an unused client gift waiting.
//
// Session-authed: no portal_password needed because we only return non-
// sensitive identifiers (code, gift_credits count, business_name). The
// portal itself stays password-gated.
//
// Quiet no-op (returns {}) when:
//   - not signed in
//   - signed-in email doesn't match any affiliate row
//   - matching affiliate is inactive
//
// Designed to be safe to call on every dashboard load.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({});
  }

  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("code, gift_credits, business_name")
    .eq("email", user.email.toLowerCase())
    .eq("active", true)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({});
  }

  return NextResponse.json({
    code: affiliate.code,
    gift_credits: affiliate.gift_credits || 0,
    business_name: affiliate.business_name || null,
  });
}
