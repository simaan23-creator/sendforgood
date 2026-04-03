import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/admin/letters — get all letters (admin)
export async function GET() {
  try {
    const { data: letters, error } = await supabaseAdmin
      .from("letters")
      .select(`
        *,
        profiles:user_id(id, email, full_name, phone),
        recipients(id, name, relationship, address_line1, address_line2, city, state, postal_code)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ letters: letters || [] });
  } catch (error) {
    console.error("Error fetching admin letters:", error);
    return NextResponse.json(
      { error: "Failed to fetch letters" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/letters — update letter status (admin)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { letter_id, status } = body;

    if (!letter_id || !status) {
      return NextResponse.json(
        { error: "letter_id and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["draft", "scheduled", "pending_release", "released", "printed", "delivered"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("letters")
      .update({ status })
      .eq("id", letter_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ letter: updated });
  } catch (error) {
    console.error("Error updating letter:", error);
    return NextResponse.json(
      { error: "Failed to update letter" },
      { status: 500 }
    );
  }
}
