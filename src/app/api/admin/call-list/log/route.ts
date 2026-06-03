import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/admin/call-list/log
// Body: { vault_id: string, bucket: "opening_today"|"no_view_7d"|"no_view_30d", notes?: string }
//
// Records that Simaan placed a manual phone call about this vault for this
// bucket. Future GET /api/admin/call-list calls filter the vault out of the
// matching bucket so it doesn't keep showing up. When Twilio automation is
// added later, the same table receives those auto-call rows too.

const ALLOWED_BUCKETS = new Set([
  "opening_today",
  "no_view_7d",
  "no_view_30d",
]);

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: { vault_id?: string; bucket?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const vault_id = (body.vault_id || "").trim();
  const bucket = (body.bucket || "").trim();
  const notes = (body.notes || "").trim() || null;

  if (!vault_id) {
    return NextResponse.json({ error: "vault_id required" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "invalid bucket" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("vault_call_log").insert({
    vault_id,
    bucket,
    notes,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
