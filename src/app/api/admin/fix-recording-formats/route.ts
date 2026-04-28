import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

// One-time fix: check each memory_recording's actual file content type
// and update message_format accordingly (video recordings were saved as "audio")
export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all memory requests for this user
  const { data: requests } = await supabaseAdmin
    .from("memory_requests")
    .select("id")
    .eq("requester_id", user.id);

  if (!requests || requests.length === 0) {
    return NextResponse.json({ message: "No vaults found", fixed: 0 });
  }

  const requestIds = requests.map((r) => r.id);

  // Get all recordings that are currently marked as "audio"
  const { data: recordings } = await supabaseAdmin
    .from("memory_recordings")
    .select("id, audio_url, message_format")
    .in("request_id", requestIds)
    .eq("message_format", "audio");

  if (!recordings || recordings.length === 0) {
    return NextResponse.json({ message: "No audio recordings to check", fixed: 0 });
  }

  let fixed = 0;
  const details: { id: string; url: string; contentType: string; newFormat: string }[] = [];

  for (const rec of recordings) {
    if (!rec.audio_url) continue;

    try {
      // HEAD request to check the actual content type
      const headRes = await fetch(rec.audio_url, { method: "HEAD" });
      const contentType = headRes.headers.get("content-type") || "";

      if (contentType.startsWith("video/")) {
        await supabaseAdmin
          .from("memory_recordings")
          .update({ message_format: "video" })
          .eq("id", rec.id);

        fixed++;
        details.push({ id: rec.id, url: rec.audio_url, contentType, newFormat: "video" });
      }
    } catch (err) {
      console.error(`Failed to check recording ${rec.id}:`, err);
    }
  }

  return NextResponse.json({
    message: `Fixed ${fixed} recording(s)`,
    fixed,
    checked: recordings.length,
    details,
  });
}
