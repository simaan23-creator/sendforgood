import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Cancel an unused vault and refund the vault fee + any remaining recording
// credits back to the user's balance. Only allowed when the vault has zero
// recordings — once anyone has recorded, the vault has captured real memories
// and should not be cancellable.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: vault, error: fetchError } = await supabaseAdmin
    .from("memory_requests")
    .select(
      "id, requester_id, status, max_audio_recordings, max_video_recordings, max_photo_uploads"
    )
    .eq("id", id)
    .single();

  if (fetchError || !vault) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  if (vault.requester_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (vault.status === "cancelled") {
    return NextResponse.json(
      { error: "Vault is already cancelled" },
      { status: 400 }
    );
  }

  // Guard: no recordings allowed
  const { count: recordingsCount, error: countError } = await supabaseAdmin
    .from("memory_recordings")
    .select("id", { count: "exact", head: true })
    .eq("request_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((recordingsCount || 0) > 0) {
    return NextResponse.json(
      {
        error:
          "This vault has recordings and cannot be cancelled. Use 'Return Unused' to recover unused recording credits.",
      },
      { status: 400 }
    );
  }

  // Refund the vault fee — un-mark the most recently used fee for this user.
  // Fees are fungible (vault_fees.source_id stores the Stripe payment_intent
  // id, not the vault id, so there's no direct back-link). The most-recent
  // ordering tends to refund the fee that was charged for this vault when the
  // user is acting promptly, but functionally any used fee works.
  const { data: usedFee, error: feeFetchError } = await supabaseAdmin
    .from("vault_fees")
    .select("id")
    .eq("user_id", user.id)
    .not("used_at", "is", null)
    .order("used_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (feeFetchError) {
    return NextResponse.json({ error: feeFetchError.message }, { status: 500 });
  }

  let vaultFeeRefunded = false;
  if (usedFee?.id) {
    const { error: feeUpdateError } = await supabaseAdmin
      .from("vault_fees")
      .update({ used_at: null })
      .eq("id", usedFee.id);
    if (feeUpdateError) {
      return NextResponse.json(
        { error: feeUpdateError.message },
        { status: 500 }
      );
    }
    vaultFeeRefunded = true;
  }

  // Refund any remaining recording credits on this vault (defensive — usually
  // the user has already clicked "Return Unused", but if they jumped straight
  // to "Cancel & Refund" we still need to give them back the credits).
  const unusedAudio = vault.max_audio_recordings || 0;
  const unusedVideo = vault.max_video_recordings || 0;
  const unusedPhoto = vault.max_photo_uploads || 0;

  if (unusedAudio + unusedVideo + unusedPhoto > 0) {
    const { error: creditError } = await supabaseAdmin
      .from("memory_credits")
      .insert({
        user_id: user.id,
        audio_credits: unusedAudio,
        video_credits: unusedVideo,
        photo_credits: unusedPhoto,
      });

    if (creditError) {
      return NextResponse.json({ error: creditError.message }, { status: 500 });
    }
  }

  // Mark vault cancelled and zero out the slots so it can't be used again
  const { error: cancelError } = await supabaseAdmin
    .from("memory_requests")
    .update({
      status: "cancelled",
      max_audio_recordings: 0,
      max_video_recordings: 0,
      max_photo_uploads: 0,
    })
    .eq("id", id);

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    refunded: {
      vault_fee: vaultFeeRefunded,
      audio: unusedAudio,
      video: unusedVideo,
      photo: unusedPhoto,
    },
  });
}
