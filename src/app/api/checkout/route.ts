import { NextResponse } from "next/server";
import { stripe, TIER_PRICES } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      recipientName,
      relationship,
      occasionType,
      occasionLabel,
      occasionDate,
      years,
      tier,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      email,
      fullName,
      recipientAge,
      recipientGender,
      interests,
      giftNotes,
      cardMessage,
    } = body;

    // Validate required fields
    if (!recipientName || !occasionType || !occasionDate || !years || !tier || !addressLine1 || !city || !state || !postalCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tierInfo = TIER_PRICES[tier];
    if (!tierInfo) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const totalAmount = tierInfo.price * years;

    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${tierInfo.name} Gift Plan — ${years} Year${years > 1 ? "s" : ""}`,
              description: `${tierInfo.description} for ${recipientName} (${occasionType})`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/send/success?recipient=${encodeURIComponent(recipientName)}&occasion=${encodeURIComponent(occasionType)}&tier=${encodeURIComponent(tier)}&years=${years}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/send?cancelled=true`,
      customer_email: user?.email || email,
      metadata: {
        userId: user?.id || "",
        recipientName,
        relationship,
        occasionType,
        occasionLabel: occasionLabel || "",
        occasionDate,
        years: years.toString(),
        tier,
        addressLine1,
        addressLine2: addressLine2 || "",
        city,
        state,
        postalCode,
        country: country || "US",
        email: email || user?.email || "",
        fullName: fullName || "",
        recipientAge: recipientAge || "",
        recipientGender: recipientGender || "",
        interests: interests || "",
        giftNotes: giftNotes || "",
        cardMessage: cardMessage || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
