import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Generate a signed upload URL so the client can upload directly to Supabase
// storage, bypassing Vercel's 4.5 MB body size limit and storage RLS policies.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: messageId } = await params;

  // Verify the user is authenticated and owns this message
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: voiceMessage, error: fetchError } = await supabaseAdmin
    .from("voice_messages")
    .select("id, user_id, message_format")
    .eq("id", messageId)
    .single();

  if (fetchError || !voiceMessage) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (voiceMessage.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Accept optional contentType from client (for MP4 on iOS)
  let contentType = voiceMessage.message_format === "video" ? "video/webm" : "audio/webm";
  try {
    const body = await request.json();
    if (body.contentType) contentType = body.contentType;
  } catch {
    // No body is fine, use default
  }

  const isMP4 = contentType.includes("mp4");
  const ext = isMP4 ? "mp4" : "webm";
  const path = `${messageId}/${Date.now()}.${ext}`;

  const { data, error: signError } = await supabaseAdmin.storage
    .from("voice-messages")
    .createSignedUploadUrl(path);

  if (signError || !data) {
    console.error("Failed to create signed upload URL:", signError);
    return NextResponse.json(
      { error: "Failed to prepare upload" },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("voice-messages")
    .getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: urlData.publicUrl,
    contentType,
  });
}
