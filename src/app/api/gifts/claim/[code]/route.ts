import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: Public view of a gifted credit by claim code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: gifted, error } = await supabaseAdmin
    .from("gifted_credits")
    .select("id, sender_id, recipient_name, tier, message, status")
    .eq("claim_code", code)
    .single();

  if (error || !gifted) {
    return NextResponse.json(
      { error: "Gift not found or invalid claim code" },
      { status: 404 }
    );
  }

  // Get sender's first name for privacy
  const { data: senderProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", gifted.sender_id)
    .single();

  const senderFullName = senderProfile?.full_name || "Someone";
  const senderFirstName = senderFullName.split(" ")[0];

  return NextResponse.json({
    gift: {
      id: gifted.id,
      sender_id: gifted.sender_id,
      recipient_name: gifted.recipient_name,
      tier: gifted.tier,
      message: gifted.message,
      status: gifted.status,
      sender_first_name: senderFirstName,
    },
  });
}

// POST: Claim a gifted credit (auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Verify auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Find the gifted credit
  const { data: gifted, error: findError } = await supabaseAdmin
    .from("gifted_credits")
    .select("id, sender_id, tier, status, gift_credit_id")
    .eq("claim_code", code)
    .single();

  if (findError || !gifted) {
    return NextResponse.json(
      { error: "Gift not found or invalid claim code" },
      { status: 404 }
    );
  }

  if (gifted.status === "claimed") {
    return NextResponse.json(
      { error: "This gift has already been claimed" },
      { status: 400 }
    );
  }

  if (gifted.status === "expired") {
    return NextResponse.json(
      { error: "This gift has expired" },
      { status: 400 }
    );
  }

  // Ensure claiming user has a profile
  await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
      },
      { onConflict: "id" }
    );

  // Get original gift credit info to know tier and quantity
  const { data: originalCredit } = await supabaseAdmin
    .from("gift_credits")
    .select("tier, quantity, amount_paid, stripe_payment_intent_id")
    .eq("id", gifted.gift_credit_id)
    .single();

  // Create a new gift_credits record for the claiming user
  const { data: newCredit, error: creditError } = await supabaseAdmin
    .from("gift_credits")
    .insert({
      user_id: user.id,
      tier: gifted.tier,
      quantity: originalCredit?.quantity || 1,
      quantity_used: 0,
      stripe_payment_intent_id: originalCredit?.stripe_payment_intent_id || "",
      amount_paid: originalCredit?.amount_paid || 0,
    })
    .select()
    .single();

  if (creditError) {
    console.error("Failed to create gift credit for claimer:", creditError);
    return NextResponse.json(
      { error: "Failed to claim gift" },
      { status: 500 }
    );
  }

  // Mark the gifted_credits record as claimed
  const { error: updateError } = await supabaseAdmin
    .from("gifted_credits")
    .update({
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      status: "claimed",
    })
    .eq("id", gifted.id);

  if (updateError) {
    console.error("Failed to update gifted credit:", updateError);
    return NextResponse.json(
      { error: "Failed to update claim status" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    creditId: newCredit.id,
    tier: gifted.tier,
  });
}
