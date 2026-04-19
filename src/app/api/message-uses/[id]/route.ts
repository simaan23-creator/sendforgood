import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// PATCH: Update content_url or content_text (when recording/writing)
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
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Verify ownership
  const { data: existing, error: findError } = await supabaseAdmin
    .from("message_uses")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  if (findError || !existing) {
    return NextResponse.json(
      { error: "Message use not found" },
      { status: 404 }
    );
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.content_url !== undefined) updates.content_url = body.content_url;
  if (body.content_text !== undefined) updates.content_text = body.content_text;
  if (body.recipient_name !== undefined)
    updates.recipient_name = body.recipient_name;
  if (body.recipient_email !== undefined)
    updates.recipient_email = body.recipient_email;
  if (body.delivery_date !== undefined)
    updates.delivery_date = body.delivery_date;
  if (body.milestone_label !== undefined)
    updates.milestone_label = body.milestone_label;
  if (body.sealed_until !== undefined) updates.sealed_until = body.sealed_until;
  if (body.status !== undefined) updates.status = body.status;

  updates.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("message_uses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating message use:", updateError);
    return NextResponse.json(
      { error: "Failed to update message use" },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

// DELETE: Cancel a message_use and return credit
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Find the message_use
  const { data: messageUse, error: findError } = await supabaseAdmin
    .from("message_uses")
    .select("id, user_id, credit_id, status")
    .eq("id", id)
    .single();

  if (findError || !messageUse) {
    return NextResponse.json(
      { error: "Message use not found" },
      { status: 404 }
    );
  }

  if (messageUse.user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Only allow cancelling draft/pending messages
  if (!["draft", "pending_request", "gifted"].includes(messageUse.status)) {
    return NextResponse.json(
      { error: "Cannot cancel a message that has already been used" },
      { status: 400 }
    );
  }

  // Return the credit
  if (messageUse.credit_id) {
    const { data: credit } = await supabaseAdmin
      .from("message_credits")
      .select("id, quantity_used")
      .eq("id", messageUse.credit_id)
      .single();

    if (credit && credit.quantity_used > 0) {
      await supabaseAdmin
        .from("message_credits")
        .update({ quantity_used: credit.quantity_used - 1 })
        .eq("id", credit.id);
    }
  }

  // Delete the message_use
  const { error: deleteError } = await supabaseAdmin
    .from("message_uses")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting message use:", deleteError);
    return NextResponse.json(
      { error: "Failed to cancel message use" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
