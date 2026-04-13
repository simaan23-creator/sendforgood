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
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating memory request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: requests, error } = await supabaseAdmin
    .from("memory_requests")
    .select("*, memory_recordings(id)")
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching memory requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add recording_count to each request
  const result = (requests || []).map((req) => ({
    ...req,
    recording_count: req.memory_recordings?.length ?? 0,
    memory_recordings: undefined,
  }));

  return NextResponse.json(result);
}
