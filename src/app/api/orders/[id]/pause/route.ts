import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find the next pending or paused shipment
    const { data: shipments, error: shipError } = await supabase
      .from("shipments")
      .select("id, status, scheduled_date")
      .eq("order_id", orderId)
      .in("status", ["pending", "paused"])
      .order("scheduled_date", { ascending: true })
      .limit(1);

    if (shipError) throw shipError;

    if (!shipments || shipments.length === 0) {
      return NextResponse.json(
        { error: "No pending shipments to pause" },
        { status: 400 }
      );
    }

    const shipment = shipments[0];
    const newStatus = shipment.status === "paused" ? "pending" : "paused";

    const { data: updated, error: updateError } = await supabase
      .from("shipments")
      .update({ status: newStatus })
      .eq("id", shipment.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ shipment: updated });
  } catch (error) {
    console.error("Error toggling pause:", error);
    return NextResponse.json(
      { error: "Failed to toggle pause" },
      { status: 500 }
    );
  }
}
