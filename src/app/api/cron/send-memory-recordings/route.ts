import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const errors: string[] = [];
  let sent = 0;

  try {
    // Find all active memory requests where delivery_date is today or past
    // AND sealed_until is NULL or sealed_until <= today (vault has opened)
    const { data: requests, error: fetchError } = await supabaseAdmin
      .from("memory_requests")
      .select("*")
      .eq("status", "active")
      .lte("delivery_date", today)
      .or(`sealed_until.is.null,sealed_until.lte.${today}`);

    if (fetchError) {
      console.error("Error fetching memory requests:", fetchError);
      return NextResponse.json(
        { sent: 0, errors: [fetchError.message] },
        { status: 500 }
      );
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ sent: 0, errors: [] });
    }

    for (const req of requests) {
      // Get all recordings for this request
      const { data: recordings, error: recError } = await supabaseAdmin
        .from("memory_recordings")
        .select("*")
        .eq("request_id", req.id)
        .eq("status", "pending");

      if (recError) {
        errors.push(`Request ${req.id}: ${recError.message}`);
        continue;
      }

      if (!recordings || recordings.length === 0) {
        // Mark request as completed even if no recordings
        await supabaseAdmin
          .from("memory_requests")
          .update({ status: "completed" })
          .eq("id", req.id);
        continue;
      }

      // Check if this is a vault opening day (sealed_until === today)
      const isVaultOpening = req.sealed_until === today;

      // Build recording list HTML
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sendforgood.com";
      const recordingListHtml = recordings
        .map((rec) => {
          const name = rec.recorder_name || "Anonymous";
          const formatLabel = rec.message_format === "video" ? "Video" : "Audio";
          return `
            <div style="background:#fdf8f0;border-radius:8px;padding:16px;margin-bottom:12px;">
              <p style="color:#1B2A4A;font-size:16px;font-weight:600;margin:0 0 4px 0;">
                ${escapeHtml(name)}
              </p>
              <p style="color:#888;font-size:12px;margin:0 0 8px 0;">${formatLabel} message</p>
              <a href="${baseUrl}/listen-memory/${rec.id}" style="display:inline-block;background:#1B2A4A;color:#fdf8f0;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
                ${rec.message_format === "video" ? "Watch Now" : "Listen Now"}
              </a>
            </div>`;
        })
        .join("");

      // Customize email for vault opening vs regular delivery
      const subject = isVaultOpening
        ? `Your Memory Vault is opening today! \uD83D\uDD14`
        : `Your memory recordings are here \u2014 ${req.title}`;

      const introText = isVaultOpening
        ? `<h1 style="color:#1B2A4A;font-size:24px;margin:0 0 8px 0;">Your Memory Vault is opening today! \uD83D\uDD14</h1>
           <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
             The wait is over. <strong>${recordings.length}</strong> message${recordings.length !== 1 ? "s" : ""} ${recordings.length !== 1 ? "are" : "is"} waiting for you in your vault. Click below to ${recordings.some((r) => r.message_format === "video") ? "watch" : "listen to"} them.
           </p>`
        : `<h1 style="color:#1B2A4A;font-size:24px;margin:0 0 8px 0;">Your memories have arrived</h1>
           <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
             The voice messages you requested for <strong>${escapeHtml(req.title)}</strong> are ready to listen to.
           </p>`;

      try {
        await resend.emails.send({
          from: "SendForGood <noreply@sendforgood.com>",
          to: req.requester_email,
          subject,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdf8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #f0ece4;">
      ${introText}
      <p style="color:#1B2A4A;font-size:14px;font-weight:600;margin:0 0 12px 0;">
        ${recordings.length} recording${recordings.length !== 1 ? "s" : ""}:
      </p>
      ${recordingListHtml}
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#9a9489;font-size:12px;margin:0;">Delivered with care by <strong>SendForGood</strong></p>
    </div>
  </div>
</body>
</html>`,
        });

        // Mark recordings as delivered
        const recordingIds = recordings.map((r) => r.id);
        await supabaseAdmin
          .from("memory_recordings")
          .update({ status: "delivered" })
          .in("id", recordingIds);

        // Mark request as completed and unseal
        await supabaseAdmin
          .from("memory_requests")
          .update({ status: "completed", is_sealed: false })
          .eq("id", req.id);

        sent++;
        console.log(`Sent memory recordings for request ${req.id} to ${req.requester_email}`);
      } catch (emailError) {
        const msg = emailError instanceof Error ? emailError.message : "Unknown error";
        errors.push(`Request ${req.id}: ${msg}`);
        console.error(`Failed to send memory recordings for request ${req.id}:`, emailError);
      }
    }

    return NextResponse.json({ sent, errors });
  } catch (error) {
    console.error("Cron send-memory-recordings error:", error);
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
