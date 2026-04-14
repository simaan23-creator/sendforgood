import { NextResponse } from "next/server";
import { stripe, TIER_PRICES } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata!;

    try {
      // Check order type
      if (metadata.isVaultOrder === "true") {
        await handleVaultCreditOrder(session, metadata);
      } else if (metadata.isVoiceMessageOrder === "true") {
        await handleVoiceMessageOrder(session, metadata);
      } else if (metadata.isLetterOrder === "true") {
        await handleLetterOrder(session, metadata);
      } else if (metadata.isCartOrder === "true") {
        await handleCartOrder(session, metadata);
      } else if (metadata.isBusinessOrder === "true") {
        await handleBusinessOrder(session, metadata);
      } else {
        await handleIndividualOrder(session, metadata);
      }

      // Process affiliate referral if affiliate code present
      await processAffiliateReferral(session, metadata);
    } catch (error) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Individual Order Handler (existing logic)
   ═══════════════════════════════════════════════════════════════════════════ */

async function handleIndividualOrder(
  session: { amount_total: number | null; payment_intent: string | unknown; customer_email: string | null },
  metadata: Record<string, string>
) {
  // Find or create user
  let userId = metadata.userId;

  if (!userId) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === metadata.email
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: metadata.email,
        email_confirm: true,
        user_metadata: { full_name: metadata.fullName },
      });

      if (userError) throw userError;
      userId = newUser.user.id;
    }
  }

  // Ensure profile row exists before creating recipient (FK dependency)
  await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: metadata.email || session.customer_email || '',
      full_name: metadata.fullName || '',
    }, { onConflict: 'id' });

  // Create recipient
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from("recipients")
    .insert({
      user_id: userId,
      name: metadata.recipientName,
      relationship: metadata.relationship,
      address_line1: metadata.addressLine1,
      address_line2: metadata.addressLine2 || null,
      city: metadata.city,
      state: metadata.state,
      postal_code: metadata.postalCode,
      country: metadata.country || "US",
      age: metadata.recipientAge || null,
      gender: metadata.recipientGender || null,
      interests: metadata.interests || null,
      card_message: metadata.cardMessage || null,
      gift_notes: metadata.giftNotes || null,
    })
    .select()
    .single();

  if (recipientError) throw recipientError;

  // Create occasion
  const { data: occasion, error: occasionError } = await supabaseAdmin
    .from("occasions")
    .insert({
      recipient_id: recipient.id,
      type: metadata.occasionType,
      occasion_date: metadata.occasionDate,
      label: metadata.occasionLabel || null,
    })
    .select()
    .single();

  if (occasionError) throw occasionError;

  // Create order
  const years = parseInt(metadata.years);
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      recipient_id: recipient.id,
      occasion_id: occasion.id,
      tier: metadata.tier,
      years_purchased: years,
      years_remaining: years,
      amount_paid: session.amount_total,
      stripe_payment_intent_id: session.payment_intent as string,
      status: "active",
      executor_name: metadata.executorName || null,
      executor_email: metadata.executorEmail || null,
      executor_phone: metadata.executorPhone || null,
      executor_address: metadata.executorAddress || null,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create shipment records for each year
  const occasionDate = new Date(metadata.occasionDate);
  const shipments = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < years; i++) {
    const shipDate = new Date(occasionDate);
    shipDate.setFullYear(currentYear + i);

    if (shipDate < new Date()) {
      shipDate.setFullYear(shipDate.getFullYear() + 1);
    }

    shipments.push({
      order_id: order.id,
      scheduled_date: shipDate.toISOString().split("T")[0],
      status: "pending",
      gift_description: `${metadata.tier} tier gift for ${metadata.recipientName}`,
    });
  }

  const { error: shipmentError } = await supabaseAdmin
    .from("shipments")
    .insert(shipments);

  if (shipmentError) throw shipmentError;

  // Create letter records if letter add-on was purchased
  if (metadata.addLetter === "true") {
    const letterRecords = [];
    for (let i = 0; i < years; i++) {
      const letterDate = new Date(occasionDate);
      letterDate.setFullYear(currentYear + i);
      if (letterDate < new Date()) {
        letterDate.setFullYear(letterDate.getFullYear() + 1);
      }
      letterRecords.push({
        user_id: userId,
        recipient_id: recipient.id,
        letter_type: "annual",
        title: `Letter for ${metadata.recipientName} — Year ${i + 1}`,
        content: "",
        scheduled_date: letterDate.toISOString().split("T")[0],
        status: "draft",
      });
    }
    await supabaseAdmin.from("letters").insert(letterRecords);
  }

  const customerEmail = metadata.email || session.customer_email!;
  const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

  // Send confirmation email to customer
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: customerEmail,
      subject: "Your Gift Plan is Confirmed! \u{1F381}",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
          <h1 style="color: #1a2744;">Your gift plan is all set! \u{1F389}</h1>
          <p>Thank you for choosing SendForGood. We're honored to help you send something meaningful.</p>
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Order Summary</h2>
            <p><strong>Recipient:</strong> ${metadata.recipientName}</p>
            <p><strong>Occasion:</strong> ${metadata.occasionType}</p>
            <p><strong>Tier:</strong> ${metadata.tier}</p>
            <p><strong>Duration:</strong> ${years} year${years > 1 ? "s" : ""}</p>
            <p><strong>Total paid:</strong> ${amountFormatted}</p>
          </div>
          <p>We'll take care of everything from here. Your first gift will be on its way before the occasion date.</p>
          <p>Questions? Reply to this email or contact us at <a href="mailto:support@sendforgood.com">support@sendforgood.com</a></p>
          <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send customer confirmation email:", emailError);
  }

  // Send owner notification email to Simaan
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `\u{1F381} New Order! ${metadata.tier} tier \u2014 ${metadata.recipientName} (${years} yr${years > 1 ? "s" : ""}) \u2014 ${amountFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">New Order Received! \u{1F389}</h1>
          <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Customer:</strong> ${customerEmail}</p>
            <p><strong>Recipient:</strong> ${metadata.recipientName}</p>
            <p><strong>Relationship:</strong> ${metadata.relationship || "N/A"}</p>
            <p><strong>Occasion:</strong> ${metadata.occasionType} (${metadata.occasionDate})</p>
            <p><strong>Tier:</strong> ${metadata.tier}</p>
            <p><strong>Years:</strong> ${years}</p>
            <p><strong>Amount:</strong> ${amountFormatted}</p>
          </div>
          <div style="background: #fff8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Delivery Address</h2>
            <p>${metadata.recipientName}<br/>
            ${metadata.addressLine1}${metadata.addressLine2 ? "<br/>" + metadata.addressLine2 : ""}<br/>
            ${metadata.city}, ${metadata.state} ${metadata.postalCode}<br/>
            ${metadata.country || "US"}</p>
          </div>
          <div style="background: #f0fff4; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Recipient Profile</h2>
            <p><strong>Age:</strong> ${metadata.recipientAge || "Not provided"}</p>
            <p><strong>Gender:</strong> ${metadata.recipientGender || "Not provided"}</p>
            <p><strong>Interests:</strong> ${metadata.interests || "None selected"}</p>
            <p><strong>Card Message:</strong> ${metadata.cardMessage || "Not provided"}</p>
            <p><strong>Gift Notes:</strong> ${metadata.giftNotes || "Not provided"}</p>
          </div>
          <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send owner notification email:", emailError);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cart Order Handler
   ═══════════════════════════════════════════════════════════════════════════ */

interface CartItemMeta {
  recipientName: string;
  relationship: string;
  occasionType: string;
  occasionLabel: string;
  occasionDate: string;
  years: number;
  tier: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  recipientAge: string;
  recipientGender: string;
  interests: string;
  giftNotes: string;
  cardMessage: string;
  petType: string;
  executorName: string;
  executorEmail: string;
  executorPhone: string;
  executorAddress: string;
  unitPrice: number;
  totalPrice: number;
}

interface LetterItemMeta {
  id: string;
  itemType: "letter";
  recipientName: string;
  recipientEmail: string;
  letterType: "annual" | "milestone";
  deliveryType: "digital" | "physical" | "physical_photo";
  quantity: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  unitPrice: number;
  totalPrice: number;
}

interface VoiceItemMeta {
  id: string;
  itemType: "voice";
  audioQuantity: number;
  videoQuantity: number;
  unitPriceAudio: number;
  unitPriceVideo: number;
  totalPrice: number;
}

async function handleCartOrder(
  session: { amount_total: number | null; payment_intent: string | unknown; customer_email: string | null },
  metadata: Record<string, string>
) {
  // Reassemble cart items JSON from chunks
  let cartJson = "";
  let chunkIndex = 0;
  while (metadata[`cart_items_${chunkIndex}`] !== undefined) {
    cartJson += metadata[`cart_items_${chunkIndex}`];
    chunkIndex++;
  }

  const cartItems: CartItemMeta[] = cartJson ? JSON.parse(cartJson) : [];

  // Reassemble letter items JSON from chunks
  let letterJson = "";
  let letterChunkIndex = 0;
  while (metadata[`letter_items_${letterChunkIndex}`] !== undefined) {
    letterJson += metadata[`letter_items_${letterChunkIndex}`];
    letterChunkIndex++;
  }

  const letterItems: LetterItemMeta[] = letterJson ? JSON.parse(letterJson) : [];

  // Reassemble voice items JSON from chunks
  let voiceJson = "";
  let voiceChunkIndex = 0;
  while (metadata[`voice_items_${voiceChunkIndex}`] !== undefined) {
    voiceJson += metadata[`voice_items_${voiceChunkIndex}`];
    voiceChunkIndex++;
  }

  const voiceItems: VoiceItemMeta[] = voiceJson ? JSON.parse(voiceJson) : [];

  // Find or create user
  let userId = metadata.userId;

  if (!userId) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === metadata.email
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: metadata.email,
        email_confirm: true,
        user_metadata: { full_name: metadata.fullName },
      });

      if (userError) throw userError;
      userId = newUser.user.id;
    }
  }

  // Ensure profile row exists before creating recipients (FK dependency)
  await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: metadata.email || session.customer_email || '',
      full_name: metadata.fullName || '',
    }, { onConflict: 'id' });

  // Process each cart item
  const currentYear = new Date().getFullYear();
  const processedItems: Array<{ recipientName: string; tier: string; years: number; occasionType: string; totalPrice: number }> = [];

  for (const item of cartItems) {
    const tierInfo = TIER_PRICES[item.tier];
    const itemAmount = tierInfo ? tierInfo.price * item.years : 0;

    // Create recipient
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from("recipients")
      .insert({
        user_id: userId,
        name: item.recipientName,
        relationship: item.relationship,
        address_line1: item.addressLine1,
        address_line2: item.addressLine2 || null,
        city: item.city,
        state: item.state,
        postal_code: item.postalCode,
        country: item.country || "US",
        age: item.recipientAge || null,
        gender: item.recipientGender || null,
        interests: item.interests || null,
        card_message: item.cardMessage || null,
        gift_notes: item.giftNotes || null,
      })
      .select()
      .single();

    if (recipientError) throw recipientError;

    // Create occasion
    const { data: occasion, error: occasionError } = await supabaseAdmin
      .from("occasions")
      .insert({
        recipient_id: recipient.id,
        type: item.occasionType,
        occasion_date: item.occasionDate,
        label: item.occasionLabel || null,
      })
      .select()
      .single();

    if (occasionError) throw occasionError;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        recipient_id: recipient.id,
        occasion_id: occasion.id,
        tier: item.tier,
        years_purchased: item.years,
        years_remaining: item.years,
        amount_paid: itemAmount,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "active",
        executor_name: item.executorName || null,
        executor_email: item.executorEmail || null,
        executor_phone: item.executorPhone || null,
        executor_address: item.executorAddress || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create shipment records for each year
    const occasionDate = new Date(item.occasionDate);
    const shipments = [];

    for (let i = 0; i < item.years; i++) {
      const shipDate = new Date(occasionDate);
      shipDate.setFullYear(currentYear + i);

      if (shipDate < new Date()) {
        shipDate.setFullYear(shipDate.getFullYear() + 1);
      }

      shipments.push({
        order_id: order.id,
        scheduled_date: shipDate.toISOString().split("T")[0],
        status: "pending",
        gift_description: `${item.tier} tier gift for ${item.recipientName}`,
      });
    }

    const { error: shipmentError } = await supabaseAdmin
      .from("shipments")
      .insert(shipments);

    if (shipmentError) throw shipmentError;

    processedItems.push({
      recipientName: item.recipientName,
      tier: item.tier,
      years: item.years,
      occasionType: item.occasionType,
      totalPrice: item.totalPrice,
    });
  }

  // Process letter items
  const processedLetters: Array<{ recipientName: string; letterType: string; deliveryType: string; quantity: number; totalPrice: number }> = [];

  for (const letter of letterItems) {
    // Create recipient for letter
    const { data: letterRecipient, error: lrError } = await supabaseAdmin
      .from("recipients")
      .insert({
        user_id: userId,
        name: letter.recipientName,
        address_line1: letter.addressLine1 || null,
        address_line2: letter.addressLine2 || null,
        city: letter.city || null,
        state: letter.state || null,
        postal_code: letter.postalCode || null,
        country: letter.country || "US",
      })
      .select()
      .single();

    if (lrError) throw lrError;

    const pricePerUnit = letter.unitPrice;

    if (letter.letterType === "annual") {
      for (let i = 0; i < letter.quantity; i++) {
        const deliveryDate = new Date();
        deliveryDate.setFullYear(currentYear + i);

        await supabaseAdmin.from("letters").insert({
          user_id: userId,
          recipient_id: letterRecipient.id,
          letter_type: "annual",
          title: `Letter for ${letter.recipientName} — Year ${i + 1}`,
          content: "",
          scheduled_date: deliveryDate.toISOString().split("T")[0],
          status: "draft",
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: pricePerUnit,
          delivery_type: letter.deliveryType,
          recipient_email: letter.recipientEmail || null,
        });
      }
    } else {
      // Milestone letters
      await supabaseAdmin.from("letters").insert({
        user_id: userId,
        recipient_id: letterRecipient.id,
        letter_type: "milestone",
        title: `Milestone Letter for ${letter.recipientName}`,
        content: "",
        status: "draft",
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: pricePerUnit,
        delivery_type: letter.deliveryType,
        recipient_email: letter.recipientEmail || null,
      });

      // If it's a bundle, create remaining draft letters
      if (letter.quantity > 1) {
        const draftLetters = [];
        for (let i = 1; i < letter.quantity; i++) {
          draftLetters.push({
            user_id: userId,
            recipient_id: letterRecipient.id,
            letter_type: "milestone" as const,
            title: `Milestone Letter ${i + 1} for ${letter.recipientName}`,
            content: "",
            status: "draft" as const,
            stripe_payment_intent_id: session.payment_intent as string,
            amount_paid: pricePerUnit,
            delivery_type: letter.deliveryType,
            recipient_email: letter.recipientEmail || null,
          });
        }
        await supabaseAdmin.from("letters").insert(draftLetters);
      }
    }

    processedLetters.push({
      recipientName: letter.recipientName,
      letterType: letter.letterType,
      deliveryType: letter.deliveryType,
      quantity: letter.quantity,
      totalPrice: letter.totalPrice,
    });
  }

  // Process voice message items — create draft voice_message records
  const voiceAudioCount = parseInt(metadata.voiceAudio) || 0;
  const voiceVideoCount = parseInt(metadata.voiceVideo) || 0;

  const voiceDraftMessages: Array<{
    user_id: string;
    letter_type: string;
    title: string;
    status: string;
    stripe_payment_intent_id: string;
    amount_paid: number;
    message_format: string;
  }> = [];

  for (let i = 0; i < voiceAudioCount; i++) {
    voiceDraftMessages.push({
      user_id: userId,
      letter_type: "annual",
      title: `Audio Message ${i + 1}`,
      status: "draft",
      stripe_payment_intent_id: session.payment_intent as string,
      amount_paid: 500,
      message_format: "audio",
    });
  }

  for (let i = 0; i < voiceVideoCount; i++) {
    voiceDraftMessages.push({
      user_id: userId,
      letter_type: "annual",
      title: `Video Message ${i + 1}`,
      status: "draft",
      stripe_payment_intent_id: session.payment_intent as string,
      amount_paid: 1000,
      message_format: "video",
    });
  }

  if (voiceDraftMessages.length > 0) {
    await supabaseAdmin.from("voice_messages").insert(voiceDraftMessages);
  }

  const customerEmail = metadata.email || session.customer_email!;
  const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

  // Build items summary for emails
  const itemRows = processedItems
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.recipientName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.occasionType}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.tier}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.years} yr${item.years > 1 ? "s" : ""}</td>
        </tr>`
    )
    .join("");

  const letterRows = processedLetters
    .map(
      (l) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.recipientName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.letterType}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.deliveryType === "digital" ? "Digital" : l.deliveryType === "physical_photo" ? "Physical + Photo" : "Physical"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.quantity}</td>
        </tr>`
    )
    .join("");

  // Build voice message summary for emails
  const voiceRows = (voiceAudioCount > 0 || voiceVideoCount > 0)
    ? `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${voiceAudioCount} audio + ${voiceVideoCount} video</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">Draft</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">Email</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${voiceAudioCount + voiceVideoCount}</td>
      </tr>`
    : "";

  // Send customer confirmation email
  try {
    const subjectParts = [];
    if (cartItems.length > 0) subjectParts.push(`${cartItems.length} gift${cartItems.length > 1 ? "s" : ""}`);
    if (letterItems.length > 0) subjectParts.push(`${letterItems.length} letter${letterItems.length > 1 ? "s" : ""}`);
    if (voiceAudioCount + voiceVideoCount > 0) subjectParts.push(`${voiceAudioCount + voiceVideoCount} voice/video message${(voiceAudioCount + voiceVideoCount) > 1 ? "s" : ""}`);

    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: customerEmail,
      subject: `Your Order is Confirmed! \u{1F381} ${subjectParts.join(" + ")} set up`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
          <h1 style="color: #1a2744;">Your order is all set! \u{1F389}</h1>
          <p>Thank you for choosing SendForGood. We're honored to help you send something meaningful.</p>
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Order Summary</h2>
            ${cartItems.length > 0 ? `<p><strong>Gifts:</strong> ${cartItems.length}</p>` : ""}
            ${letterItems.length > 0 ? `<p><strong>Letters:</strong> ${letterItems.length}</p>` : ""}
            ${(voiceAudioCount + voiceVideoCount) > 0 ? `<p><strong>Voice Messages:</strong> ${voiceAudioCount} audio, ${voiceVideoCount} video</p>` : ""}
            <p><strong>Total paid:</strong> ${amountFormatted}</p>
          </div>
          ${cartItems.length > 0 ? `
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">Your Gifts</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="background: #f5ede0;">
                <th style="padding: 8px; text-align: left;">Recipient</th>
                <th style="padding: 8px; text-align: left;">Occasion</th>
                <th style="padding: 8px; text-align: left;">Tier</th>
                <th style="padding: 8px; text-align: left;">Duration</th>
              </tr>
              ${itemRows}
            </table>
          </div>` : ""}
          ${letterItems.length > 0 ? `
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">Your Legacy Letters</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="background: #f5ede0;">
                <th style="padding: 8px; text-align: left;">Recipient</th>
                <th style="padding: 8px; text-align: left;">Type</th>
                <th style="padding: 8px; text-align: left;">Delivery</th>
                <th style="padding: 8px; text-align: left;">Qty</th>
              </tr>
              ${letterRows}
            </table>
          </div>` : ""}
          ${(voiceAudioCount + voiceVideoCount) > 0 ? `
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">Your Voice &amp; Video Messages</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="background: #f5ede0;">
                <th style="padding: 8px; text-align: left;">Messages</th>
                <th style="padding: 8px; text-align: left;">Status</th>
                <th style="padding: 8px; text-align: left;">Delivery</th>
                <th style="padding: 8px; text-align: left;">Qty</th>
              </tr>
              ${voiceRows}
            </table>
          </div>` : ""}
          <p>We'll take care of everything from here. Each recipient will receive their gift, letter, or voice message on time.</p>
          <p>Questions? Reply to this email or contact us at <a href="mailto:support@sendforgood.com">support@sendforgood.com</a></p>
          <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send cart confirmation email:", emailError);
  }

  // Send owner notification email
  try {
    const ownerItemRows = cartItems
      .map(
        (item) =>
          `<tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${item.recipientName}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${item.relationship || "N/A"}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${item.occasionType} (${item.occasionDate})</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${item.tier}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${item.years}yr</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${item.city}, ${item.state}</td>
          </tr>`
      )
      .join("");

    const ownerLetterRows = letterItems
      .map(
        (l) =>
          `<tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.recipientName}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.letterType}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.deliveryType}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.quantity}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">$${(l.totalPrice / 100).toFixed(0)}</td>
          </tr>`
      )
      .join("");

    const ownerVoiceRows = (voiceAudioCount > 0 || voiceVideoCount > 0)
      ? `<tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${voiceAudioCount} audio + ${voiceVideoCount} video</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">Draft</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${voiceAudioCount + voiceVideoCount}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">$${((voiceAudioCount * 500 + voiceVideoCount * 1000) / 100).toFixed(0)}</td>
          </tr>`
      : "";

    const ownerSubjectParts = [];
    if (cartItems.length > 0) ownerSubjectParts.push(`${cartItems.length} gift${cartItems.length > 1 ? "s" : ""}`);
    if (letterItems.length > 0) ownerSubjectParts.push(`${letterItems.length} letter${letterItems.length > 1 ? "s" : ""}`);
    if (voiceAudioCount + voiceVideoCount > 0) ownerSubjectParts.push(`${voiceAudioCount + voiceVideoCount} voice/video`);

    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `\u{1F6D2} New Cart Order! ${ownerSubjectParts.join(" + ")} \u2014 ${amountFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">New Cart Order! \u{1F389}</h1>
          <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Customer:</strong> ${metadata.fullName} (${customerEmail})</p>
            ${cartItems.length > 0 ? `<p><strong>Gifts:</strong> ${cartItems.length}</p>` : ""}
            ${letterItems.length > 0 ? `<p><strong>Letters:</strong> ${letterItems.length}</p>` : ""}
            ${(voiceAudioCount + voiceVideoCount) > 0 ? `<p><strong>Voice Messages:</strong> ${voiceAudioCount} audio, ${voiceVideoCount} video</p>` : ""}
            <p><strong>Total Amount:</strong> ${amountFormatted}</p>
          </div>
          ${cartItems.length > 0 ? `
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">Gifts</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #e8f0ff;">
                <th style="padding: 6px 8px; text-align: left;">Recipient</th>
                <th style="padding: 6px 8px; text-align: left;">Relationship</th>
                <th style="padding: 6px 8px; text-align: left;">Occasion</th>
                <th style="padding: 6px 8px; text-align: left;">Tier</th>
                <th style="padding: 6px 8px; text-align: left;">Duration</th>
                <th style="padding: 6px 8px; text-align: left;">Location</th>
              </tr>
              ${ownerItemRows}
            </table>
          </div>` : ""}
          ${letterItems.length > 0 ? `
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">Legacy Letters</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #fff3e0;">
                <th style="padding: 6px 8px; text-align: left;">Recipient</th>
                <th style="padding: 6px 8px; text-align: left;">Type</th>
                <th style="padding: 6px 8px; text-align: left;">Delivery</th>
                <th style="padding: 6px 8px; text-align: left;">Qty</th>
                <th style="padding: 6px 8px; text-align: left;">Price</th>
              </tr>
              ${ownerLetterRows}
            </table>
          </div>` : ""}
          ${(voiceAudioCount + voiceVideoCount) > 0 ? `
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">Voice &amp; Video Messages</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #fce4ec;">
                <th style="padding: 6px 8px; text-align: left;">Messages</th>
                <th style="padding: 6px 8px; text-align: left;">Status</th>
                <th style="padding: 6px 8px; text-align: left;">Qty</th>
                <th style="padding: 6px 8px; text-align: left;">Price</th>
              </tr>
              ${ownerVoiceRows}
            </table>
          </div>` : ""}
          <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send cart owner notification email:", emailError);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Business Order Handler
   ═══════════════════════════════════════════════════════════════════════════ */

interface BusinessRecipient {
  recipientName: string;
  relationship: string;
  occasionType: string;
  occasionLabel: string;
  occasionDate: string;
  years: number;
  tier: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  cardMessage: string;
  giftNotes: string;
}

async function handleBusinessOrder(
  session: { amount_total: number | null; payment_intent: string | unknown; customer_email: string | null },
  metadata: Record<string, string>
) {
  // Reassemble recipients JSON from chunks
  let recipientsJson = "";
  let chunkIndex = 0;
  while (metadata[`recipients_${chunkIndex}`] !== undefined) {
    recipientsJson += metadata[`recipients_${chunkIndex}`];
    chunkIndex++;
  }

  const recipients: BusinessRecipient[] = JSON.parse(recipientsJson);

  // Find or create user
  let userId = metadata.userId;

  if (!userId) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === metadata.email
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: metadata.email,
        email_confirm: true,
        user_metadata: { full_name: metadata.fullName },
      });

      if (userError) throw userError;
      userId = newUser.user.id;
    }
  }

  // Update profile with business info
  await supabaseAdmin
    .from("profiles")
    .update({
      account_type: "business",
      company_name: metadata.companyName,
      company_website: metadata.companyWebsite || null,
      industry: metadata.industry,
    })
    .eq("id", userId);

  // Create business order
  const { data: businessOrder, error: boError } = await supabaseAdmin
    .from("business_orders")
    .insert({
      user_id: userId,
      company_name: metadata.companyName,
      sender_name: metadata.fullName,
      status: "active",
    })
    .select()
    .single();

  if (boError) throw boError;

  // Process each recipient
  const currentYear = new Date().getFullYear();

  for (const r of recipients) {
    const tierInfo = TIER_PRICES[r.tier];
    const recipientAmount = tierInfo ? tierInfo.price * r.years : 0;

    // Create business_recipient record
    await supabaseAdmin
      .from("business_recipients")
      .insert({
        business_order_id: businessOrder.id,
        user_id: userId,
        recipient_name: r.recipientName,
        relationship: r.relationship || null,
        occasion_type: r.occasionType,
        occasion_date: r.occasionDate,
        occasion_label: r.occasionLabel || null,
        address_line1: r.addressLine1,
        address_line2: r.addressLine2 || null,
        city: r.city,
        state: r.state,
        postal_code: r.postalCode,
        country: "US",
        tier: r.tier,
        years_purchased: r.years,
        card_message: r.cardMessage || null,
        gift_notes: r.giftNotes || null,
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: recipientAmount,
        status: "active",
      });

    // Create individual recipient record
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from("recipients")
      .insert({
        user_id: userId,
        name: r.recipientName,
        relationship: r.relationship || null,
        address_line1: r.addressLine1,
        address_line2: r.addressLine2 || null,
        city: r.city,
        state: r.state,
        postal_code: r.postalCode,
        country: "US",
      })
      .select()
      .single();

    if (recipientError) throw recipientError;

    // Create occasion
    const { data: occasion, error: occasionError } = await supabaseAdmin
      .from("occasions")
      .insert({
        recipient_id: recipient.id,
        type: r.occasionType,
        occasion_date: r.occasionDate,
        label: r.occasionLabel || null,
      })
      .select()
      .single();

    if (occasionError) throw occasionError;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        recipient_id: recipient.id,
        occasion_id: occasion.id,
        tier: r.tier,
        years_purchased: r.years,
        years_remaining: r.years,
        amount_paid: recipientAmount,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "active",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create shipment records for each year
    const occasionDate = new Date(r.occasionDate);
    const shipments = [];

    for (let i = 0; i < r.years; i++) {
      const shipDate = new Date(occasionDate);
      shipDate.setFullYear(currentYear + i);

      if (shipDate < new Date()) {
        shipDate.setFullYear(shipDate.getFullYear() + 1);
      }

      shipments.push({
        order_id: order.id,
        scheduled_date: shipDate.toISOString().split("T")[0],
        status: "pending",
        gift_description: `${r.tier} tier gift for ${r.recipientName} (${metadata.companyName})`,
      });
    }

    const { error: shipmentError } = await supabaseAdmin
      .from("shipments")
      .insert(shipments);

    if (shipmentError) throw shipmentError;
  }

  const customerEmail = metadata.email || session.customer_email!;
  const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

  // Build recipients summary for emails
  const recipientsList = recipients
    .map((r) => `${r.recipientName} (${r.tier}, ${r.years}yr, ${r.occasionType})`)
    .join(", ");

  // Send business confirmation email to customer
  try {
    const recipientRows = recipients
      .map(
        (r) =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.recipientName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.occasionType}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.tier}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.years} yr${r.years > 1 ? "s" : ""}</td>
          </tr>`
      )
      .join("");

    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: customerEmail,
      subject: `Your Business Gift Plan is Confirmed! \u{1F381} ${recipients.length} recipient${recipients.length > 1 ? "s" : ""} set up`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
          <h1 style="color: #1a2744;">Your business gift plan is all set! \u{1F389}</h1>
          <p>Thank you for choosing SendForGood for <strong>${metadata.companyName}</strong>. We're honored to help you build stronger relationships through thoughtful gifting.</p>
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Order Summary</h2>
            <p><strong>Company:</strong> ${metadata.companyName}</p>
            <p><strong>Recipients:</strong> ${recipients.length}</p>
            <p><strong>Total paid:</strong> ${amountFormatted}</p>
          </div>
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">Recipients</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="background: #f5ede0;">
                <th style="padding: 8px; text-align: left;">Name</th>
                <th style="padding: 8px; text-align: left;">Occasion</th>
                <th style="padding: 8px; text-align: left;">Tier</th>
                <th style="padding: 8px; text-align: left;">Duration</th>
              </tr>
              ${recipientRows}
            </table>
          </div>
          <p>We'll take care of everything from here. Each recipient will receive their gift on time, every year.</p>
          <p><a href="https://sendforgood.com/business/dashboard" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">View Your Dashboard</a></p>
          <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send business confirmation email:", emailError);
  }

  // Send owner notification email
  try {
    const recipientDetails = recipients
      .map(
        (r) =>
          `<tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.recipientName}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.relationship || "N/A"}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.occasionType} (${r.occasionDate})</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.tier}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.years}yr</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.city}, ${r.state}</td>
          </tr>`
      )
      .join("");

    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `\u{1F3E2} New Business Order! ${metadata.companyName} \u2014 ${recipients.length} recipients \u2014 ${amountFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">New Business Order! \u{1F389}</h1>
          <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Business Details</h2>
            <p><strong>Company:</strong> ${metadata.companyName}</p>
            <p><strong>Contact:</strong> ${metadata.fullName} (${customerEmail})</p>
            <p><strong>Industry:</strong> ${metadata.industry}</p>
            <p><strong>Website:</strong> ${metadata.companyWebsite || "N/A"}</p>
            <p><strong>Recipients:</strong> ${recipients.length}</p>
            <p><strong>Total Amount:</strong> ${amountFormatted}</p>
          </div>
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">All Recipients</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #e8f0ff;">
                <th style="padding: 6px 8px; text-align: left;">Name</th>
                <th style="padding: 6px 8px; text-align: left;">Relationship</th>
                <th style="padding: 6px 8px; text-align: left;">Occasion</th>
                <th style="padding: 6px 8px; text-align: left;">Tier</th>
                <th style="padding: 6px 8px; text-align: left;">Duration</th>
                <th style="padding: 6px 8px; text-align: left;">Location</th>
              </tr>
              ${recipientDetails}
            </table>
          </div>
          <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send owner notification email:", emailError);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Letter Order Handler
   ═══════════════════════════════════════════════════════════════════════════ */

async function handleLetterOrder(
  session: { amount_total: number | null; payment_intent: string | unknown; customer_email: string | null },
  metadata: Record<string, string>
) {
  // Reassemble letter content from chunks
  let letterContent = metadata.content || "";
  for (let i = 1; i <= 10; i++) {
    const chunk = metadata[`content_${i}`];
    if (chunk) letterContent += chunk;
  }

  // Find or create user
  let userId = metadata.userId;

  if (!userId) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === metadata.email
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: metadata.email,
        email_confirm: true,
        user_metadata: { full_name: metadata.fullName },
      });

      if (userError) throw userError;
      userId = newUser.user.id;
    }
  }

  // Ensure profile row exists
  await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: metadata.email || session.customer_email || "",
      full_name: metadata.fullName || "",
    }, { onConflict: "id" });

  // Create recipient
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from("recipients")
    .insert({
      user_id: userId,
      name: metadata.recipientName,
      relationship: metadata.relationship || null,
      address_line1: metadata.addressLine1 || null,
      address_line2: metadata.addressLine2 || null,
      city: metadata.city || null,
      state: metadata.state || null,
      postal_code: metadata.postalCode || null,
      country: "US",
    })
    .select()
    .single();

  if (recipientError) throw recipientError;

  const letterType = metadata.letterType as "annual" | "milestone";
  const years = parseInt(metadata.years) || 1;
  const milestoneQuantity = metadata.milestoneQuantity || "single";
  const deliveryType = metadata.deliveryType || "physical";
  const letterRecipientEmail = metadata.recipientEmail || null;

  if (letterType === "annual") {
    // Create one letter record per year
    const scheduledDate = metadata.scheduledDate ? new Date(metadata.scheduledDate) : new Date();
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < years; i++) {
      const deliveryDate = new Date(scheduledDate);
      deliveryDate.setFullYear(currentYear + i);

      if (deliveryDate < new Date()) {
        deliveryDate.setFullYear(deliveryDate.getFullYear() + 1);
      }

      await supabaseAdmin
        .from("letters")
        .insert({
          user_id: userId,
          recipient_id: recipient.id,
          letter_type: "annual",
          title: metadata.title || "",
          content: letterContent || "",
          scheduled_date: deliveryDate.toISOString().split("T")[0],
          status: letterContent ? "scheduled" : "draft",
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: Math.round((session.amount_total || 0) / years),
          executor_email: metadata.executorEmail || null,
          delivery_type: deliveryType,
          recipient_email: letterRecipientEmail,
        });
    }
  } else {
    // Milestone letters
    const count = milestoneQuantity === "bundle10" ? 10 : milestoneQuantity === "bundle5" ? 5 : 1;
    const priceEach = Math.round((session.amount_total || 0) / count);

    // Create the first milestone letter with the provided details
    await supabaseAdmin
      .from("letters")
      .insert({
        user_id: userId,
        recipient_id: recipient.id,
        letter_type: "milestone",
        title: metadata.title || "",
        content: letterContent || "",
        scheduled_date: metadata.scheduledDate || null,
        milestone_label: metadata.milestoneLabel || null,
        status: "draft",
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: priceEach,
        executor_email: metadata.executorEmail || null,
        delivery_type: deliveryType,
        recipient_email: letterRecipientEmail,
      });

    // If it's a bundle, create remaining draft letters
    if (count > 1) {
      const draftLetters = [];
      for (let i = 1; i < count; i++) {
        draftLetters.push({
          user_id: userId,
          recipient_id: recipient.id,
          letter_type: "milestone" as const,
          title: `Milestone Letter ${i + 1}`,
          content: "",
          status: "draft" as const,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: priceEach,
          executor_email: metadata.executorEmail || null,
          delivery_type: deliveryType,
          recipient_email: letterRecipientEmail,
        });
      }
      await supabaseAdmin.from("letters").insert(draftLetters);
    }
  }

  const customerEmail = metadata.email || session.customer_email!;
  const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

  // Send confirmation email to customer
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: customerEmail,
      subject: "Your Legacy Letter Is Scheduled! \u{2709}\u{FE0F}",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
          <h1 style="color: #1a2744;">Your letter is safe with us \u{2764}\u{FE0F}</h1>
          <p>Thank you for writing a Legacy Letter. Your words will be printed on premium stationery and delivered exactly when they matter most.</p>
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Letter Details</h2>
            <p><strong>Recipient:</strong> ${metadata.recipientName}</p>
            <p><strong>Type:</strong> ${letterType === "annual" ? `Annual (${years} year${years > 1 ? "s" : ""})` : `Milestone \u2014 ${metadata.milestoneLabel || "TBD"}`}</p>
            <p><strong>Title:</strong> ${metadata.title}</p>
            <p><strong>Total paid:</strong> ${amountFormatted}</p>
          </div>
          <p>You can edit your letter anytime from your <a href="https://sendforgood.com/dashboard" style="color: #C8A962;">dashboard</a> before it goes to print.</p>
          <p>About 2 weeks before each letter is scheduled, we'll send you a preview to confirm the final version.</p>
          <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send letter confirmation email:", emailError);
  }

  // Send owner notification email
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `\u{2709}\u{FE0F} New Legacy Letter! ${metadata.recipientName} \u2014 ${letterType} \u2014 ${amountFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">New Legacy Letter Order! \u{2709}\u{FE0F}</h1>
          <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Letter Details</h2>
            <p><strong>Customer:</strong> ${customerEmail}</p>
            <p><strong>Recipient:</strong> ${metadata.recipientName} (${metadata.relationship || "N/A"})</p>
            <p><strong>Type:</strong> ${letterType}</p>
            ${letterType === "annual" ? `<p><strong>Years:</strong> ${years}</p>` : `<p><strong>Milestone:</strong> ${metadata.milestoneLabel || "N/A"}</p><p><strong>Bundle:</strong> ${milestoneQuantity}</p>`}
            <p><strong>Amount:</strong> ${amountFormatted}</p>
            <p><strong>Executor:</strong> ${metadata.executorEmail || "None"}</p>
          </div>
          <div style="background: #fff8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Delivery Address</h2>
            <p>${metadata.recipientName}<br/>
            ${metadata.addressLine1}${metadata.addressLine2 ? "<br/>" + metadata.addressLine2 : ""}<br/>
            ${metadata.city}, ${metadata.state} ${metadata.postalCode}</p>
          </div>
          <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send letter owner notification email:", emailError);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Voice Message Order Handler
   ═══════════════════════════════════════════════════════════════════════════ */

async function handleVoiceMessageOrder(
  session: { amount_total: number | null; payment_intent: string | unknown; customer_email: string | null },
  metadata: Record<string, string>
) {
  // Find or create user
  let userId = metadata.userId;

  if (!userId) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === metadata.email
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: metadata.email,
        email_confirm: true,
        user_metadata: { full_name: metadata.fullName },
      });

      if (userError) throw userError;
      userId = newUser.user.id;
    }
  }

  // Ensure profile row exists
  await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: metadata.email || session.customer_email || "",
      full_name: metadata.fullName || "",
    }, { onConflict: "id" });

  // Create recipient
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from("recipients")
    .insert({
      user_id: userId,
      name: metadata.recipientName,
      relationship: metadata.relationship || null,
      country: "US",
    })
    .select()
    .single();

  if (recipientError) throw recipientError;

  const messageType = metadata.messageType as "annual" | "milestone";
  const messageFormat = metadata.messageFormat || "audio";
  const years = parseInt(metadata.years) || 1;
  const milestoneQuantity = metadata.milestoneQuantity || "single";

  if (messageType === "annual") {
    const scheduledDate = metadata.scheduledDate ? new Date(metadata.scheduledDate) : new Date();
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < years; i++) {
      const deliveryDate = new Date(scheduledDate);
      deliveryDate.setFullYear(currentYear + i);

      if (deliveryDate < new Date()) {
        deliveryDate.setFullYear(deliveryDate.getFullYear() + 1);
      }

      await supabaseAdmin
        .from("voice_messages")
        .insert({
          user_id: userId,
          recipient_id: recipient.id,
          letter_type: "annual",
          title: metadata.title || "",
          scheduled_date: deliveryDate.toISOString().split("T")[0],
          status: "draft",
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: Math.round((session.amount_total || 0) / years),
          recipient_email: metadata.recipientEmail || null,
          message_format: messageFormat,
        });
    }
  } else {
    const count = milestoneQuantity === "bundle10" ? 10 : milestoneQuantity === "bundle5" ? 5 : 1;
    const priceEach = Math.round((session.amount_total || 0) / count);

    await supabaseAdmin
      .from("voice_messages")
      .insert({
        user_id: userId,
        recipient_id: recipient.id,
        letter_type: "milestone",
        title: metadata.title || "",
        scheduled_date: metadata.scheduledDate || null,
        milestone_label: metadata.milestoneLabel || null,
        status: "draft",
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: priceEach,
        recipient_email: metadata.recipientEmail || null,
        message_format: messageFormat,
      });

    if (count > 1) {
      const draftMessages = [];
      for (let i = 1; i < count; i++) {
        draftMessages.push({
          user_id: userId,
          recipient_id: recipient.id,
          letter_type: "milestone" as const,
          title: `Milestone Voice Message ${i + 1}`,
          status: "draft" as const,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: priceEach,
          recipient_email: metadata.recipientEmail || null,
          message_format: messageFormat,
        });
      }
      await supabaseAdmin.from("voice_messages").insert(draftMessages);
    }
  }

  const customerEmail = metadata.email || session.customer_email!;
  const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

  // Send confirmation email to customer
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: customerEmail,
      subject: "Your Voice Message Is Scheduled! \uD83C\uDFA4",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
          <h1 style="color: #1a2744;">Your voice message is safe with us \u2764\uFE0F</h1>
          <p>Thank you for recording a Voice Message. Your words will be delivered by email exactly when they matter most.</p>
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Message Details</h2>
            <p><strong>Recipient:</strong> ${metadata.recipientName}</p>
            <p><strong>Type:</strong> ${messageType === "annual" ? `Annual (${years} year${years > 1 ? "s" : ""})` : `Milestone \u2014 ${metadata.milestoneLabel || "TBD"}`}</p>
            <p><strong>Title:</strong> ${metadata.title || "N/A"}</p>
            <p><strong>Total paid:</strong> ${amountFormatted}</p>
          </div>
          <p>You can re-record your message anytime from your <a href="https://sendforgood.com/dashboard" style="color: #C8A962;">dashboard</a> before it's delivered.</p>
          <p>About 2 weeks before each message is scheduled, we'll send you a reminder to confirm the final version.</p>
          <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send voice message confirmation email:", emailError);
  }

  // Send owner notification email
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `\uD83C\uDFA4 New Voice Message! ${metadata.recipientName} \u2014 ${messageType} \u2014 ${amountFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">New Voice Message Order! \uD83C\uDFA4</h1>
          <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Message Details</h2>
            <p><strong>Customer:</strong> ${customerEmail}</p>
            <p><strong>Recipient:</strong> ${metadata.recipientName} (${metadata.relationship || "N/A"})</p>
            <p><strong>Type:</strong> ${messageType}</p>
            ${messageType === "annual" ? `<p><strong>Years:</strong> ${years}</p>` : `<p><strong>Milestone:</strong> ${metadata.milestoneLabel || "N/A"}</p><p><strong>Bundle:</strong> ${milestoneQuantity}</p>`}
            <p><strong>Amount:</strong> ${amountFormatted}</p>
            <p><strong>Recipient Email:</strong> ${metadata.recipientEmail || "N/A"}</p>
          </div>
          <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send voice message owner notification email:", emailError);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Credit Order Handler
   ═══════════════════════════════════════════════════════════════════════════ */

async function handleVaultCreditOrder(
  session: { amount_total: number | null; payment_intent: string | unknown; customer_email: string | null },
  metadata: Record<string, string>
) {
  const userId = metadata.userId;
  const audioCredits = parseInt(metadata.audioCredits) || 0;
  const videoCredits = parseInt(metadata.videoCredits) || 0;

  // Insert credit record
  const { error: creditError } = await supabaseAdmin
    .from("memory_credits")
    .insert({
      user_id: userId,
      audio_credits: audioCredits,
      video_credits: videoCredits,
      stripe_payment_intent_id: session.payment_intent as string,
    });

  if (creditError) throw creditError;

  const customerEmail = metadata.email || session.customer_email!;
  const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

  // Send confirmation email to customer
  try {
    const creditParts = [];
    if (audioCredits > 0) creditParts.push(`${audioCredits} audio credit${audioCredits > 1 ? "s" : ""}`);
    if (videoCredits > 0) creditParts.push(`${videoCredits} video credit${videoCredits > 1 ? "s" : ""}`);

    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: customerEmail,
      subject: "Your Memory Vault credits are ready! \uD83D\uDD13",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
          <h1 style="color: #1a2744;">Your credits are ready! \uD83C\uDF89</h1>
          <p>Thank you for purchasing Memory Vault credits. You can now create a vault and share the link with your loved ones.</p>
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Credit Summary</h2>
            ${audioCredits > 0 ? `<p><strong>Audio Credits:</strong> ${audioCredits} ($5 each)</p>` : ""}
            ${videoCredits > 0 ? `<p><strong>Video Credits:</strong> ${videoCredits} ($10 each)</p>` : ""}
            <p><strong>Total paid:</strong> ${amountFormatted}</p>
          </div>
          <p>Credits are consumed only when someone records a message. Unused credits never expire.</p>
          <p style="margin-top: 24px;">
            <a href="https://sendforgood.com/request/create" style="background: #1a2744; color: #fdf8f0; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Create Your Vault</a>
          </p>
          <p style="margin-top: 40px;">With love,<br/><strong>The SendForGood Team</strong></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send vault credit confirmation email:", emailError);
  }

  // Send owner notification
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `\uD83D\uDD12 New Vault Credits! ${audioCredits} audio + ${videoCredits} video \u2014 ${amountFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">New Vault Credit Purchase!</h1>
          <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p><strong>Customer:</strong> ${customerEmail}</p>
            <p><strong>Audio Credits:</strong> ${audioCredits}</p>
            <p><strong>Video Credits:</strong> ${videoCredits}</p>
            <p><strong>Amount:</strong> ${amountFormatted}</p>
          </div>
          <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send vault credit owner notification:", emailError);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Affiliate Referral Processing
   ═══════════════════════════════════════════════════════════════════════════ */

async function processAffiliateReferral(
  session: { amount_total: number | null; payment_intent: string | unknown; customer_email: string | null; id?: string },
  metadata: Record<string, string>
) {
  const affiliateCode = metadata.affiliate_code;
  if (!affiliateCode) return;

  try {
    // Look up the affiliate by code
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from("affiliates")
      .select("*")
      .eq("code", affiliateCode)
      .eq("active", true)
      .single();

    if (affError || !affiliate) {
      console.log(`Affiliate code "${affiliateCode}" not found or inactive`);
      return;
    }

    const customerEmail = metadata.email || session.customer_email || "";
    const amountPaid = session.amount_total || 0; // in cents

    // Check if this customer has purchased before (to determine first vs repeat)
    const { count } = await supabaseAdmin
      .from("affiliate_referrals")
      .select("*", { count: "exact", head: true })
      .eq("customer_email", customerEmail);

    const isFirstPurchase = !count || count === 0;
    const referralType = isFirstPurchase ? "first" : "repeat";
    const commissionRate = isFirstPurchase
      ? affiliate.first_commission_rate
      : affiliate.repeat_commission_rate;
    const commissionAmount = Math.round((amountPaid * commissionRate) / 100);

    // Insert referral record
    const { error: refError } = await supabaseAdmin
      .from("affiliate_referrals")
      .insert({
        affiliate_id: affiliate.id,
        customer_email: customerEmail,
        order_id: (session.payment_intent as string) || session.id || "",
        amount_paid: amountPaid,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        referral_type: referralType,
        paid: false,
      });

    if (refError) {
      console.error("Failed to insert affiliate referral:", refError);
      return;
    }

    // Update affiliate total_earned
    await supabaseAdmin
      .from("affiliates")
      .update({
        total_earned: (affiliate.total_earned || 0) + commissionAmount,
      })
      .eq("id", affiliate.id);

    // Send notification email
    const commissionFormatted = `$${(commissionAmount / 100).toFixed(2)}`;
    const orderFormatted = `$${(amountPaid / 100).toFixed(2)}`;

    try {
      await resend.emails.send({
        from: "SendForGood <noreply@sendforgood.com>",
        to: "Simaan23@gmail.com",
        subject: `\uD83E\uDD1D New Affiliate Referral! ${affiliate.name} \u2014 ${commissionFormatted} commission`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1a2744;">New Affiliate Referral!</h1>
            <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <p><strong>Affiliate:</strong> ${affiliate.name} (${affiliate.email})</p>
              <p><strong>Code:</strong> ${affiliateCode}</p>
              <p><strong>Customer:</strong> ${customerEmail}</p>
              <p><strong>Order Amount:</strong> ${orderFormatted}</p>
              <p><strong>Referral Type:</strong> ${referralType === "first" ? "First Purchase" : "Repeat Purchase"}</p>
              <p><strong>Commission Rate:</strong> ${commissionRate}%</p>
              <p><strong>Commission:</strong> ${commissionFormatted}</p>
            </div>
            <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send affiliate referral notification:", emailError);
    }
  } catch (error) {
    console.error("Error processing affiliate referral:", error);
  }
}
