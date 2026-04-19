import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import crypto from "crypto";

function generateCode(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { use_type, format, item_id, item_type, recipient_name, recipient_email, sealed_until, content_text } = body;

  if (!use_type || !["vault", "gift", "request"].includes(use_type)) {
    return NextResponse.json({ error: "Invalid use_type" }, { status: 400 });
  }

  // Build the record
  const claimCode = generateCode();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sendforgood.com";
  let link = "";

  if (use_type === "vault") {
    if (!sealed_until) {
      return NextResponse.json({ error: "sealed_until is required for vault" }, { status: 400 });
    }
    link = `${baseUrl}/vault/contribute/${claimCode}`;
  } else if (use_type === "gift") {
    link = `${baseUrl}/claim/${claimCode}`;
  } else if (use_type === "request") {
    if (!recipient_email) {
      return NextResponse.json({ error: "recipient_email is required for request" }, { status: 400 });
    }
    link = `${baseUrl}/contribute/${claimCode}`;
  }

  // Insert into message_uses
  const { data: msgUse, error: insertError } = await supabaseAdmin
    .from("message_uses")
    .insert({
      user_id: user.id,
      format: format || null,
      use_type,
      recipient_name: recipient_name || null,
      recipient_email: recipient_email || null,
      sealed_until: use_type === "vault" ? sealed_until : null,
      content_text: content_text || null,
      claim_code: claimCode,
      status: use_type === "request" ? "pending_request" : "draft",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Failed to create message_uses record:", insertError);
    // If table doesn't exist, insert into gifted_items as fallback
    if (insertError.code === "42P01") {
      const { error: fallbackError } = await supabaseAdmin
        .from("gifted_items")
        .insert({
          sender_id: user.id,
          recipient_email: recipient_email || null,
          recipient_name: recipient_name || null,
          item_type: item_type || "letter",
          item_id: item_id || null,
          message: content_text || null,
          claim_code: claimCode,
          status: "pending",
        });
      if (fallbackError) {
        return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
    }
  }

  // Get sender name for emails
  const { data: senderProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const senderName = senderProfile?.full_name || "Someone";

  // Send email for request type
  if (use_type === "request" && recipient_email) {
    try {
      await resend.emails.send({
        from: "SendForGood <hello@sendforgood.com>",
        to: recipient_email,
        subject: `${senderName} is requesting a message from you!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #FDF8F0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px;">📨</span>
            </div>
            <h1 style="color: #1B2A4A; text-align: center; font-size: 24px; margin-bottom: 8px;">
              You've been asked to record a message!
            </h1>
            <p style="color: #6B7280; text-align: center; font-size: 16px; margin-bottom: 24px;">
              <strong style="color: #1B2A4A;">${senderName}</strong> would love for you to record a message.
            </p>
            ${content_text ? `<div style="background: rgba(200,169,98,0.08); border-left: 4px solid #C8A962; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="color: #1B2A4A; font-style: italic; margin: 0;">"${content_text}"</p>
            </div>` : ""}
            <div style="text-align: center; margin-top: 24px;">
              <a href="${link}" style="display: inline-block; background-color: #2D5016; color: #FDF8F0; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                Record Your Message
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
              SendForGood — Gifts that keep on giving
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send request email:", emailError);
    }
  }

  // Send email for gift type
  if (use_type === "gift" && recipient_email) {
    try {
      await resend.emails.send({
        from: "SendForGood <hello@sendforgood.com>",
        to: recipient_email,
        subject: `${senderName} sent you a gift from SendForGood!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #FDF8F0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px;">🎁</span>
            </div>
            <h1 style="color: #1B2A4A; text-align: center; font-size: 24px; margin-bottom: 8px;">
              You've received a gift!
            </h1>
            <p style="color: #6B7280; text-align: center; font-size: 16px; margin-bottom: 24px;">
              <strong style="color: #1B2A4A;">${senderName}</strong> sent you a gift on SendForGood.
            </p>
            ${content_text ? `<div style="background: rgba(200,169,98,0.08); border-left: 4px solid #C8A962; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="color: #1B2A4A; font-style: italic; margin: 0;">"${content_text}"</p>
            </div>` : ""}
            <div style="text-align: center; margin-top: 24px;">
              <a href="${link}" style="display: inline-block; background-color: #2D5016; color: #FDF8F0; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                Claim Your Gift
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
              SendForGood — Gifts that keep on giving
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send gift email:", emailError);
    }
  }

  return NextResponse.json({
    id: msgUse?.id || null,
    claim_code: claimCode,
    link,
  });
}
