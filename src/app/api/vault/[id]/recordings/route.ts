import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/vault/:id/recordings
// Owner-only listing of all memory_recordings tied to a vault. Used by the
// /vault/view/[id] page after a vault unlocks (delivery_date passed + seal lifted).
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

  return NextResponse.json({
    vault: vaultMeta,
    recordings: recordings || [],
    locked: false,
  });
}
