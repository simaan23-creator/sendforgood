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

      // Send confirmation email
      try {
        await resend.emails.send({
          from: "SendForGood <noreply@sendforgood.com>",
          to: metadata.email || session.customer_email!,
          subject: "Your Gift Plan is Confirmed!",
          html: `
            <h1>Your gift plan is set up!</h1>
            <p>Thank you for choosing SendForGood. Here's a summary of your gift plan:</p>
            <ul>
              <li><strong>Recipient:</strong> ${metadata.recipientName}</li>
              <li><strong>Occasion:</strong> ${metadata.occasionType}</li>
              <li><strong>Tier:</strong> ${metadata.tier}</li>
              <li><strong>Duration:</strong> ${years} year${years > 1 ? "s" : ""}</li>
            </ul>
            <p>We'll take care of everything from here. Your first gift will be delivered on the occasion date.</p>
            <p>With love,<br/>The SendForGood Team</p>
          `,
        });
      } catch (emailError) {
        // Don't fail the webhook if email fails
        console.error("Failed to send confirmation email:", emailError);
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
