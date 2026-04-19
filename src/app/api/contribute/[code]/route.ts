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
    .select("id, user_id, use_type, content_text, credit_id, format, status")
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
      format: item.format,
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
    .select("id, user_id, credit_id, status")
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

  // Store the contributed message in the message_uses record itself
  await supabaseAdmin
    .from("message_uses")
    .update({
      status: "completed",
      content_text: message.trim(),
      recipient_name: contributor_name?.trim() || null,
    })
    .eq("id", item.id);

  return NextResponse.json({ success: true });
}
