import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import crypto from "crypto";

function generateClaimCode(): string {
  return crypto.randomBytes(8).toString("hex"); // 16 characters
}

export async function POST(request: Request) {
  // Authenticate
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
  const { itemType, itemId, recipientName, recipientEmail, message } = body;

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: "itemType and itemId are required" },
      { status: 400 }
    );
  }

  if (!["letter", "voice_message", "gift_credit"].includes(itemType)) {
    return NextResponse.json(
      { error: "Invalid item type" },
      { status: 400 }
    );
  }

  if (message && message.length > 200) {
    return NextResponse.json(
      { error: "Message must be 200 characters or less" },
      { status: 400 }
    );
  }

  // Validate ownership and get item details
  let tier: string | null = null;
  let messageFormat: string | null = null;
  let deliveryType: string | null = null;

  if (itemType === "letter") {
    const { data: letter, error } = await supabaseAdmin
      .from("letters")
      .select("id, user_id, delivery_type, title")
      .eq("id", itemId)
      .single();

    if (error || !letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }
    if (letter.user_id !== user.id) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 });
    }
    deliveryType = letter.delivery_type;
  } else if (itemType === "voice_message") {
    const { data: vm, error } = await supabaseAdmin
      .from("voice_messages")
      .select("id, user_id, message_format")
      .eq("id", itemId)
      .single();

    if (error || !vm) {
      return NextResponse.json(
        { error: "Voice message not found" },
        { status: 404 }
      );
    }
    if (vm.user_id !== user.id) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 });
    }
    messageFormat = vm.message_format;
  } else if (itemType === "gift_credit") {
    const { data: gc, error } = await supabaseAdmin
      .from("gift_credits")
      .select("id, user_id, tier")
      .eq("id", itemId)
      .single();

    if (error || !gc) {
      return NextResponse.json(
        { error: "Gift credit not found" },
        { status: 404 }
      );
    }
    if (gc.user_id !== user.id) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 });
    }
    tier = gc.tier;
  }

  // Generate claim code and create gifted_items record
  const claimCode = generateClaimCode();

  const { error: insertError } = await supabaseAdmin
    .from("gifted_items")
    .insert({
      sender_id: user.id,
      recipient_email: recipientEmail || null,
      recipient_name: recipientName || null,
      item_type: itemType,
      item_id: itemId,
      tier,
      message_format: messageFormat,
      delivery_type: deliveryType,
      message: message || null,
      claim_code: claimCode,
      status: "pending",
    });

  if (insertError) {
    console.error("Failed to create gifted_items record:", insertError);
    return NextResponse.json(
      { error: "Failed to create gift" },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sendforgood.com";
  const claimUrl = `${baseUrl}/claim/${claimCode}`;

  // Get sender name
  const { data: senderProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const senderName = senderProfile?.full_name || "Someone";

  // Compose item description for email
  let itemDescription = "a gift";
  if (itemType === "letter") {
    itemDescription = "a letter slot";
  } else if (itemType === "voice_message") {
    itemDescription = `a ${messageFormat || "voice"} message slot`;
  } else if (itemType === "gift_credit") {
    itemDescription = `a ${tier || ""} gift credit`;
  }

  // Send email if recipient email provided
  if (recipientEmail) {
    try {
      await resend.emails.send({
        from: "SendForGood <hello@sendforgood.com>",
        to: recipientEmail,
        subject: `${senderName} sent you a gift from SendForGood!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #FDF8F0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background-color: rgba(200, 169, 98, 0.1); border-radius: 50%; padding: 16px;">
                <span style="font-size: 32px;">🎁</span>
              </div>
            </div>
            <h1 style="color: #1B2A4A; text-align: center; font-size: 24px; margin-bottom: 8px;">
              You've received a gift!
            </h1>
            <p style="color: #6B7280; text-align: center; font-size: 16px; margin-bottom: 24px;">
              <strong style="color: #1B2A4A;">${senderName}</strong> sent you ${itemDescription} on SendForGood.
            </p>
            ${
              message
                ? `<div style="background: rgba(200, 169, 98, 0.08); border-left: 4px solid #C8A962; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="color: #1B2A4A; font-style: italic; margin: 0;">"${message}"</p>
                    <p style="color: #6B7280; font-size: 13px; margin-top: 8px;">— ${senderName}</p>
                  </div>`
                : ""
            }
            <div style="text-align: center; margin-top: 24px;">
              <a href="${claimUrl}" style="display: inline-block; background-color: #2D5016; color: #FDF8F0; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
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
      // Don't fail the request — the gift link is still valid
    }
  }

  return NextResponse.json({
    claimCode,
    claimUrl,
  });
}
