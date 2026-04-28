import { NextResponse } from "next/server";
import crypto from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/admin/verify
 * Body: { password: string }
 * Returns 200 on match, 403 otherwise. Used by the admin password gate.
 */
export async function POST(request: Request) {
  // Tight limit to slow brute force: 10 attempts per IP per hour.
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-verify:${ip}`, 10, 10 / 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const provided = body.password ?? "";
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
