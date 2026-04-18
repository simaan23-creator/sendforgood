import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();
  
  try {
    // Test 1: Basic response
    const t1 = Date.now() - start;
    
    // Test 2: Can we reach Stripe?
    const stripeTest = await fetch("https://api.stripe.com/v1/products?limit=1", {
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`
      }
    });
    const t2 = Date.now() - start;
    const stripeData = await stripeTest.json();
    
    return NextResponse.json({
      ok: true,
      t1_basic_ms: t1,
      t2_stripe_ms: t2,
      stripe_status: stripeTest.status,
      stripe_key_prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 15),
      stripe_data_keys: Object.keys(stripeData),
    });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: String(error),
      elapsed: Date.now() - start
    }, { status: 500 });
  }
}
