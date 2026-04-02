import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data: shipments, error } = await supabaseAdmin
      .from("shipments")
      .select(
        `
        *,
        orders!inner (
          id,
          tier,
          years_purchased,
          years_remaining,
          amount_paid,
          status,
          user_id,
          recipient_id,
          occasion_id,
          recipients (
            id,
            name,
            relationship,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country
          ),
          occasions (
            id,
            type,
            occasion_date,
            label
          ),
          profiles (
            id,
            email,
            full_name,
            phone
          )
        )
      `
      )
      .order("scheduled_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipment_id, status, tracking_number } = body;

    if (!shipment_id || !status) {
      return NextResponse.json(
        { error: "shipment_id and status are required" },
        { status: 400 }
      );
    }

    if (!["pending", "shipped", "delivered"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update shipment status
    const updateData: Record<string, string> = { status };
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }

    const { data: shipment, error: shipmentError } = await supabaseAdmin
      .from("shipments")
      .update(updateData)
      .eq("id", shipment_id)
      .select("*, orders(id, years_remaining)")
      .single();

    if (shipmentError) throw shipmentError;

    // If marking as shipped, decrement years_remaining on the order
    if (status === "shipped" && shipment.orders) {
      const order = shipment.orders as { id: string; years_remaining: number };
      const newRemaining = Math.max(0, order.years_remaining - 1);

      const orderUpdate: Record<string, string | number> = {
        years_remaining: newRemaining,
      };
      // If no years remaining, mark order as completed
      if (newRemaining === 0) {
        orderUpdate.status = "completed";
      }

      const { error: orderError } = await supabaseAdmin
        .from("orders")
        .update(orderUpdate)
        .eq("id", order.id);

      if (orderError) throw orderError;
    }

    return NextResponse.json({ success: true, shipment });
  } catch (error) {
    console.error("Error updating shipment:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}
