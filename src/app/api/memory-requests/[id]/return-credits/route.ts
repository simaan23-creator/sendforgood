import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Return unused credits from a vault back to the user's balance
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: vault, error: fetchError } = await supabaseAdmin
    .from("memory_requests")
    .select("id, requester_id, max_audio_recordings, max_video_recordings, max_photo_uploads")
    .eq("id", id)
    .single();

  if (fetchError || !vault) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  if (vault.requester_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Count current recordings per format
  const { data: recordings } = await supabaseAdmin
    .from("memory_recordings")
    .select("message_format")
    .eq("request_id", id);

  let audioRecorded = 0;
  let videoRecorded = 0;
  let photoRecorded = 0;
  if (recordings) {
    for (const rec of recordings) {
      if (rec.message_format === "video") videoRecorded++;
      else if (rec.message_format === "photo") photoRecorded++;
      else audioRecorded++;
    }
  }

  // Calculate unused slots
  const unusedAudio = Math.max(0, (vault.max_audio_recordings || 0) - audioRecorded);
  const unusedVideo = Math.max(0, (vault.max_video_recordings || 0) - videoRecorded);
  const unusedPhoto = Math.max(0, (vault.max_photo_uploads || 0) - photoRecorded);

  if (unusedAudio === 0 && unusedVideo === 0 && unusedPhoto === 0) {
    return NextResponse.json({ error: "No unused credits to return" }, { status: 400 });
  }

  // Return credits to user's balance
  const { error: creditError } = await supabaseAdmin
    .from("memory_credits")
    .insert({
      user_id: user.id,
      audio_credits: unusedAudio,
      video_credits: unusedVideo,
      photo_credits: unusedPhoto,
    });

  if (creditError) {
    console.error("Error returning credits:", creditError);
    return NextResponse.json({ error: creditError.message }, { status: 500 });
  }

  // Shrink vault slots to match actual recordings
  const { error: updateError } = await supabaseAdmin
    .from("memory_requests")
    .update({
      max_audio_recordings: audioRecorded,
      max_video_recordings: videoRecorded,
      max_photo_uploads: photoRecorded,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error updating vault:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    returned: {
      audio: unusedAudio,
      video: unusedVideo,
      photo: unusedPhoto,
    },
  });
}
