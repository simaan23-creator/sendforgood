import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

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

  // ── 12-month seal cap for Anniversary Capsule credits ────────────────────
  // The Anniversary Capsule sampler bundle (1 vault + 6 video + 15 photo,
  // $29.95) ships with a hard 12-month seal cap. If the user has ANY unspent
  // anniversary credits, the cap applies to the vault they're creating — this
  // prevents combining sampler credits with full credits to escape the cap.
  // See supabase/migrations/034_memory_credits_bundle.sql for the bundle tag.
  let effectiveSealedUntil: string | null = sealed_until || null;
  let sealClampedByAnniversary = false;

  if (sealed_until) {
    const { data: anniversaryRows } = await supabaseAdmin
      .from("memory_credits")
      .select("audio_credits, video_credits, photo_credits")
      .eq("user_id", user.id)
      .eq("bundle", "anniversary");

    const hasAnniversaryBalance = (anniversaryRows || []).some(
      (r) =>
        (r.audio_credits || 0) > 0 ||
        (r.video_credits || 0) > 0 ||
        (r.photo_credits || 0) > 0
    );

    if (hasAnniversaryBalance) {
      const cap = new Date();
      cap.setUTCFullYear(cap.getUTCFullYear() + 1);
      const capDate = cap.toISOString().split("T")[0];
      if (sealed_until > capDate) {
        effectiveSealedUntil = capDate;
        sealClampedByAnniversary = true;
      }
    }
  }

  // Check for unused vault fee ($10)
  const { data: vaultFee } = await supabaseAdmin
    .from("vault_fees")
    .select("id")
    .eq("user_id", user.id)
    .is("used_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!vaultFee) {
    return NextResponse.json(
      { error: "Vault creation requires a $10 fee", needsFee: true },
      { status: 403 }
    );
  }

  // Mark vault fee as used
  await supabaseAdmin
    .from("vault_fees")
    .update({ used_at: new Date().toISOString() })
    .eq("id", vaultFee.id);

  const { data, error } = await supabaseAdmin
    .from("memory_requests")
    .insert({
      requester_id: user.id,
      requester_email: user.email,
      title,
      occasion,
      delivery_date,
      note_to_recorder: note_to_recorder || null,
      sealed_until: effectiveSealedUntil,
      is_sealed: !!effectiveSealedUntil,
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

  // Vault creation confirmation email — fire and forget so the API stays fast.
  // Buyer keeps a permanent record of the share link and the wedding-kit link
  // (without this email the share link only lived on the client page).
  if (data?.unique_code && user.email) {
    const shareUrl = `https://sealtheday.com/record/${data.unique_code}`;
    const kitUrl = `https://sealtheday.com/vault/wedding-kit?code=${data.unique_code}`;
    const sealLine = effectiveSealedUntil
      ? `Sealed until <strong>${new Date(effectiveSealedUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong> &mdash; not even you can peek before then.${sealClampedByAnniversary ? " <em>(Anniversary Capsule vaults seal for up to 1 year — for time capsules up to 10 years, see our full vault.)</em>" : ""}`
      : `No seal date set &mdash; recordings will be visible to you as they come in.`;

    resend.emails.send({
      from: "SealTheDay <noreply@sealtheday.com>",
      to: user.email,
      subject: `Your vault "${title}" is live \u2014 here's the share link`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744; background: #fdf8f0;">
          <h1 style="color: #1a2744; margin-top: 0;">Your vault is live \uD83C\uDF89</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>${title}</strong> is ready to receive memories from your guests. ${sealLine}
          </p>

          <div style="background: #ffffff; border: 2px solid #C9A961; border-radius: 12px; padding: 24px; margin: 28px 0;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 12px;">Your guest share link</div>
            <div style="font-family: 'Courier New', monospace; background: #fdf8f0; padding: 14px; border-radius: 8px; word-break: break-all; font-size: 14px; color: #1a2744;">
              ${shareUrl}
            </div>
            <p style="margin: 12px 0 0; font-size: 13px; color: #6c6357;">
              Anyone with this link can record. No app or login required for them.
            </p>
          </div>

          <h2 style="font-size: 18px; margin: 32px 0 12px; color: #1a2744;">Next: grab your Wedding Kit</h2>
          <p style="line-height: 1.6;">
            Printable QR table cards (one for every dinner table), an MC script for your DJ, and pre-written invitations \u2014 all populated with your link above, ready to print.
          </p>

          <p style="margin-top: 24px; text-align: center;">
            <a href="${kitUrl}" style="background: #C9A961; color: #1a2744; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Open my Wedding Kit &rarr;</a>
          </p>

          <p style="margin-top: 32px; font-size: 13px; color: #6c6357; text-align: center;">
            <a href="https://sealtheday.com/vault/my" style="color: #722F37;">Back to my dashboard</a>
          </p>

          <hr style="border: none; border-top: 1px solid #f1e8db; margin: 40px 0 20px;" />
          <p style="font-size: 12px; color: #8a8275; text-align: center; line-height: 1.5;">
            Save this email \u2014 it\u2019s the easiest way to find your share link later.<br/>
            Questions? Reply to this email or write to support@sealtheday.com
          </p>
        </div>
      `,
    }).catch((emailError) => {
      console.error("Failed to send vault creation confirmation email:", emailError);
    });
  }

  return NextResponse.json({
    ...data,
    seal_clamped_by_anniversary: sealClampedByAnniversary,
  });
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
