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
      if (metadata.isCartOrder === "true") {
        await handleCartOrder(session, metadata);
      } else if (metadata.isBusinessOrder === "true") {
        await handleBusinessOrder(session, metadata);
      } else {
        await handleIndividualOrder(session, metadata);
      }
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
  unitPrice: number;
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

  const cartItems: CartItemMeta[] = JSON.parse(cartJson);

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

  // Send customer confirmation email
  try {
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: customerEmail,
      subject: `Your Gift Plans are Confirmed! \u{1F381} ${cartItems.length} gift${cartItems.length > 1 ? "s" : ""} set up`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
          <h1 style="color: #1a2744;">Your gift plans are all set! \u{1F389}</h1>
          <p>Thank you for choosing SendForGood. We're honored to help you send something meaningful to ${cartItems.length} ${cartItems.length === 1 ? "person" : "people"}.</p>
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Order Summary</h2>
            <p><strong>Total gifts:</strong> ${cartItems.length}</p>
            <p><strong>Total paid:</strong> ${amountFormatted}</p>
          </div>
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
          </div>
          <p>We'll take care of everything from here. Each recipient will receive their gift on time, every year.</p>
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

    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `\u{1F6D2} New Cart Order! ${cartItems.length} gift${cartItems.length > 1 ? "s" : ""} \u2014 ${amountFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">New Cart Order! \u{1F389}</h1>
          <div style="background: #f0f7ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Customer:</strong> ${metadata.fullName} (${customerEmail})</p>
            <p><strong>Total Gifts:</strong> ${cartItems.length}</p>
            <p><strong>Total Amount:</strong> ${amountFormatted}</p>
          </div>
          <div style="margin: 24px 0;">
            <h2 style="font-size: 18px;">All Gifts</h2>
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
          </div>
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
