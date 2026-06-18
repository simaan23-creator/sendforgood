import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/profile/heard-about-us
 * Body: { source?: string } | { dismissed: true }
 *
 * First-visit attribution prompt. The dashboard shows the banner when both
 * `profiles.heard_about_us` and `heard_about_us_dismissed_at` are NULL. The
 * user either picks a source (we store it) or dismisses (we stamp the
 * dismissed_at) — either way we never re-prompt.
 *
 * Auth-gated by the user's own Supabase session, so no rate limit needed
 * beyond that. Source string is capped at 120 chars to fit small Other-text
 * answers without becoming an open input.
 */

const PRESET_SOURCES = new Set([
  "google",
  "pinterest",
  "social",
  "etsy",
  "friend",
  "vendor",
  "other",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { source?: string; sourceDetail?: string; dismissed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.dismissed) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ heard_about_us_dismissed_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      console.error("heard-about-us dismiss failed", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const source = (body.source || "").trim().toLowerCase();
  if (!source || !PRESET_SOURCES.has(source)) {
    return NextResponse.json(
      { error: "source must be one of: " + Array.from(PRESET_SOURCES).join(", ") },
      { status: 400 }
    );
  }

  // For "other" / "vendor" / "friend" we accept an optional free-text detail
  // (e.g. the photographer's name) — appended to source for one-column storage.
  const detail = (body.sourceDetail || "").trim().slice(0, 120);
  const value = detail ? `${source}:${detail}` : source;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ heard_about_us: value })
    .eq("id", user.id);
  if (error) {
    console.error("heard-about-us update failed", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
