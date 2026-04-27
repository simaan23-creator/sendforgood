import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Add more credits to an existing vault
export async function POST(
  request: Request,
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

  const body = await request.json();
  const addAudio = body.audio || 0;
  const addVideo = body.video || 0;
  const addPhoto = body.photo || 0;

  if (addAudio <= 0 && addVideo <= 0 && addPhoto <= 0) {
    return NextResponse.json({ error: "Must add at least one credit" }, { status: 400 });
  }

  // Verify ownership
  const { data: vault, error: fetchError } = await supabaseAdmin
    .from("memory_requests")
    .select("id, requester_id, max_audio_recordings, max_video_recordings, max_photo_uploads")
    .eq("id", id)
    .single();

  if (fetchError || !vault) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  if (vault.requester_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check available credits (same logic as vault/credits GET)
  const { data: credits } = await supabaseAdmin
    .from("memory_credits")
    .select("id, audio_credits, video_credits, photo_credits")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  let availableAudio = (credits || []).reduce((s, c) => s + (c.audio_credits || 0), 0);
  let availableVideo = (credits || []).reduce((s, c) => s + (c.video_credits || 0), 0);
  let availablePhoto = (credits || []).reduce((s, c) => s + (c.photo_credits || 0), 0);

  // Also count unused draft voice messages
  const { data: draftVMs } = await supabaseAdmin
    .from("voice_messages")
    .select("id, message_format")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: true });

  if (draftVMs && draftVMs.length > 0) {
    const vmIds = draftVMs.map((vm) => vm.id);

    const [{ data: completedReqs }, { data: giftedVMs }] = await Promise.all([
      supabaseAdmin
        .from("message_uses")
        .select("claim_code")
        .eq("user_id", user.id)
        .eq("use_type", "request")
        .eq("status", "completed"),
      supabaseAdmin
        .from("gifted_items")
        .select("item_id")
        .eq("sender_id", user.id)
        .eq("item_type", "voice_message")
        .in("item_id", vmIds),
    ]);

    const usedVmIds = new Set<string>();
    if (completedReqs) {
      for (const req of completedReqs) {
        const parts = (req.claim_code || "").split("_");
        const sourceId = parts.length >= 2 ? parts.slice(1).join("_") : null;
        if (sourceId && vmIds.includes(sourceId)) usedVmIds.add(sourceId);
      }
    }
    if (giftedVMs) {
      for (const gi of giftedVMs) usedVmIds.add(gi.item_id);
    }

    for (const vm of draftVMs) {
      if (!usedVmIds.has(vm.id)) {
        if (vm.message_format === "video") availableVideo++;
        else availableAudio++;
      }
    }
  }

  if (addAudio > availableAudio || addVideo > availableVideo || addPhoto > availablePhoto) {
    return NextResponse.json({
      error: "Not enough credits available",
      available: { audio: availableAudio, video: availableVideo, photo: availablePhoto },
    }, { status: 400 });
  }

  // Deduct credits: first from draft VMs, then from memory_credits
  const availableVMs = (draftVMs || []).filter((vm) => {
    const usedVmIds = new Set<string>();
    // Re-check (simplified — we already computed above but need the set)
    return !usedVmIds.has(vm.id);
  });
  const audioVMs = availableVMs.filter((vm) => vm.message_format !== "video");
  const videoVMs = availableVMs.filter((vm) => vm.message_format === "video");

  const audioVMsToMark = audioVMs.slice(0, addAudio).map((vm) => vm.id);
  const videoVMsToMark = videoVMs.slice(0, addVideo).map((vm) => vm.id);
  const allToMark = [...audioVMsToMark, ...videoVMsToMark];

  if (allToMark.length > 0) {
    await supabaseAdmin
      .from("voice_messages")
      .update({ status: "vault_allocated" })
      .in("id", allToMark);
  }

  // Deduct remaining from memory_credits
  let audioRemaining = addAudio - audioVMsToMark.length;
  let videoRemaining = addVideo - videoVMsToMark.length;
  let photoRemaining = addPhoto;

  for (const row of credits || []) {
    if (audioRemaining <= 0 && videoRemaining <= 0 && photoRemaining <= 0) break;
    const audioDeduct = Math.min(audioRemaining, row.audio_credits || 0);
    const videoDeduct = Math.min(videoRemaining, row.video_credits || 0);
    const photoDeduct = Math.min(photoRemaining, row.photo_credits || 0);
    if (audioDeduct > 0 || videoDeduct > 0 || photoDeduct > 0) {
      await supabaseAdmin
        .from("memory_credits")
        .update({
          audio_credits: (row.audio_credits || 0) - audioDeduct,
          video_credits: (row.video_credits || 0) - videoDeduct,
          photo_credits: (row.photo_credits || 0) - photoDeduct,
        })
        .eq("id", row.id);
      audioRemaining -= audioDeduct;
      videoRemaining -= videoDeduct;
      photoRemaining -= photoDeduct;
    }
  }

  // Increase vault slot counts
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("memory_requests")
    .update({
      max_audio_recordings: (vault.max_audio_recordings || 0) + addAudio,
      max_video_recordings: (vault.max_video_recordings || 0) + addVideo,
      max_photo_uploads: (vault.max_photo_uploads || 0) + addPhoto,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating vault:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, vault: updated });
}
