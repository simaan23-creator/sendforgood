import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { signWatchToken } from "@/lib/watch-token";

// Manual send endpoint for milestone voice/video messages. Mirrors the
// /api/letters/release flow: verify the user owns the row, generate a signed
// audio URL, send the same email the cron would, then mark delivered.
//
// Idempotency: rows already in 'delivered' are rejected with 400.
export async function POST(
  _request: NextRequest,
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

  const { data: message, error: fetchError } = await supabaseAdmin
    .from("voice_messages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !message) {
    return NextResponse.json(
      { error: "Voice message not found" },
      { status: 404 }
    );
  }

  if (message.status === "delivered") {
    return NextResponse.json(
      { error: "This message has already been delivered" },
      { status: 400 }
    );
  }

  if (!message.audio_url) {
    return NextResponse.json(
      { error: "Record a message before sending" },
      { status: 400 }
    );
  }

  if (!message.recipient_email) {
    return NextResponse.json(
      { error: "Add a recipient email before sending" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const senderName =
    profile?.full_name || profile?.email || user.email || "Someone who cares";
  const recipientName = message.recipient_name || "Friend";

  // Route the recipient through our /watch/[id] page (rather than a raw
  // Supabase signed URL) so we can apply the webm Infinity-duration fix on
  // playback and expose a real download button. Token is HMAC-bound to the
  // message id and expires in 30 days.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://sendforgood.com";
  const watchToken = signWatchToken(id);
  const audioListenUrl = `${baseUrl}/watch/${id}?t=${watchToken}`;

  const formatLabel = message.message_format === "video" ? "video" : "voice";
  const ctaLabel =
    message.message_format === "video"
      ? "Watch Your Message"
      : "Listen to Your Message";

  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: message.recipient_email,
      subject: `A ${formatLabel} message for you \u2014 from ${senderName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f0; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0ece4; text-align: center;">
      <p style="color: #1B2A4A; font-size: 14px; margin: 0 0 8px 0; opacity: 0.6;">
        A ${formatLabel} message for ${escapeHtml(recipientName)}
      </p>

      ${message.title ? `<h1 style="color: #1B2A4A; font-size: 24px; font-weight: bold; margin: 0 0 32px 0; font-family: Georgia, serif;">${escapeHtml(message.title)}</h1>` : ""}

      <p style="color: #1B2A4A; font-size: 16px; line-height: 1.8; margin-bottom: 32px;">
        ${escapeHtml(senderName)} recorded a special ${formatLabel} message just for you.${message.milestone_label ? ` It was held until <strong>${escapeHtml(message.milestone_label)}</strong>.` : ""}
      </p>

      <a href="${audioListenUrl}" style="display: inline-block; background: #1B2A4A; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-family: -apple-system, sans-serif; font-size: 16px; font-weight: bold;">
        ${ctaLabel}
      </a>

      ${message.duration_seconds ? `<p style="color: #9a9489; font-size: 13px; margin-top: 16px;">${Math.floor(message.duration_seconds / 60)}:${(message.duration_seconds % 60).toString().padStart(2, "0")} long</p>` : ""}

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f0ece4;">
        <p style="color: #1B2A4A; font-size: 16px; margin: 0; font-family: Georgia, serif;">
          With love,<br/>
          <strong>${escapeHtml(senderName)}</strong>
        </p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 32px; padding: 0 20px;">
      <p style="color: #9a9489; font-size: 12px; margin: 0 0 4px 0; font-family: -apple-system, sans-serif;">Delivered with care by</p>
      <p style="color: #1B2A4A; font-size: 14px; font-weight: bold; margin: 0; font-family: -apple-system, sans-serif;">SendForGood</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (emailError) {
    const msg =
      emailError instanceof Error ? emailError.message : "Unknown error";
    console.error(`Failed to send voice message ${id}:`, emailError);
    return NextResponse.json(
      { error: `Failed to send: ${msg}` },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("voice_messages")
    .update({ status: "delivered" })
    .eq("id", id);

  return NextResponse.json({ success: true });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
