import { NextResponse } from "next/server";
import { stripe, TIER_PRICES } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

interface CartItemPayload {
  id: string;
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, email, fullName } = body as {
      items: CartItemPayload[];
      email: string;
      fullName: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate all items and calculate total
    const lineItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const tierInfo = TIER_PRICES[item.tier];
      if (!tierInfo) {
        return NextResponse.json(
          { error: `Invalid tier: ${item.tier}` },
          { status: 400 }
        );
      }

      const itemTotal = tierInfo.price * item.years;
      totalAmount += itemTotal;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tierInfo.name} Gift Plan — ${item.recipientName} (${item.years} yr${item.years > 1 ? "s" : ""})`,
            description: `${tierInfo.description} for ${item.recipientName} (${item.occasionType})`,
          },
          unit_amount: itemTotal,
        },
        quantity: 1,
      });
    }

    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Serialize cart items to metadata (chunked for Stripe's 500-char limit)
    const cartJson = JSON.stringify(items);
    const metadataChunks: Record<string, string> = {};
    const CHUNK_SIZE = 490;
    for (let i = 0; i < cartJson.length; i += CHUNK_SIZE) {
      metadataChunks[`cart_items_${Math.floor(i / CHUNK_SIZE)}`] = cartJson.slice(
        i,
        i + CHUNK_SIZE
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      customer_email: user?.email || email,
      metadata: {
        isCartOrder: "true",
        userId: user?.id || "",
        email: email || user?.email || "",
        fullName: fullName || "",
        itemCount: items.length.toString(),
        ...metadataChunks,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Cart checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
