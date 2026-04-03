import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify order belongs to user
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { executor_name, executor_email, executor_phone, executor_address } = body;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        executor_name: executor_name || null,
        executor_email: executor_email || null,
        executor_phone: executor_phone || null,
        executor_address: executor_address || null,
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating executor:", error);
    return NextResponse.json(
      { error: "Failed to update executor" },
      { status: 500 }
    );
  }
}
