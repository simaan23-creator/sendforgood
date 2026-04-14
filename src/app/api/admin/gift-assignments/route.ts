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
      tracking_number,
      admin_notes,
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

// PATCH: Update assignment status, tracking number, and/or notes
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, tracking_number, admin_notes } = body as {
    id: string;
    status?: string;
    tracking_number?: string;
    admin_notes?: string;
  };

  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "ordered", "fulfilled", "active", "completed"];

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, string> = {};
  if (status) updatePayload.status = status;
  if (tracking_number !== undefined) updatePayload.tracking_number = tracking_number;
  if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("gift_assignments")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("Failed to update assignment:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
