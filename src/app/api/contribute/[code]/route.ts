import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: Fetch request details by claim code (public, no auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: item, error } = await supabaseAdmin
    .from("message_uses")
    .select("id, user_id, use_type, content_text, credit_id, format, status")
    .eq("claim_code", code)
    .eq("use_type", "request")
    .single();

  if (error || !item) {
    return NextResponse.json(
      { error: "Request not found or invalid link" },
      { status: 404 }
    );
  }

  if (item.status === "completed") {
    return NextResponse.json(
      { error: "This request has already been fulfilled" },
      { status: 400 }
    );
  }

  // Get requester's name
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", item.user_id)
    .single();

  const fullName = profile?.full_name || "Someone";
  const firstName = fullName.split(" ")[0];

  return NextResponse.json({
    request: {
      id: item.id,
      prompt: item.content_text,
      format: item.format,
      requester_name: firstName,
    },
  });
}

// POST: Submit a contribution (no auth required)
// Accepts either JSON (text message) or FormData (recording upload)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  let contributorName = "";
  let message = "";
  let recordingFile: File | null = null;
  let recordingUrl: string | null = null;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    contributorName = (formData.get("contributor_name") as string) || "";
    message = (formData.get("message") as string) || "";
    recordingFile = formData.get("recording") as File | null;
  } else {
    const body = await request.json();
    contributorName = body.contributor_name || "";
    message = body.message || "";
    // Accept a pre-uploaded recording URL (from signed upload flow)
    recordingUrl = body.recording_url || null;
  }

  if (!message.trim() && !recordingFile && !recordingUrl) {
    return NextResponse.json({ error: "A message or recording is required" }, { status: 400 });
  }

  // Find the request
  const { data: item, error: findError } = await supabaseAdmin
    .from("message_uses")
    .select("id, user_id, credit_id, format, status")
    .eq("claim_code", code)
    .eq("use_type", "request")
    .single();

  if (findError || !item) {
    return NextResponse.json(
      { error: "Request not found or invalid link" },
      { status: 404 }
    );
  }

  if (item.status === "completed") {
    return NextResponse.json(
      { error: "This request has already been fulfilled" },
      { status: 400 }
    );
  }

  // Upload recording to Supabase storage if sent via FormData (legacy path)
  if (recordingFile && !recordingUrl) {
    const ext = "webm";
    const path = `contributions/${code}/${Date.now()}.${ext}`;
    const fileContentType = item.format === "video" ? "video/webm" : "audio/webm";
    const buffer = Buffer.from(await recordingFile.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("voice-messages")
      .upload(path, buffer, { upsert: true, contentType: fileContentType });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload recording" }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("voice-messages")
      .getPublicUrl(path);

    recordingUrl = urlData.publicUrl;
  }

  // Store the contributed content in the message_uses record
  await supabaseAdmin
    .from("message_uses")
    .update({
      status: "completed",
      content_text: message.trim() || null,
      content_url: recordingUrl,
      recipient_name: contributorName.trim() || null,
    })
    .eq("id", item.id);

  return NextResponse.json({ success: true });
}
