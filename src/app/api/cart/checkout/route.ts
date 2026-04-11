import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe, TIER_PRICES, DELIVERY_TYPE_PRICES, VOICE_MESSAGE_PRICES } from "@/lib/stripe";
import type { DeliveryType } from "@/lib/stripe";
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
  isProfessional: boolean;
  recipientIndustry: string;
  executorName: string;
  executorEmail: string;
  executorPhone: string;
  executorAddress: string;
  addLetter: boolean;
  letterContent: string;
  unitPrice: number;
  totalPrice: number;
}

interface LetterItemPayload {
  id: string;
  itemType: "letter";
  recipientName: string;
  recipientEmail: string;
  letterType: "annual" | "milestone";
  deliveryType: DeliveryType;
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

interface VoiceItemPayload {
  id: string;
  itemType: "voice-message";
  recipientName: string;
  recipientEmail: string;
  messageType: "annual" | "milestone";
  messageFormat?: "audio" | "video";
  title: string;
  quantity: number;
  durationSeconds: number;
  unitPrice: number;
  totalPrice: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const affiliateCode = cookieStore.get("sfg_affiliate")?.value || "";
    const { items, letterItems, voiceItems, email, fullName } = body as {
      items: CartItemPayload[];
      letterItems?: LetterItemPayload[];
      voiceItems?: VoiceItemPayload[];
      email: string;
      fullName: string;
    };

    const hasGifts = items && items.length > 0;
    const hasLetters = letterItems && letterItems.length > 0;
    const hasVoice = voiceItems && voiceItems.length > 0;

    if (!hasGifts && !hasLetters && !hasVoice) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate all items and build Stripe line items
    const lineItems = [];

    // Gift line items
    if (hasGifts) {
      for (const item of items) {
        const tierInfo = TIER_PRICES[item.tier];
        if (!tierInfo) {
          return NextResponse.json(
            { error: `Invalid tier: ${item.tier}` },
            { status: 400 }
          );
        }

        const LETTER_ADDON_CENTS = 800; // $8/yr in cents
        const giftTotal = tierInfo.price * item.years;
        const letterTotal = item.addLetter ? LETTER_ADDON_CENTS * item.years : 0;
        const itemTotal = giftTotal + letterTotal;

        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `${tierInfo.name} Gift Plan — ${item.recipientName} (${item.years} yr${item.years > 1 ? "s" : ""})${item.addLetter ? " + Letter" : ""}`,
              description: `${tierInfo.description} for ${item.recipientName} (${item.occasionType})`,
            },
            unit_amount: itemTotal,
          },
          quantity: 1,
        });
      }
    }

    // Letter line items
    if (hasLetters) {
      for (const letter of letterItems) {
        const deliveryInfo = DELIVERY_TYPE_PRICES[letter.deliveryType];
        if (!deliveryInfo) {
          return NextResponse.json(
            { error: `Invalid delivery type: ${letter.deliveryType}` },
            { status: 400 }
          );
        }

        const quantityLabel =
          letter.letterType === "annual"
            ? `${letter.quantity} yr${letter.quantity > 1 ? "s" : ""}`
            : `${letter.quantity} letter${letter.quantity > 1 ? "s" : ""}`;

        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Legacy Letter — ${letter.recipientName} (${quantityLabel})`,
              description: `${deliveryInfo.label} for ${letter.recipientName}`,
            },
            unit_amount: letter.totalPrice,
          },
          quantity: 1,
        });
      }
    }

    // Voice message line items
    if (hasVoice) {
      for (const voice of voiceItems) {
        const fmt = voice.messageFormat || "audio";
        const voicePriceInfo = VOICE_MESSAGE_PRICES[fmt];
        const quantityLabel =
          voice.messageType === "annual"
            ? `${voice.quantity} yr${voice.quantity > 1 ? "s" : ""}`
            : `${voice.quantity} message${voice.quantity > 1 ? "s" : ""}`;

        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `${voicePriceInfo.label} — ${voice.recipientName} (${quantityLabel})`,
              description: `${voicePriceInfo.label} for ${voice.recipientName}`,
            },
            unit_amount: voice.totalPrice,
          },
          quantity: 1,
        });
      }
    }

    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Serialize cart items to metadata (chunked for Stripe's 500-char limit)
    const cartJson = JSON.stringify(items || []);
    const metadataChunks: Record<string, string> = {};
    const CHUNK_SIZE = 490;
    for (let i = 0; i < cartJson.length; i += CHUNK_SIZE) {
      metadataChunks[`cart_items_${Math.floor(i / CHUNK_SIZE)}`] = cartJson.slice(
        i,
        i + CHUNK_SIZE
      );
    }

    // Serialize letter items to metadata (chunked)
    const letterJson = JSON.stringify(letterItems || []);
    for (let i = 0; i < letterJson.length; i += CHUNK_SIZE) {
      metadataChunks[`letter_items_${Math.floor(i / CHUNK_SIZE)}`] = letterJson.slice(
        i,
        i + CHUNK_SIZE
      );
    }

    // Serialize voice items to metadata (chunked)
    const voiceJson = JSON.stringify(voiceItems || []);
    for (let i = 0; i < voiceJson.length; i += CHUNK_SIZE) {
      metadataChunks[`voice_items_${Math.floor(i / CHUNK_SIZE)}`] = voiceJson.slice(
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
        itemCount: (items?.length || 0).toString(),
        letterItemCount: (letterItems?.length || 0).toString(),
        voiceItemCount: (voiceItems?.length || 0).toString(),
        affiliate_code: affiliateCode,
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
