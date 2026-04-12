import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sum all purchased credits for this user
  const { data: credits, error: creditsError } = await supabaseAdmin
    .from("memory_credits")
    .select("audio_credits, video_credits")
    .eq("user_id", user.id);

  if (creditsError) {
    console.error("Error fetching credits:", creditsError);
    return NextResponse.json(
      { error: creditsError.message },
      { status: 500 }
    );
  }

  const totalAudio = (credits || []).reduce(
    (sum, c) => sum + (c.audio_credits || 0),
    0
  );
  const totalVideo = (credits || []).reduce(
    (sum, c) => sum + (c.video_credits || 0),
    0
  );

  // Count recordings used (grouped by format) through memory_requests owned by this user
  const { data: requests } = await supabaseAdmin
    .from("memory_requests")
    .select("id")
    .eq("requester_id", user.id);

  let audioUsed = 0;
  let videoUsed = 0;

  if (requests && requests.length > 0) {
    const requestIds = requests.map((r) => r.id);

    const { data: recordings } = await supabaseAdmin
      .from("memory_recordings")
      .select("message_format")
      .in("request_id", requestIds);

    if (recordings) {
      for (const rec of recordings) {
        if (rec.message_format === "video") {
          videoUsed++;
        } else {
          audioUsed++;
        }
      }
    }
  }

  return NextResponse.json({
    audioCredits: totalAudio,
    videoCredits: totalVideo,
    audioUsed,
    videoUsed,
  });
}
