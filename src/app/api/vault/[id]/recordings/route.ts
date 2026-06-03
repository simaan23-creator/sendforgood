import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/vault/:id/recordings
// Owner-only listing of all memory_recordings tied to a vault. Used by the
// /vault/view/[id] page after a vault unlocks (delivery_date passed + seal lifted).
//
// Side effect on an unlocked view: bumps memory_requests.last_viewed_at to
// now(). The admin caller list (/admin/call-list) uses this column to decide
// which vaults the owner has not yet seen post-unlock and therefore deserves a
// phone-call nudge from Simaan.
//
// Recording rows also get a 30-day download_url (signed with Content-Disposition:
// attachment) so the vault/view page can render a "Download" button alongside
// the inline player. Couples specifically asked to be able to keep these forever
// off our infra.

// Extract the storage path from a public storage URL. Public URLs look like:
//   {SUPABASE_URL}/storage/v1/object/public/memory-recordings/{code}/{ts}.{ext}
// The bucket name is fixed (memory-recordings). Returns null if it doesn't
// match the expected pattern (e.g. legacy rows that already stored a raw path).
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/memory-recordings/";
  const idx = url.indexOf(marker);
  if (idx === -1) {
    // Already a raw path? (no leading slash, no protocol)
    if (!url.includes("://") && !url.startsWith("/")) return url;
    return null;
  }
  return url.slice(idx + marker.length).split("?")[0];
}

function downloadFilename(
  recorderName: string | null,
  format: string | null,
  path: string
): string {
  const ext = (path.split(".").pop() || "webm").toLowerCase();
  const kind = format === "video" ? "video" : format === "photo" ? "photo" : "audio";
  const who = (recorderName || "memory").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 40);
  return `${who}-${kind}.${ext}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ownership check + fetch the vault (so the client can render title/occasion/dates)
  const { data: vault, error: vaultError } = await supabaseAdmin
    .from("memory_requests")
    .select(
      "id, requester_id, title, occasion, delivery_date, sealed_until, is_sealed, status"
    )
    .eq("id", id)
    .single();

  if (vaultError || !vault) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  if (vault.requester_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Seal enforcement ──────────────────────────────────────────────────────
  // The vault's contents are gated server-side until both:
  //   (a) the seal date has passed (or there is no seal), AND
  //   (b) the delivery date has been reached.
  // Until then we still return vault metadata + an aggregate count so the
  // owner can see participation, but never the recording rows / media URLs.
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
  const sealLifted = !vault.sealed_until || vault.sealed_until <= today;
  const deliveryReached = !vault.delivery_date || vault.delivery_date <= today;
  const isLocked = !sealLifted || !deliveryReached;
  const unlocksAt = !sealLifted
    ? vault.sealed_until
    : !deliveryReached
      ? vault.delivery_date
      : null;

  const vaultMeta = {
    id: vault.id,
    title: vault.title,
    occasion: vault.occasion,
    delivery_date: vault.delivery_date,
    sealed_until: vault.sealed_until,
    is_sealed: vault.is_sealed,
    status: vault.status,
  };

  if (isLocked) {
    // Return only the count of pending recordings — never the rows or URLs.
    const { count } = await supabaseAdmin
      .from("memory_recordings")
      .select("id", { count: "exact", head: true })
      .eq("request_id", id);

    return NextResponse.json({
      vault: vaultMeta,
      recordings: [],
      locked: true,
      unlocks_at: unlocksAt,
      pending_count: count ?? 0,
    });
  }

  const { data: recordings, error: recError } = await supabaseAdmin
    .from("memory_recordings")
    .select("id, recorder_name, audio_url, message_format, duration_seconds, status, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (recError) {
    return NextResponse.json({ error: recError.message }, { status: 500 });
  }

  // Vault is unlocked AND the owner is fetching → record the view. Fire-and-
  // forget; we don't want a transient write failure to break the page.
  void supabaseAdmin
    .from("memory_requests")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("last_viewed_at bump failed:", error.message);
    });

  // Per-recording 30-day download URL. createSignedUrl with { download: name }
  // sets Content-Disposition: attachment so the browser saves rather than streams.
  const TTL = 60 * 60 * 24 * 30; // 30 days
  const withDownload = await Promise.all(
    (recordings || []).map(async (rec) => {
      const path = extractStoragePath(rec.audio_url);
      if (!path) return { ...rec, download_url: null as string | null };
      const filename = downloadFilename(rec.recorder_name, rec.message_format, path);
      const { data, error } = await supabaseAdmin.storage
        .from("memory-recordings")
        .createSignedUrl(path, TTL, { download: filename });
      if (error || !data?.signedUrl) {
        return { ...rec, download_url: null as string | null };
      }
      return { ...rec, download_url: data.signedUrl };
    })
  );

  return NextResponse.json({
    vault: vaultMeta,
    recordings: withDownload,
    locked: false,
  });
}
