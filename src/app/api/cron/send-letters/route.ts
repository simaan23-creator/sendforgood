import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

// NOTE: Configure this as a Vercel cron job.
// In vercel.json add:
// {
//   "crons": [
//     { "path": "/api/cron/send-letters", "schedule": "0 8 * * *" }
//   ]
// }

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
    // Query all digital letters that are scheduled and due today or overdue
    const { data: letters, error: fetchError } = await supabaseAdmin
      .from("letters")
      .select("*, recipients(name), profiles(full_name, email)")
      .eq("delivery_type", "digital")
      .eq("status", "scheduled")
      .lte("scheduled_date", today)
      .neq("content", "");

    if (fetchError) {
      console.error("Error fetching letters:", fetchError);
      return NextResponse.json(
        { sent: 0, errors: [fetchError.message] },
        { status: 500 }
      );
    }

    if (!letters || letters.length === 0) {
      return NextResponse.json({ sent: 0, errors: [] });
    }

    for (const letter of letters) {
      if (!letter.recipient_email) {
        errors.push(`Letter ${letter.id}: no recipient_email set`);
        continue;
      }

      const senderName =
        letter.profiles?.full_name || letter.profiles?.email || "Someone who cares";
      const recipientName = letter.recipients?.name || "Friend";

      try {
        await resend.emails.send({
          from: "SendForGood <noreply@sendforgood.com>",
          to: letter.recipient_email,
          subject: `A letter for you \u2014 from ${senderName}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f0; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
    <!-- Letter -->
    <div style="background: #ffffff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0ece4;">
      <p style="color: #1B2A4A; font-size: 14px; margin: 0 0 8px 0; opacity: 0.6;">
        A letter for ${recipientName}
      </p>

      ${letter.title ? `<h1 style="color: #1B2A4A; font-size: 24px; font-weight: bold; margin: 0 0 32px 0; font-family: Georgia, serif;">${escapeHtml(letter.title)}</h1>` : ""}

      <div style="color: #1B2A4A; font-size: 16px; line-height: 1.8; font-family: Georgia, serif; white-space: pre-wrap;">${escapeHtml(letter.content)}</div>

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
        This letter was written in advance and scheduled for delivery today.
      </p>
    </div>
  </div>
</body>
</html>`,
        });

        // Update status to delivered
        await supabaseAdmin
          .from("letters")
          .update({ status: "delivered" })
          .eq("id", letter.id);

        sent++;
        console.log(`Sent digital letter ${letter.id} to ${letter.recipient_email}`);
      } catch (emailError) {
        const msg = emailError instanceof Error ? emailError.message : "Unknown error";
        errors.push(`Letter ${letter.id}: ${msg}`);
        console.error(`Failed to send letter ${letter.id}:`, emailError);
      }
    }

    return NextResponse.json({ sent, errors });
  } catch (error) {
    console.error("Cron send-letters error:", error);
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
