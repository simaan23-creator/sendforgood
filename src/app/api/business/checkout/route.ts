import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe, TIER_PRICES } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

interface RecipientPayload {
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
  cardMessage: string;
  giftNotes: string;
}

interface BusinessCheckoutBody {
  account: {
    fullName: string;
    email: string;
    companyName: string;
    industry: string;
    companyWebsite: string;
  };
  recipients: RecipientPayload[];
}

export async function POST(request: Request) {
  try {
    const body: BusinessCheckoutBody = await request.json();
    const cookieStore = await cookies();
    const affiliateCode = cookieStore.get("sfg_affiliate")?.value || "";
    const { account, recipients } = body;

    // Validate
    if (!account.fullName || !account.email || !account.companyName || !account.industry) {
      return NextResponse.json({ error: "Missing required account fields" }, { status: 400 });
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    // Calculate total
    let totalAmount = 0;
    for (const r of recipients) {
      const tierInfo = TIER_PRICES[r.tier];
      if (!tierInfo) {
        return NextResponse.json({ error: `Invalid tier: ${r.tier}` }, { status: 400 });
      }
      totalAmount += tierInfo.price * r.years;
    }

    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Build line items description
    const lineDescription = recipients
      .map((r) => `${r.recipientName} (${r.tier}, ${r.years}yr)`)
      .join(", ");

    // Stripe metadata has a 500-char limit per value, so we serialize recipients as JSON
    // and split across multiple metadata keys if needed
    const recipientsJson = JSON.stringify(recipients);
    const metadataChunks: Record<string, string> = {};
    const CHUNK_SIZE = 490;
    for (let i = 0; i < recipientsJson.length; i += CHUNK_SIZE) {
      metadataChunks[`recipients_${Math.floor(i / CHUNK_SIZE)}`] = recipientsJson.slice(i, i + CHUNK_SIZE);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Business Gift Plan — ${account.companyName}`,
              description: `${recipients.length} recipient${recipients.length > 1 ? "s" : ""}: ${lineDescription.slice(0, 200)}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/success?company=${encodeURIComponent(account.companyName)}&count=${recipients.length}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/signup?cancelled=true`,
      customer_email: user?.email || account.email,
      metadata: {
        isBusinessOrder: "true",
        userId: user?.id || "",
        fullName: account.fullName,
        email: account.email,
        companyName: account.companyName,
        industry: account.industry,
        companyWebsite: account.companyWebsite || "",
        recipientCount: recipients.length.toString(),
        affiliate_code: affiliateCode,
        ...metadataChunks,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Business checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
