import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
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
      .select("id, recipient_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      relationship,
      age,
      gender,
      interests,
      card_message,
      gift_notes,
      pet_type,
    } = body;

    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name;
    if (relationship !== undefined) updateData.relationship = relationship;
    if (age !== undefined) updateData.age = age || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (interests !== undefined) updateData.interests = interests || null;
    if (card_message !== undefined) updateData.card_message = card_message || null;
    if (gift_notes !== undefined) updateData.gift_notes = gift_notes || null;
    if (pet_type !== undefined) updateData.pet_type = pet_type || null;

    const { data: recipient, error } = await supabase
      .from("recipients")
      .update(updateData)
      .eq("id", order.recipient_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ recipient });
  } catch (error) {
    console.error("Error updating recipient:", error);
    return NextResponse.json(
      { error: "Failed to update recipient" },
      { status: 500 }
    );
  }
}
