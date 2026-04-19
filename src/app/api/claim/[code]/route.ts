import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

// GET: Public view of a gifted item by claim code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // First check gifted_items (legacy)
  const { data: legacyItem } = await supabaseAdmin
    .from("gifted_items")
    .select(
      "id, sender_id, recipient_name, item_type, tier, message_format, delivery_type, message, status"
    )
    .eq("claim_code", code)
    .single();

  if (legacyItem) {
    // Get sender's first name
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", legacyItem.sender_id)
      .single();

    const senderFullName = senderProfile?.full_name || "Someone";
    const senderFirstName = senderFullName.split(" ")[0];

    return NextResponse.json({
      gift: {
        id: legacyItem.id,
        source: "gifted_items",
        recipient_name: legacyItem.recipient_name,
        item_type: legacyItem.item_type,
        tier: legacyItem.tier,
        message_format: legacyItem.message_format,
        delivery_type: legacyItem.delivery_type,
        message: legacyItem.message,
        status: legacyItem.status,
        sender_first_name: senderFirstName,
      },
    });
  }

  // Check message_uses (unified system)
  const { data: messageUse } = await supabaseAdmin
    .from("message_uses")
    .select("id, user_id, format, use_type, content_text, recipient_name, status")
    .eq("claim_code", code)
    .single();

  if (messageUse) {
    // Get sender's first name
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", messageUse.user_id)
      .single();

    const senderFullName = senderProfile?.full_name || "Someone";
    const senderFirstName = senderFullName.split(" ")[0];

    // Map format to item_type for display
    const formatToType: Record<string, string> = {
      letter_digital: "letter",
      letter_physical: "letter",
      letter_photo: "letter",
      audio: "voice_message",
      video: "voice_message",
    };

    const formatToMessageFormat: Record<string, string> = {
      audio: "audio",
      video: "video",
    };

    const formatToDeliveryType: Record<string, string> = {
      letter_digital: "digital",
      letter_physical: "physical",
      letter_photo: "physical_photo",
    };

    return NextResponse.json({
      gift: {
        id: messageUse.id,
        source: "message_uses",
        recipient_name: messageUse.recipient_name,
        item_type: formatToType[messageUse.format] || messageUse.format,
        tier: null,
        message_format: formatToMessageFormat[messageUse.format] || null,
        delivery_type: formatToDeliveryType[messageUse.format] || null,
        message: messageUse.content_text,
        status: messageUse.status === "gifted" ? "pending" : messageUse.status,
        sender_first_name: senderFirstName,
        use_type: messageUse.use_type,
        format: messageUse.format,
      },
    });
  }

  return NextResponse.json(
    { error: "Gift not found or invalid claim code" },
    { status: 404 }
  );
}

// POST: Claim a gifted item (auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Verify auth
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

  // Ensure claiming user has a profile
  await supabaseAdmin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "",
    },
    { onConflict: "id" }
  );

  // First check gifted_items (legacy)
  const { data: legacyItem } = await supabaseAdmin
    .from("gifted_items")
    .select("*")
    .eq("claim_code", code)
    .single();

  if (legacyItem) {
    return handleLegacyClaim(legacyItem, user, code);
  }

  // Check message_uses (unified system)
  const { data: messageUse } = await supabaseAdmin
    .from("message_uses")
    .select("*")
    .eq("claim_code", code)
    .single();

  if (messageUse) {
    return handleMessageUseClaim(messageUse, user);
  }

  return NextResponse.json(
    { error: "Gift not found or invalid claim code" },
    { status: 404 }
  );
}

// Handle legacy gifted_items claim
async function handleLegacyClaim(
  item: Record<string, unknown>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  code: string
) {
  if (item.status === "claimed") {
    return NextResponse.json(
      { error: "This gift has already been claimed" },
      { status: 400 }
    );
  }

  let transferError: string | null = null;

  if (item.item_type === "letter") {
    const { data: originalLetter } = await supabaseAdmin
      .from("letters")
      .select("*")
      .eq("id", item.item_id)
      .single();

    if (!originalLetter) {
      return NextResponse.json(
        { error: "Original letter not found" },
        { status: 404 }
      );
    }

    const { error: letterErr } = await supabaseAdmin
      .from("letters")
      .insert({
        user_id: user.id,
        recipient_id: originalLetter.recipient_id,
        letter_type: originalLetter.letter_type,
        title: originalLetter.title,
        content: originalLetter.content,
        scheduled_date: originalLetter.scheduled_date,
        milestone_label: originalLetter.milestone_label,
        status: "draft",
        amount_paid: 0,
        delivery_type: originalLetter.delivery_type || "physical",
        recipient_email: originalLetter.recipient_email,
        photo_url: originalLetter.photo_url,
      });

    if (letterErr) {
      console.error("Failed to create letter for claimer:", letterErr);
      transferError = "Failed to transfer letter";
    }
  } else if (item.item_type === "voice_message") {
    const { data: originalVM } = await supabaseAdmin
      .from("voice_messages")
      .select("*")
      .eq("id", item.item_id)
      .single();

    if (!originalVM) {
      return NextResponse.json(
        { error: "Original voice message not found" },
        { status: 404 }
      );
    }

    const { error: vmErr } = await supabaseAdmin
      .from("voice_messages")
      .insert({
        user_id: user.id,
        title: originalVM.title,
        message_format: originalVM.message_format,
        status: "draft",
      });

    if (vmErr) {
      console.error("Failed to create voice message for claimer:", vmErr);
      transferError = "Failed to transfer voice message";
    }
  } else if (item.item_type === "gift_credit") {
    const { data: originalGC } = await supabaseAdmin
      .from("gift_credits")
      .select("*")
      .eq("id", item.item_id)
      .single();

    if (!originalGC) {
      return NextResponse.json(
        { error: "Original gift credit not found" },
        { status: 404 }
      );
    }

    const { error: gcErr } = await supabaseAdmin
      .from("gift_credits")
      .insert({
        user_id: user.id,
        tier: originalGC.tier,
        quantity: originalGC.quantity,
        quantity_used: 0,
        stripe_payment_intent_id: originalGC.stripe_payment_intent_id || "",
        amount_paid: 0,
      });

    if (gcErr) {
      console.error("Failed to create gift credit for claimer:", gcErr);
      transferError = "Failed to transfer gift credit";
    }
  }

  if (transferError) {
    return NextResponse.json({ error: transferError }, { status: 500 });
  }

  // Mark the gifted_items record as claimed
  const { error: updateError } = await supabaseAdmin
    .from("gifted_items")
    .update({
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      status: "claimed",
    })
    .eq("id", item.id);

  if (updateError) {
    console.error("Failed to update gifted item:", updateError);
    return NextResponse.json(
      { error: "Failed to update claim status" },
      { status: 500 }
    );
  }

  // Send notification email to sender
  await sendClaimNotification(item.sender_id as string, user);

  return NextResponse.json({
    success: true,
    redirectTo: "/dashboard",
  });
}

// Handle unified message_uses claim
async function handleMessageUseClaim(
  messageUse: Record<string, unknown>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const status = messageUse.status as string;
  const useType = messageUse.use_type as string;

  if (status === "claimed" || (messageUse.claimer_id && messageUse.claimed_at)) {
    return NextResponse.json(
      { error: "This has already been claimed" },
      { status: 400 }
    );
  }

  if (useType === "gift") {
    // Create a new message_credit for the claimer (same format, quantity=1)
    const { error: creditError } = await supabaseAdmin
      .from("message_credits")
      .insert({
        user_id: user.id,
        format: messageUse.format,
        quantity: 1,
        quantity_used: 0,
        amount_paid: 0,
      });

    if (creditError) {
      console.error("Failed to create message credit for claimer:", creditError);
      return NextResponse.json(
        { error: "Failed to transfer gift" },
        { status: 500 }
      );
    }

    // Update the message_use
    await supabaseAdmin
      .from("message_uses")
      .update({
        claimer_id: user.id,
        claimed_at: new Date().toISOString(),
        status: "claimed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageUse.id);
  } else if (useType === "request") {
    // For requests: the claimer records content for the requester
    // Update the message_use to show it's been claimed/accepted
    await supabaseAdmin
      .from("message_uses")
      .update({
        claimer_id: user.id,
        claimed_at: new Date().toISOString(),
        status: "draft", // Now the claimer can record
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageUse.id);
  }

  // Send notification email to the original owner
  await sendClaimNotification(messageUse.user_id as string, user);

  return NextResponse.json({
    success: true,
    redirectTo: "/dashboard",
  });
}

async function sendClaimNotification(
  senderId: string,
  claimer: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  try {
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", senderId)
      .single();

    if (senderProfile?.email) {
      const claimerName =
        (claimer.user_metadata?.full_name as string) ||
        claimer.email?.split("@")[0] ||
        "Someone";

      await resend.emails.send({
        from: "SendForGood <hello@sendforgood.com>",
        to: senderProfile.email,
        subject: `${claimerName} claimed your gift!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #FDF8F0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background-color: rgba(45, 80, 22, 0.1); border-radius: 50%; padding: 16px;">
                <span style="font-size: 32px;">&#x1F389;</span>
              </div>
            </div>
            <h1 style="color: #1B2A4A; text-align: center; font-size: 24px; margin-bottom: 8px;">
              Your gift was claimed!
            </h1>
            <p style="color: #6B7280; text-align: center; font-size: 16px;">
              <strong style="color: #1B2A4A;">${claimerName}</strong> claimed the gift you sent.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
              SendForGood &mdash; Gifts that keep on giving
            </p>
          </div>
        `,
      });
    }
  } catch (emailError) {
    console.error("Failed to send claim notification email:", emailError);
  }
}
