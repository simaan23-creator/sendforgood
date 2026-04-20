import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Generate a signed upload URL so the client can upload directly to Supabase
// storage, bypassing Vercel's 4.5 MB body size limit.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Validate the claim code
  const { data: item, error } = await supabaseAdmin
    .from("message_uses")
    .select("id, format, status")
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

  const ext = "webm";
  const path = `contributions/${code}/${Date.now()}.${ext}`;

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
    contentType: item.format === "video" ? "video/webm" : "audio/webm",
  });
}
