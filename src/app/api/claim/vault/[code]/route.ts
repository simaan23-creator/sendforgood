import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// GET: Public view of an admin vault gift by claim code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  // 30 lookups per IP per hour to slow code enumeration.
  const ip = getClientIp(request);
  const limit = rateLimit(`claim-lookup:${ip}`, 30, 30 / 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { code } = await params;

  const { data: gift, error } = await supabaseAdmin
    .from("admin_vault_gifts")
    .select("id, recipient_name, recipient_email, audio_credits, video_credits, photo_credits, message, status, created_at")
    .eq("claim_code", code)
    .single();

  if (error || !gift) {
    return NextResponse.json(
      { error: "Gift not found or invalid claim code" },
      { status: 404 }
    );
  }

  return NextResponse.json({ gift });
}

// POST: Claim an admin vault gift (auth required)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Find the gift
  const { data: gift, error: findError } = await supabaseAdmin
    .from("admin_vault_gifts")
    .select("*")
    .eq("claim_code", code)
    .single();

  if (findError || !gift) {
    return NextResponse.json(
      { error: "Gift not found or invalid claim code" },
      { status: 404 }
    );
  }

  if (gift.status === "claimed") {
    return NextResponse.json(
      { error: "This gift has already been claimed" },
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

  // Insert memory_credits for the recipient
  const { error: creditError } = await supabaseAdmin
    .from("memory_credits")
    .insert({
      user_id: user.id,
      audio_credits: gift.audio_credits || 0,
      video_credits: gift.video_credits || 0,
      photo_credits: gift.photo_credits || 0,
    });

  if (creditError) {
    console.error("Failed to insert memory credits:", creditError);
    return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
  }

  // Insert vault fee waiver
  const { error: feeError } = await supabaseAdmin
    .from("vault_fees")
    .insert({
      user_id: user.id,
      source: "admin_gift",
      source_id: gift.id,
    });

  if (feeError) {
    console.error("Failed to insert vault fee:", feeError);
    return NextResponse.json({ error: "Failed to add vault fee waiver" }, { status: 500 });
  }

  // Mark gift as claimed
  const { error: updateError } = await supabaseAdmin
    .from("admin_vault_gifts")
    .update({
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      status: "claimed",
    })
    .eq("id", gift.id);

  if (updateError) {
    console.error("Failed to update gift status:", updateError);
    return NextResponse.json({ error: "Failed to update claim status" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    credits: {
      audio: gift.audio_credits || 0,
      video: gift.video_credits || 0,
      photo: gift.photo_credits || 0,
    },
  });
}
