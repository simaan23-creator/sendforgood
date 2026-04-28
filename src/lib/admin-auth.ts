import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Server-side admin authorization. Reads ADMIN_PASSWORD from env and
 * compares against the `x-admin-password` request header using a
 * constant-time comparison to mitigate timing attacks.
 *
 * Returns `null` if authorized, or a NextResponse to return immediately.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    // Fail closed if the secret is not configured.
    return NextResponse.json(
      { error: "Server misconfigured: ADMIN_PASSWORD not set" },
      { status: 500 }
    );
  }

  const provided = request.headers.get("x-admin-password") ?? "";

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
