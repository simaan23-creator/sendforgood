import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    occasion,
    delivery_date,
    note_to_recorder,
    sealed_until,
    max_audio_recordings,
    max_video_recordings,
    max_photo_uploads,
  } = body;

  if (!title || !occasion || !delivery_date) {
    return NextResponse.json(
      { error: "Title, occasion, and delivery date are required" },
      { status: 400 }
    );
  }

  // Validate delivery_date is in the future
  const today = new Date().toISOString().split("T")[0];
  if (delivery_date <= today) {
    return NextResponse.json(
      { error: "Delivery date must be in the future" },
      { status: 400 }
    );
  }

  // Validate sealed_until if provided
  if (sealed_until && sealed_until <= today) {
    return NextResponse.json(
      { error: "Sealed until date must be in the future" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("memory_requests")
    .insert({
      requester_id: user.id,
      requester_email: user.email,
      title,
      occasion,
      delivery_date,
      note_to_recorder: note_to_recorder || null,
      sealed_until: sealed_until || null,
      is_sealed: !!sealed_until,
      max_audio_recordings: max_audio_recordings || 0,
      max_video_recordings: max_video_recordings || 0,
      max_photo_uploads: max_photo_uploads || 0,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating memory request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Allocate voice messages and memory_credits to this vault
  const audioToAllocate = max_audio_recordings || 0;
  const videoToAllocate = max_video_recordings || 0;
  const photoToAllocate = max_photo_uploads || 0;

  if (audioToAllocate > 0 || videoToAllocate > 0 || photoToAllocate > 0) {
    // Find VMs already used (completed requests or gifted)
    const [{ data: completedReqs }, { data: giftedItems }] = await Promise.all([
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
        .eq("item_type", "voice_message"),
    ]);

    const excludeIds = new Set<string>();
    if (completedReqs) {
      for (const req of completedReqs) {
        const parts = (req.claim_code || "").split("_");
        const sourceId = parts.length >= 2 ? parts.slice(1).join("_") : null;
        if (sourceId) excludeIds.add(sourceId);
      }
    }
    if (giftedItems) {
      for (const gi of giftedItems) excludeIds.add(gi.item_id);
    }

    // Get available draft VMs (oldest first)
    const { data: draftVMs } = await supabaseAdmin
      .from("voice_messages")
      .select("id, message_format")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .order("created_at", { ascending: true });

    const availableVMs = (draftVMs || []).filter((vm) => !excludeIds.has(vm.id));
    const audioVMs = availableVMs.filter((vm) => vm.message_format !== "video");
    const videoVMs = availableVMs.filter((vm) => vm.message_format === "video");

    // Mark VMs as vault_allocated
    const audioToMark = audioVMs.slice(0, audioToAllocate).map((vm) => vm.id);
    const videoToMark = videoVMs.slice(0, videoToAllocate).map((vm) => vm.id);
    const allToMark = [...audioToMark, ...videoToMark];

    if (allToMark.length > 0) {
      await supabaseAdmin
        .from("voice_messages")
        .update({ status: "vault_allocated" })
        .in("id", allToMark);
    }

    // Deduct any remaining allocation from memory_credits
    const audioFromCredits = audioToAllocate - audioToMark.length;
    const videoFromCredits = videoToAllocate - videoToMark.length;
    const photoFromCredits = photoToAllocate; // Photos are always from credits (no VMs)

    if (audioFromCredits > 0 || videoFromCredits > 0 || photoFromCredits > 0) {
      const { data: creditRows } = await supabaseAdmin
        .from("memory_credits")
        .select("id, audio_credits, video_credits, photo_credits")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      let audioRemaining = audioFromCredits;
      let videoRemaining = videoFromCredits;
      let photoRemaining = photoFromCredits;

      for (const row of creditRows || []) {
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
    }
  }

  return NextResponse.json(data);
}

export async function GET() {
  const TIMEOUT_MS = 5000;

  const result = await Promise.race([
    (async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: requests, error } = await supabaseAdmin
        .from("memory_requests")
        .select("*, memory_recordings(id, message_format, recorder_name)")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching memory requests:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Add per-format recording counts and recorder names
      const mapped = (requests || []).map((req) => {
        const recs = req.memory_recordings || [];
        const audioCount = recs.filter((r: { message_format: string }) => r.message_format === "audio").length;
        const videoCount = recs.filter((r: { message_format: string }) => r.message_format === "video").length;
        const photoCount = recs.filter((r: { message_format: string }) => r.message_format === "photo").length;
        const recorderNames = [...new Set(
          recs
            .map((r: { recorder_name: string | null }) => r.recorder_name)
            .filter(Boolean) as string[]
        )];
        return {
          ...req,
          recording_count: recs.length,
          audio_recorded: audioCount,
          video_recorded: videoCount,
          photo_recorded: photoCount,
          recorder_names: recorderNames,
          memory_recordings: undefined,
        };
      });

      return NextResponse.json(mapped);
    })(),
    new Promise<NextResponse>((resolve) =>
      setTimeout(() => {
        console.warn("Memory requests GET timed out after 5s");
        resolve(NextResponse.json([]));
      }, TIMEOUT_MS)
    ),
  ]);

  return result;
}
