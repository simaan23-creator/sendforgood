import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Public, unauthenticated lookup of an affiliate's public display name by
// referral code. Used by the AffiliateBanner client component to render
// "Recommended by [Business Name]" on the marketing pages when the visitor
// arrived via ?ref=CODE.
//
// Returns only the minimum fields needed for the banner. Inactive
// affiliates resolve to 404 so disabled photographers don't get free
// branding. Lookup matches `code` OR alias (D3) so renamed codes still
// work via either URL.
//
// Cached at the CDN for 5 minutes — these rows change rarely (only on
// rename or business_name edit).

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toLowerCase();

  if (!code || !/^[a-z0-9_-]{1,48}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Match either the canonical code or any alias.
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("name, business_name, code, active")
    .or(`code.eq.${code},aliases.cs.{${code}}`)
    .eq("active", true)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const displayName = affiliate.business_name || affiliate.name;
  return NextResponse.json(
    {
      code: affiliate.code,
      display_name: displayName,
    },
    {
      headers: {
        // Public, CDN-cacheable. SWR for resilience on stale edges.
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
