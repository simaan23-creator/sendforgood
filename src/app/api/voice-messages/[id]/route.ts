import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
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

  const { data, error } = await supabase
    .from("voice_messages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Voice message not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ voiceMessage: data });
}

export async function PATCH(
  request: NextRequest,
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
  const { data: existing, error: fetchError } = await supabase
    .from("voice_messages")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Voice message not found" },
      { status: 404 }
    );
  }

  if (["delivered"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Cannot edit a delivered message" },
      { status: 400 }
    );
  }

  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (body.recipient_name !== undefined)
    updates.recipient_name = body.recipient_name || null;
  if (body.recipient_email !== undefined)
    updates.recipient_email = body.recipient_email || null;
  if (body.scheduled_date !== undefined)
    updates.scheduled_date = body.scheduled_date || null;
  if (body.milestone_label !== undefined)
    updates.milestone_label = body.milestone_label || null;
  if (body.audio_url !== undefined) updates.audio_url = body.audio_url || null;
  if (body.duration_seconds !== undefined)
    updates.duration_seconds = body.duration_seconds ?? null;
  if (body.status !== undefined) {
    const allowed = ["draft", "recorded", "scheduled"];
    if (allowed.includes(body.status)) {
      updates.status = body.status;
    }
  }
  if (body.title !== undefined) updates.title = body.title || null;
  if (body.letter_type !== undefined) {
    const allowed = ["annual", "milestone"];
    if (allowed.includes(body.letter_type)) {
      updates.letter_type = body.letter_type;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("voice_messages")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update voice message" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
