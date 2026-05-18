import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Memory Vault Creation Fee",
            description: "One-time fee to create a new Memory Vault",
          },
          unit_amount: 1000, // $10
        },
        quantity: 1,
      },
    ],
    metadata: {
      isVaultFee: "true",
      userId: user.id,
    },
    customer_email: user.email,
    success_url: `${baseUrl}/request/create?feePaid=1`,
    cancel_url: `${baseUrl}/request/create`,
  });

  return NextResponse.json({ url: session.url });
}
