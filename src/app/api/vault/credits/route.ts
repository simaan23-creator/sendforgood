import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const TIMEOUT_MS = 5000;
  const fallback = { audioCredits: 0, videoCredits: 0, audioUsed: 0, videoUsed: 0 };

  const result = await Promise.race([
    (async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Sum credits from memory_credits table (vault-specific purchases)
      const { data: credits, error: creditsError } = await supabaseAdmin
        .from("memory_credits")
        .select("audio_credits, video_credits")
        .eq("user_id", user.id);

      if (creditsError) {
        console.error("Error fetching credits:", creditsError);
        return NextResponse.json(
          { error: creditsError.message },
          { status: 500 }
        );
      }

      let totalAudio = (credits || []).reduce(
        (sum, c) => sum + (c.audio_credits || 0),
        0
      );
      let totalVideo = (credits || []).reduce(
        (sum, c) => sum + (c.video_credits || 0),
        0
      );

      // Also count unused voice messages as available credits
      // Exclude VMs that have completed requests or have been gifted
      const { data: voiceMessages } = await supabaseAdmin
        .from("voice_messages")
        .select("id, message_format")
        .eq("user_id", user.id)
        .eq("status", "draft");

      if (voiceMessages && voiceMessages.length > 0) {
        const vmIds = voiceMessages.map((vm) => vm.id);

        // Find VMs with completed requests (claim_code format: {random}_{item_id})
        const { data: completedReqs } = await supabaseAdmin
          .from("message_uses")
          .select("claim_code")
          .eq("user_id", user.id)
          .eq("use_type", "request")
          .eq("status", "completed");

        const usedVmIds = new Set<string>();
        if (completedReqs) {
          for (const req of completedReqs) {
            const parts = (req.claim_code || "").split("_");
            const sourceId = parts.length >= 2 ? parts.slice(1).join("_") : null;
            if (sourceId && vmIds.includes(sourceId)) usedVmIds.add(sourceId);
          }
        }

        // Find VMs that have been gifted
        const { data: giftedVMs } = await supabaseAdmin
          .from("gifted_items")
          .select("item_id")
          .eq("sender_id", user.id)
          .eq("item_type", "voice_message")
          .in("item_id", vmIds);

        if (giftedVMs) {
          for (const gi of giftedVMs) usedVmIds.add(gi.item_id);
        }

        // Only count truly unused VMs
        for (const vm of voiceMessages) {
          if (!usedVmIds.has(vm.id)) {
            if (vm.message_format === "video") totalVideo++;
            else totalAudio++;
          }
        }
      }

      // Count slots already allocated to vaults as "used"
      const { data: requests } = await supabaseAdmin
        .from("memory_requests")
        .select("max_audio_recordings, max_video_recordings")
        .eq("requester_id", user.id)
        .in("status", ["active", "pending"]);

      let audioUsed = 0;
      let videoUsed = 0;

      if (requests) {
        for (const req of requests) {
          audioUsed += req.max_audio_recordings || 0;
          videoUsed += req.max_video_recordings || 0;
        }
      }

      return NextResponse.json({
        audioCredits: totalAudio,
        videoCredits: totalVideo,
        audioUsed,
        videoUsed,
      });
    })(),
    new Promise<NextResponse>((resolve) =>
      setTimeout(() => {
        console.warn("Vault credits GET timed out after 5s");
        resolve(NextResponse.json(fallback));
      }, TIMEOUT_MS)
    ),
  ]);

  return result;
}
