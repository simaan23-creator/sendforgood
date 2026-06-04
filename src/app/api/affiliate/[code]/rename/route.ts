import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// D3: rename an affiliate's referral code while preserving the old code
// as an alias. Photographers have printed cards, booth banners, and QR
// codes with the original code — deleting it would break those forever.
// Storing the old code in `aliases` lets both URLs continue to resolve
// to the same affiliate.
//
// Auth: portal password (same as the portal GET). Rate limited to make
// scripted enumeration painful but light enough for legitimate edits.

const RESERVED_CODES = new Set([
  "admin",
  "api",
  "apply",
  "dashboard",
  "login",
  "signup",
  "test",
  "demo",
  "support",
  "help",
  "about",
  "pricing",
  "contact",
  "privacy",
  "terms",
]);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip = getClientIp(request);
  const limit = rateLimit(`affiliate-rename:${ip}`, 5, 5 / 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { code: currentCode } = await params;
  const password = request.headers.get("x-portal-password");
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawRequested = typeof body.new_code === "string" ? body.new_code.trim() : "";
  if (!rawRequested) {
    return NextResponse.json({ error: "new_code is required" }, { status: 400 });
  }

  const newCode = slugify(rawRequested);
  if (newCode.length < 3) {
    return NextResponse.json(
      { error: "Code must be at least 3 characters after slugification." },
      { status: 400 }
    );
  }
  if (RESERVED_CODES.has(newCode)) {
    return NextResponse.json({ error: "That code is reserved." }, { status: 400 });
  }

  // Resolve current affiliate (by code or alias) and verify password.
  const currentLower = currentCode.trim().toLowerCase();
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id, code, aliases, portal_password")
    .or(`code.eq.${currentLower},aliases.cs.{${currentLower}}`)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }
  if (!affiliate.portal_password || affiliate.portal_password !== password) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  if (newCode === affiliate.code) {
    return NextResponse.json({
      code: affiliate.code,
      aliases: affiliate.aliases || [],
      unchanged: true,
    });
  }

  // Uniqueness: new code must not collide with another affiliate's code or
  // their aliases. Self-collisions (newCode already in this affiliate's
  // own aliases from a prior rename) are fine — we'll just remove it from
  // aliases so it becomes the canonical code again.
  const { data: collision } = await supabaseAdmin
    .from("affiliates")
    .select("id")
    .neq("id", affiliate.id)
    .or(`code.eq.${newCode},aliases.cs.{${newCode}}`)
    .maybeSingle();
  if (collision) {
    return NextResponse.json(
      { error: "That code is already taken by another affiliate." },
      { status: 409 }
    );
  }

  // Build the new alias set:
  //   - push the old canonical code (so the old URL keeps working)
  //   - remove the new code from the alias list if it was there
  //   - dedupe
  const previousAliases: string[] = Array.isArray(affiliate.aliases) ? affiliate.aliases : [];
  const aliasSet = new Set(previousAliases.filter((a) => a !== newCode));
  if (affiliate.code) aliasSet.add(affiliate.code);
  const newAliases = Array.from(aliasSet);

  const { error: updateError } = await supabaseAdmin
    .from("affiliates")
    .update({ code: newCode, aliases: newAliases })
    .eq("id", affiliate.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    code: newCode,
    aliases: newAliases,
    previous_code: affiliate.code,
  });
}
