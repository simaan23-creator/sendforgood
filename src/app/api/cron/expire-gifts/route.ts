import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

// Cron: flips pending gifted_items past their expires_at to status='expired'
// and notifies the sender so they know the gift was returned.
//
// Schedule via vercel.json: "*/15 * * * *"
// Authorization: Bearer ${CRON_SECRET}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabaseAdmin
    .from("gifted_items")
    .select("id, sender_id, item_type, tier, message_format, recipient_name, recipient_email, expires_at")
    .eq("status", "pending")
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso)
    .limit(500);

  if (error) {
    console.error("expire-gifts query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  let expired = 0;
  let emailsSent = 0;

  for (const gift of due) {
    const { error: updateError } = await supabaseAdmin
      .from("gifted_items")
      .update({ status: "expired", expired_at: nowIso })
      .eq("id", gift.id)
      .eq("status", "pending"); // guard against races

    if (updateError) {
      console.error("Failed to expire gift", gift.id, updateError);
      continue;
    }
    expired += 1;

    // Notify sender
    try {
      const { data: senderProfile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", gift.sender_id)
        .single();

      if (!senderProfile?.email) continue;

      let itemLabel = "gift";
      if (gift.item_type === "letter") itemLabel = "letter";
      else if (gift.item_type === "voice_message")
        itemLabel = gift.message_format === "video" ? "video message" : "voice message";
      else if (gift.item_type === "gift_credit") itemLabel = "gift credit";

      const recipientText = gift.recipient_name
        ? ` to ${gift.recipient_name}`
        : gift.recipient_email
          ? ` to ${gift.recipient_email}`
          : "";

      await resend.emails.send({
        from: "SendForGood <hello@sendforgood.com>",
        to: senderProfile.email,
        subject: "Your gift wasn't claimed in time",
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #FDF8F0; border-radius: 16px;">
            <h1 style="color: #1B2A4A; text-align: center; font-size: 22px;">Your gift was returned</h1>
            <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">
              The ${itemLabel} you sent${recipientText} was not claimed before the deadline you set. We&rsquo;ve returned it to your dashboard so you can re-send it whenever you&rsquo;re ready.
            </p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://sendforgood.com/dashboard" style="display: inline-block; background-color: #1B2A4A; color: #FDF8F0; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Open Dashboard
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
              SendForGood
            </p>
          </div>
        `,
      });
      emailsSent += 1;
    } catch (emailError) {
      console.error("Failed to send expiry notification:", emailError);
    }
  }

  return NextResponse.json({ expired, emailsSent });
}
