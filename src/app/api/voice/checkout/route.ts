import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, VOICE_MESSAGE_PRICES } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientName, recipientEmail, messageFormat, quantity } = body as {
      recipientName: string;
      recipientEmail: string;
      messageFormat: "audio" | "video";
      quantity: number;
    };

    if (!recipientName?.trim()) {
      return NextResponse.json({ error: "Recipient name is required" }, { status: 400 });
    }
    if (!recipientEmail?.trim() || !recipientEmail.includes("@")) {
      return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
    }

    const fmt = messageFormat === "video" ? "video" : "audio";
    const qty = Math.max(1, Math.floor(quantity || 1));
    const priceInfo = VOICE_MESSAGE_PRICES[fmt];
    const totalCents = priceInfo.price * qty;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://sendforgood.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${priceInfo.label} — ${recipientName} (${qty} yr${qty > 1 ? "s" : ""})`,
              description: `${priceInfo.label} for ${recipientName}`,
            },
            unit_amount: priceInfo.price,
          },
          quantity: qty,
        },
      ],
      metadata: {
        isVoiceMessageOrder: "true",
        userId: user.id,
        email: user.email || "",
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        messageFormat: fmt,
        messageType: "annual",
        years: String(qty),
      },
      customer_email: user.email,
      success_url: `${baseUrl}/voice/success`,
      cancel_url: `${baseUrl}/voice/record`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Voice checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
