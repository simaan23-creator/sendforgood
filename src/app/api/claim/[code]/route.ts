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

  const { data: item, error } = await supabaseAdmin
    .from("gifted_items")
    .select(
      "id, sender_id, recipient_name, item_type, tier, message_format, delivery_type, message, status"
    )
    .eq("claim_code", code)
    .single();

  if (error || !item) {
    return NextResponse.json(
      { error: "Gift not found or invalid claim code" },
      { status: 404 }
    );
  }

  // Get sender's first name
  const { data: senderProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", item.sender_id)
    .single();

  const senderFullName = senderProfile?.full_name || "Someone";
  const senderFirstName = senderFullName.split(" ")[0];

  return NextResponse.json({
    gift: {
      id: item.id,
      recipient_name: item.recipient_name,
      item_type: item.item_type,
      tier: item.tier,
      message_format: item.message_format,
      delivery_type: item.delivery_type,
      message: item.message,
      status: item.status,
      sender_first_name: senderFirstName,
    },
  });
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

  // Find the gifted item
  const { data: item, error: findError } = await supabaseAdmin
    .from("gifted_items")
    .select("*")
    .eq("claim_code", code)
    .single();

  if (findError || !item) {
    return NextResponse.json(
      { error: "Gift not found or invalid claim code" },
      { status: 404 }
    );
  }

  if (item.status === "claimed") {
    return NextResponse.json(
      { error: "This gift has already been claimed" },
      { status: 400 }
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

  // Transfer the item based on type
  let transferError: string | null = null;

  if (item.item_type === "letter") {
    // Get the original letter data
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

    // Create a new letter for the claimer
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
    // Get the original voice message
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

    // Create a new voice message slot for the claimer
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
    // Get the original gift credit
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

    // Create a new gift credit for the claimer
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
  try {
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", item.sender_id)
      .single();

    if (senderProfile?.email) {
      const claimerName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Someone";

      let itemLabel = "gift";
      if (item.item_type === "letter") itemLabel = "letter";
      else if (item.item_type === "voice_message") itemLabel = "voice message";
      else if (item.item_type === "gift_credit") itemLabel = "gift credit";

      await resend.emails.send({
        from: "SendForGood <hello@sendforgood.com>",
        to: senderProfile.email,
        subject: `${claimerName} claimed your gift!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #FDF8F0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background-color: rgba(45, 80, 22, 0.1); border-radius: 50%; padding: 16px;">
                <span style="font-size: 32px;">🎉</span>
              </div>
            </div>
            <h1 style="color: #1B2A4A; text-align: center; font-size: 24px; margin-bottom: 8px;">
              Your gift was claimed!
            </h1>
            <p style="color: #6B7280; text-align: center; font-size: 16px;">
              <strong style="color: #1B2A4A;">${claimerName}</strong> claimed the ${itemLabel} you sent.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
              SendForGood — Gifts that keep on giving
            </p>
          </div>
        `,
      });
    }
  } catch (emailError) {
    console.error("Failed to send claim notification email:", emailError);
    // Don't fail — the claim itself succeeded
  }

  return NextResponse.json({
    success: true,
    redirectTo: "/dashboard",
  });
}
