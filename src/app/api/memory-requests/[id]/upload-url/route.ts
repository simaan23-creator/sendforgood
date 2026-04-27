import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Generate a signed upload URL so the client can upload directly to Supabase
// storage, bypassing Vercel's 4.5 MB body size limit and storage RLS policies.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: code } = await params;

  // Accept optional contentType from client (for MP4 on iOS)
  let contentType = "audio/webm";
  try {
    const body = await request.json();
    if (body.contentType) contentType = body.contentType;
  } catch {
    // No body is fine, default to audio/webm
  }

  // Validate the claim code
  const { data: memoryRequest, error } = await supabaseAdmin
    .from("memory_requests")
    .select("id, status")
    .eq("unique_code", code)
    .in("status", ["active", "pending"])
    .single();

  if (error || !memoryRequest) {
    return NextResponse.json(
      { error: "Request not found or no longer active" },
      { status: 404 }
    );
  }

  // Determine file extension from content type
  let ext = "webm";
  if (contentType.includes("mp4")) ext = "mp4";
  else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  else if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("heic")) ext = "heic";
  else if (contentType.includes("webp")) ext = "webp";
  const path = `${code}/${Date.now()}.${ext}`;

  const { data, error: signError } = await supabaseAdmin.storage
    .from("memory-recordings")
    .createSignedUploadUrl(path);

  if (signError || !data) {
    console.error("Failed to create signed upload URL:", signError);
    return NextResponse.json(
      { error: "Failed to prepare upload" },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("memory-recordings")
    .getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: urlData.publicUrl,
    contentType,
  });
}
