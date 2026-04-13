import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
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

  // Verify ownership
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("memory_requests")
    .select("id, requester_id, recording_count:memory_recordings(id)")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }

  if (existing.requester_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, note_to_recorder, sealed_until } = body;

  const updates: Record<string, unknown> = {};

  if (title !== undefined) {
    if (!title.trim()) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }
    updates.title = title.trim();
  }

  if (note_to_recorder !== undefined) {
    updates.note_to_recorder = note_to_recorder?.trim() || null;
  }

  if (sealed_until !== undefined) {
    // Only allow changing sealed_until if no recordings yet
    const recordingCount = Array.isArray(existing.recording_count)
      ? existing.recording_count.length
      : 0;

    if (recordingCount > 0) {
      return NextResponse.json(
        { error: "Cannot change sealed date after recordings have been made" },
        { status: 400 }
      );
    }

    if (sealed_until) {
      const today = new Date().toISOString().split("T")[0];
      if (sealed_until <= today) {
        return NextResponse.json(
          { error: "Sealed until date must be in the future" },
          { status: 400 }
        );
      }
      updates.sealed_until = sealed_until;
      updates.is_sealed = true;
    } else {
      updates.sealed_until = null;
      updates.is_sealed = false;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("memory_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating memory request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
