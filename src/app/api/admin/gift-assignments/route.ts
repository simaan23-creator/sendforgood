import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: Fetch all gift assignments across all users
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("gift_assignments")
    .select(`
      id,
      credit_id,
      user_id,
      recipient_name,
      relationship,
      is_pet,
      pet_type,
      occasion_type,
      occasion_date,
      scheduled_year,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_professional,
      age,
      gender,
      interests,
      gift_notes,
      recipient_industry,
      status,
      created_at,
      gift_credits!inner(tier, quantity, user_id),
      profiles:user_id(email, full_name)
    `)
    .order("occasion_date", { ascending: true });

  if (error) {
    console.error("Failed to fetch gift assignments:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ assignments: data || [] });
}

// PATCH: Update assignment status
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status } = body as { id: string; status: string };

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status are required" },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "active", "completed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("gift_assignments")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update assignment status:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
