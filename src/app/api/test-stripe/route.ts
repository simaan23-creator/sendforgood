import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const start = Date.now();
    const products = await stripe.products.list({ limit: 1 });
    const elapsed = Date.now() - start;
    return NextResponse.json({ 
      ok: true, 
      elapsed_ms: elapsed,
      stripe_key_prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + "...",
      product_count: products.data.length
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
