import { NextResponse } from "next/server";
import { stripe, LETTER_PRICES } from "@/lib/stripe";
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
    } = body;

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

    // Determine price
    let priceInfo;
    let quantity = 1;

    if (letterType === "annual") {
      priceInfo = LETTER_PRICES.standalone_annual;
      quantity = years || 1;
    } else {
      if (milestoneQuantity === "bundle5") {
        priceInfo = LETTER_PRICES.milestone_bundle_5;
      } else if (milestoneQuantity === "bundle10") {
        priceInfo = LETTER_PRICES.milestone_bundle_10;
      } else {
        priceInfo = LETTER_PRICES.milestone_single;
      }
    }

    const totalAmount = letterType === "annual"
      ? priceInfo.price * quantity
      : priceInfo.price;

    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const productName = letterType === "annual"
      ? `Legacy Letter for ${recipientName} (${years} yr${years > 1 ? "s" : ""})`
      : milestoneQuantity === "bundle5"
        ? `5 Milestone Letters — ${recipientName}`
        : milestoneQuantity === "bundle10"
          ? `10 Milestone Letters — ${recipientName}`
          : `Milestone Letter for ${recipientName}${milestoneLabel ? ` — ${milestoneLabel}` : ""}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: priceInfo.description,
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
