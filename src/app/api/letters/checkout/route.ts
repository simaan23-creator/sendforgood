import { NextResponse } from "next/server";
import { stripe, DELIVERY_TYPE_PRICES, type DeliveryType } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      recipientName,
      relationship,
      letterType,
      scheduledDate,
      milestoneLabel,
      years,
      milestoneQuantity,
      executorEmail,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      email,
      fullName,
      deliveryType: rawDeliveryType,
      recipientEmail,
    } = body;

    const deliveryType: DeliveryType = (rawDeliveryType && rawDeliveryType in DELIVERY_TYPE_PRICES)
      ? rawDeliveryType
      : "physical";

    if (!recipientName || !letterType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Determine price based on delivery type
    const unitPrice = DELIVERY_TYPE_PRICES[deliveryType].price;
    let quantity = 1;

    if (letterType === "annual") {
      quantity = years || 1;
    } else {
      if (milestoneQuantity === "bundle5") quantity = 5;
      else if (milestoneQuantity === "bundle10") quantity = 10;
      else quantity = 1;
    }

    const totalAmount = unitPrice * quantity;
    const deliveryLabel = DELIVERY_TYPE_PRICES[deliveryType].label;

    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const productName = letterType === "annual"
      ? `${deliveryLabel} for ${recipientName} (${years} yr${years > 1 ? "s" : ""})`
      : milestoneQuantity === "bundle5"
        ? `5 ${deliveryLabel}s — ${recipientName}`
        : milestoneQuantity === "bundle10"
          ? `10 ${deliveryLabel}s — ${recipientName}`
          : `${deliveryLabel} for ${recipientName}${milestoneLabel ? ` — ${milestoneLabel}` : ""}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: `${deliveryLabel} — ${letterType === "annual" ? "delivered annually" : "milestone delivery"}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/letters/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/letters/write?type=${letterType}`,
      customer_email: user?.email || email,
      metadata: {
        isLetterOrder: "true",
        userId: user?.id || "",
        email: email || user?.email || "",
        fullName: fullName || "",
        recipientName,
        relationship: relationship || "",
        letterType,
        deliveryType,
        recipientEmail: recipientEmail || "",
        scheduledDate: scheduledDate || "",
        milestoneLabel: milestoneLabel || "",
        years: (years || 1).toString(),
        milestoneQuantity: milestoneQuantity || "single",
        executorEmail: executorEmail || "",
        addressLine1: addressLine1 || "",
        addressLine2: addressLine2 || "",
        city: city || "",
        state: state || "",
        postalCode: postalCode || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Letter checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
