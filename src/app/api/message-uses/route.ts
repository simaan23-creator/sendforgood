import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { data: uses, error } = await supabase
    .from("message_uses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching message uses:", error);
    return NextResponse.json(
      { error: "Failed to fetch message uses" },
      { status: 500 }
    );
  }

  return NextResponse.json(uses || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const {
    format,
    use_type,
    recipientName,
    recipientEmail,
    deliveryDate,
    milestoneLabel,
    sealedUntil,
    message,
  } = body as {
    format: string;
    use_type: string;
    recipientName?: string;
    recipientEmail?: string;
    deliveryDate?: string;
    milestoneLabel?: string;
    sealedUntil?: string;
    message?: string;
  };

  // Validate format
  const validFormats = [
    "letter_digital",
    "letter_physical",
    "letter_photo",
    "audio",
    "video",
  ];
  if (!validFormats.includes(format)) {
    return NextResponse.json(
      { error: `Invalid format: ${format}` },
      { status: 400 }
    );
  }

  // Validate use_type
  const validUseTypes = ["self_record", "vault", "gift", "request"];
  if (!validUseTypes.includes(use_type)) {
    return NextResponse.json(
      { error: `Invalid use_type: ${use_type}` },
      { status: 400 }
    );
  }

  // Check user has available credits for this format
  const { data: credits, error: creditError } = await supabaseAdmin
    .from("message_credits")
    .select("id, quantity, quantity_used")
    .eq("user_id", user.id)
    .eq("format", format)
    .order("created_at", { ascending: true });

  if (creditError) {
    console.error("Error checking credits:", creditError);
    return NextResponse.json(
      { error: "Failed to check credits" },
      { status: 500 }
    );
  }

  // Find a credit record with available balance
  const availableCredit = (credits || []).find(
    (c) => c.quantity - c.quantity_used > 0
  );

  if (!availableCredit) {
    return NextResponse.json(
      { error: `No available ${format} credits` },
      { status: 400 }
    );
  }

  // Build the message_use record
  const claimCode =
    use_type === "gift" || use_type === "request"
      ? generateClaimCode()
      : null;

  const statusMap: Record<string, string> = {
    self_record: "draft",
    vault: "draft",
    gift: "gifted",
    request: "pending_request",
  };

  const { data: messageUse, error: insertError } = await supabaseAdmin
    .from("message_uses")
    .insert({
      credit_id: availableCredit.id,
      user_id: user.id,
      format,
      use_type,
      content_text: message || null,
      recipient_name: recipientName || null,
      recipient_email: recipientEmail || null,
      delivery_date: deliveryDate || null,
      milestone_label: milestoneLabel || null,
      sealed_until: sealedUntil || null,
      status: statusMap[use_type] || "draft",
      claim_code: claimCode,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating message use:", insertError);
    return NextResponse.json(
      { error: "Failed to create message use" },
      { status: 500 }
    );
  }

  // Increment quantity_used on the credit
  const { error: updateError } = await supabaseAdmin
    .from("message_credits")
    .update({ quantity_used: availableCredit.quantity_used + 1 })
    .eq("id", availableCredit.id);

  if (updateError) {
    console.error("Error updating credit:", updateError);
    // Roll back the message_use
    await supabaseAdmin.from("message_uses").delete().eq("id", messageUse.id);
    return NextResponse.json(
      { error: "Failed to update credit balance" },
      { status: 500 }
    );
  }

  // Get sender name for emails
  const { data: senderProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const senderName = senderProfile?.full_name || user.email?.split("@")[0] || "Someone";
  const senderFirst = senderName.split(" ")[0];

  // Send emails based on use_type
  if (use_type === "gift" && recipientEmail && claimCode) {
    const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim/${claimCode}`;
    const formatLabel = format.startsWith("letter_")
      ? "Letter"
      : format === "audio"
        ? "Audio Message"
        : "Video Message";

    try {
      await resend.emails.send({
        from: "SendForGood <noreply@sendforgood.com>",
        to: recipientEmail,
        subject: `${senderFirst} sent you a ${formatLabel}!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
            <h1 style="color: #1a2744;">You\u2019ve received a gift!</h1>
            <p><strong>${senderFirst}</strong> sent you a <strong>${formatLabel}</strong> on SendForGood.</p>
            ${message ? `
            <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #C8A962;">
              <p style="margin: 0; font-style: italic;">\u201C${message}\u201D</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #666;">\u2014 ${senderFirst}</p>
            </div>` : ""}
            <p style="margin-top: 24px;">
              <a href="${claimUrl}" style="background: #2D5016; color: #fdf8f0; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Claim Your Gift</a>
            </p>
            <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send gift claim email:", emailError);
    }
  }

  if (use_type === "request" && recipientEmail && claimCode) {
    const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim/${claimCode}`;
    const formatLabel = format === "audio" ? "audio" : "video";

    try {
      await resend.emails.send({
        from: "SendForGood <noreply@sendforgood.com>",
        to: recipientEmail,
        subject: `${senderFirst} wants you to record a ${formatLabel} message`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
            <h1 style="color: #1a2744;">You\u2019ve been asked to record a message</h1>
            <p><strong>${senderFirst}</strong> would love for you to record a ${formatLabel} message on SendForGood.</p>
            ${message ? `
            <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #C8A962;">
              <p style="margin: 0; font-style: italic;">\u201C${message}\u201D</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #666;">\u2014 ${senderFirst}</p>
            </div>` : ""}
            <p style="margin-top: 24px;">
              <a href="${claimUrl}" style="background: #2D5016; color: #fdf8f0; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Record Your Message</a>
            </p>
            <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send request email:", emailError);
    }
  }

  return NextResponse.json(messageUse, { status: 201 });
}
