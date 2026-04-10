import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const errors: string[] = [];
  let sent = 0;

  try {
    // Query all voice messages that are scheduled and due today or overdue
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from("voice_messages")
      .select("*, recipients(name), profiles(full_name, email)")
      .eq("status", "scheduled")
      .lte("scheduled_date", today)
      .not("audio_url", "is", null);

    if (fetchError) {
      console.error("Error fetching voice messages:", fetchError);
      return NextResponse.json(
        { sent: 0, errors: [fetchError.message] },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ sent: 0, errors: [] });
    }

    for (const message of messages) {
      if (!message.recipient_email) {
        errors.push(`Voice message ${message.id}: no recipient_email set`);
        continue;
      }

      const senderName =
        message.profiles?.full_name || message.profiles?.email || "Someone who cares";
      const recipientName = message.recipients?.name || "Friend";

      // Generate a signed URL for the audio file
      let audioListenUrl = message.audio_url;
      if (message.audio_url && message.audio_url.startsWith("voice-messages/")) {
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from("voice-messages")
          .createSignedUrl(message.audio_url.replace("voice-messages/", ""), 60 * 60 * 24 * 30); // 30 days

        if (signedUrlData?.signedUrl) {
          audioListenUrl = signedUrlData.signedUrl;
        }
      }

      try {
        await resend.emails.send({
          from: "SendForGood <noreply@sendforgood.com>",
          to: message.recipient_email,
          subject: `A voice message for you \u2014 from ${senderName}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f0; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
    <!-- Message card -->
    <div style="background: #ffffff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0ece4; text-align: center;">
      <p style="color: #1B2A4A; font-size: 14px; margin: 0 0 8px 0; opacity: 0.6;">
        A voice message for ${escapeHtml(recipientName)}
      </p>

      ${message.title ? `<h1 style="color: #1B2A4A; font-size: 24px; font-weight: bold; margin: 0 0 32px 0; font-family: Georgia, serif;">${escapeHtml(message.title)}</h1>` : ""}

      <p style="color: #1B2A4A; font-size: 16px; line-height: 1.8; margin-bottom: 32px;">
        ${escapeHtml(senderName)} recorded a special voice message just for you. Click the button below to listen.
      </p>

      <a href="${audioListenUrl}" style="display: inline-block; background: #1B2A4A; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-family: -apple-system, sans-serif; font-size: 16px; font-weight: bold;">
        Listen to Your Message
      </a>

      ${message.duration_seconds ? `<p style="color: #9a9489; font-size: 13px; margin-top: 16px;">${Math.floor(message.duration_seconds / 60)}:${(message.duration_seconds % 60).toString().padStart(2, "0")} long</p>` : ""}

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f0ece4;">
        <p style="color: #1B2A4A; font-size: 16px; margin: 0; font-family: Georgia, serif;">
          With love,<br/>
          <strong>${escapeHtml(senderName)}</strong>
        </p>
      </div>
    </div>

    <!-- Branding -->
    <div style="text-align: center; margin-top: 32px; padding: 0 20px;">
      <p style="color: #9a9489; font-size: 12px; margin: 0 0 4px 0; font-family: -apple-system, sans-serif;">
        Delivered with care by
      </p>
      <p style="color: #1B2A4A; font-size: 14px; font-weight: bold; margin: 0; font-family: -apple-system, sans-serif;">
        SendForGood
      </p>
      <p style="color: #9a9489; font-size: 11px; margin: 8px 0 0 0; font-family: -apple-system, sans-serif;">
        This voice message was recorded in advance and scheduled for delivery today.
      </p>
    </div>
  </div>
</body>
</html>`,
        });

        // Update status to delivered
        await supabaseAdmin
          .from("voice_messages")
          .update({ status: "delivered" })
          .eq("id", message.id);

        sent++;
        console.log(`Sent voice message ${message.id} to ${message.recipient_email}`);
      } catch (emailError) {
        const msg = emailError instanceof Error ? emailError.message : "Unknown error";
        errors.push(`Voice message ${message.id}: ${msg}`);
        console.error(`Failed to send voice message ${message.id}:`, emailError);
      }
    }

    return NextResponse.json({ sent, errors });
  } catch (error) {
    console.error("Cron send-voice-messages error:", error);
    return NextResponse.json(
      { sent, errors: [...errors, "Unexpected error"] },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
