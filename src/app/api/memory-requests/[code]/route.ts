import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: memoryRequest, error } = await supabaseAdmin
    .from("memory_requests")
    .select("title, occasion, delivery_date, note_to_recorder, requester_id")
    .eq("unique_code", code)
    .eq("status", "active")
    .single();

  if (error || !memoryRequest) {
    return NextResponse.json(
      { error: "Request not found or no longer active" },
      { status: 404 }
    );
  }

  // Get requester first name only
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", memoryRequest.requester_id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] || "Someone";

  return NextResponse.json({
    title: memoryRequest.title,
    occasion: memoryRequest.occasion,
    delivery_date: memoryRequest.delivery_date,
    note_to_recorder: memoryRequest.note_to_recorder,
    requester_first_name: firstName,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json();
  const { recorder_name, audio_url } = body;

  if (!audio_url) {
    return NextResponse.json(
      { error: "Audio URL is required" },
      { status: 400 }
    );
  }

  // Find the memory request
  const { data: memoryRequest, error: reqError } = await supabaseAdmin
    .from("memory_requests")
    .select("id, requester_email, title, delivery_date")
    .eq("unique_code", code)
    .eq("status", "active")
    .single();

  if (reqError || !memoryRequest) {
    return NextResponse.json(
      { error: "Request not found or no longer active" },
      { status: 404 }
    );
  }

  // Create recording
  const { data: recording, error: recError } = await supabaseAdmin
    .from("memory_recordings")
    .insert({
      request_id: memoryRequest.id,
      recorder_name: recorder_name || null,
      audio_url,
    })
    .select()
    .single();

  if (recError) {
    console.error("Error creating memory recording:", recError);
    return NextResponse.json({ error: recError.message }, { status: 500 });
  }

  // Send notification email to requester
  const displayName = recorder_name || "Someone";
  const deliveryDate = new Date(memoryRequest.delivery_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: memoryRequest.requester_email,
      subject: "Someone recorded a message for you!",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdf8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #f0ece4;">
      <h1 style="color:#1B2A4A;font-size:24px;margin:0 0 16px 0;">Someone recorded a message for you!</h1>
      <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 12px 0;">
        <strong>${escapeHtml(displayName)}</strong> just recorded a voice message for your request: <strong>${escapeHtml(memoryRequest.title)}</strong>.
      </p>
      <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        It will be delivered to you on <strong>${deliveryDate}</strong>. We are keeping it safe until then.
      </p>
      <div style="text-align:center;padding:20px 0;">
        <span style="display:inline-block;background:#C8A962;color:#1B2A4A;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
          Recording received
        </span>
      </div>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#9a9489;font-size:12px;margin:0;">Delivered with care by <strong>SendForGood</strong></p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (emailError) {
    console.error("Failed to send notification email:", emailError);
  }

  return NextResponse.json(recording);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
