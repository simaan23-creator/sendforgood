import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: Fetch request details by claim code (public, no auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: item, error } = await supabaseAdmin
    .from("message_uses")
    .select("id, user_id, use_type, content_text, item_type, item_id, status")
    .eq("claim_code", code)
    .eq("use_type", "request")
    .single();

  if (error || !item) {
    return NextResponse.json(
      { error: "Request not found or invalid link" },
      { status: 404 }
    );
  }

  if (item.status === "completed") {
    return NextResponse.json(
      { error: "This request has already been fulfilled" },
      { status: 400 }
    );
  }

  // Get requester's name
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", item.user_id)
    .single();

  const fullName = profile?.full_name || "Someone";
  const firstName = fullName.split(" ")[0];

  return NextResponse.json({
    request: {
      id: item.id,
      prompt: item.content_text,
      item_type: item.item_type,
      requester_name: firstName,
    },
  });
}

// POST: Submit a contribution (no auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json();
  const { contributor_name, message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Find the request
  const { data: item, error: findError } = await supabaseAdmin
    .from("message_uses")
    .select("id, user_id, item_type, item_id, status")
    .eq("claim_code", code)
    .eq("use_type", "request")
    .single();

  if (findError || !item) {
    return NextResponse.json(
      { error: "Request not found or invalid link" },
      { status: 404 }
    );
  }

  if (item.status === "completed") {
    return NextResponse.json(
      { error: "This request has already been fulfilled" },
      { status: 400 }
    );
  }

  // Update the original item with the contributed message
  if (item.item_type === "letter" && item.item_id) {
    await supabaseAdmin
      .from("letters")
      .update({
        content: message.trim(),
        status: "scheduled",
      })
      .eq("id", item.item_id);
  } else if (item.item_type === "voice_message" && item.item_id) {
    // Store contributed text as the title/note for now
    await supabaseAdmin
      .from("voice_messages")
      .update({
        title: contributor_name ? `Message from ${contributor_name}` : "Contributed Message",
      })
      .eq("id", item.item_id);
  }

  // Mark the request as completed
  await supabaseAdmin
    .from("message_uses")
    .update({
      status: "completed",
      recipient_name: contributor_name?.trim() || null,
    })
    .eq("id", item.id);

  return NextResponse.json({ success: true });
}
