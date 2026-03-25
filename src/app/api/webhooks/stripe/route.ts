import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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
      // Find or create user
      let userId = metadata.userId;

      if (!userId) {
        // Check if user exists by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u) => u.email === metadata.email
        );

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create a new user
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

        // If this year's date has already passed, start from next year
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
          subject: "Your Gift Plan is Confirmed! 🎁",
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
              <h1 style="color: #1a2744;">Your gift plan is all set! 🎉</h1>
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
          subject: `🎁 New Order! ${metadata.tier} tier — ${metadata.recipientName} (${years} yr${years > 1 ? "s" : ""}) — ${amountFormatted}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #1a2744;">New Order Received! 🎉</h1>
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
              <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send owner notification email:", emailError);
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
