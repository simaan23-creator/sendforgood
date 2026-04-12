import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { audioCredits, videoCredits } = body;

  const audio = Math.max(0, Math.floor(audioCredits || 0));
  const video = Math.max(0, Math.floor(videoCredits || 0));

  if (audio <= 0 && video <= 0) {
    return NextResponse.json(
      { error: "At least one credit type must be greater than 0" },
      { status: 400 }
    );
  }

  const lineItems: Array<{
    price_data: {
      currency: string;
      product_data: { name: string; description: string };
      unit_amount: number;
    };
    quantity: number;
  }> = [];

  if (audio > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Audio Memory Credit",
          description: "One person can record a voice message for your vault",
        },
        unit_amount: 500, // $5
      },
      quantity: audio,
    });
  }

  if (video > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Video Memory Credit",
          description: "One person can record a video message for your vault",
        },
        unit_amount: 1000, // $10
      },
      quantity: video,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sendforgood.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    metadata: {
      isVaultOrder: "true",
      userId: user.id,
      audioCredits: String(audio),
      videoCredits: String(video),
    },
    customer_email: user.email,
    success_url: `${baseUrl}/vault/success?audio=${audio}&video=${video}`,
    cancel_url: `${baseUrl}/vault/buy`,
  });

  return NextResponse.json({ url: session.url });
}
