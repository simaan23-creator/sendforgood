import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        profiles (
          id,
          email,
          full_name
        ),
        recipients (
          id,
          name,
          relationship
        ),
        occasions (
          id,
          type,
          occasion_date,
          label
        )
      `
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // Client-side search filtering (Supabase doesn't support OR across joined tables easily)
    let filtered = orders;
    if (search) {
      const term = search.toLowerCase();
      filtered = orders.filter((order: Record<string, unknown>) => {
        const profile = order.profiles as { email?: string; full_name?: string } | null;
        const recipient = order.recipients as { name?: string } | null;
        const email = profile?.email?.toLowerCase() || "";
        const recipientName = recipient?.name?.toLowerCase() || "";
        return email.includes(term) || recipientName.includes(term);
      });
    }

    return NextResponse.json({ orders: filtered });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: "order_id and status are required" },
        { status: 400 }
      );
    }

    if (!["active", "paused", "cancelled", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", order_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
