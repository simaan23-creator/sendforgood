import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/admin/etsy/recent
 * Header: x-admin-password
 *
 * Returns the most recent 20 Etsy mint codes so the admin can see what's
 * been minted and whether it's been claimed yet.
 *
 * Password is sent in a header rather than a query string so it doesn't
 * end up in any Vercel access logs.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-etsy-recent:${ip}`, 60, 60 / 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429 }
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const provided = request.headers.get("x-admin-password") ?? "";
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("vault_gift_purchases")
    .select("external_order_id, claim_code, status, claimed_at, created_at")
    .eq("source", "etsy_order")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("etsy recent fetch failed", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  return NextResponse.json({ codes: data || [] });
}
