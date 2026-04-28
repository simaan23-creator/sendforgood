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

  const { data: recordings, error: recError } = await supabaseAdmin
    .from("memory_recordings")
    .select("id, recorder_name, audio_url, message_format, duration_seconds, status, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (recError) {
    return NextResponse.json({ error: recError.message }, { status: 500 });
  }

  return NextResponse.json({
    vault: {
      id: vault.id,
      title: vault.title,
      occasion: vault.occasion,
      delivery_date: vault.delivery_date,
      sealed_until: vault.sealed_until,
      is_sealed: vault.is_sealed,
      status: vault.status,
    },
    recordings: recordings || [],
  });
}
