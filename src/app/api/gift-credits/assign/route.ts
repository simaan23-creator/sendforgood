import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    creditId,
    years,
    recipientName,
    relationship,
    isPet,
    petType,
    occasionType,
    occasionDate,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    isProfessional,
    age,
    gender,
    interests,
    giftNotes,
    recipientIndustry,
  } = body;

  // Validate required fields
  if (!creditId || !years || !recipientName || !occasionType || !occasionDate) {
    return NextResponse.json(
      { error: "Missing required fields: creditId, years, recipientName, occasionType, occasionDate" },
      { status: 400 }
    );
  }

  if (years < 1 || years > 25) {
    return NextResponse.json({ error: "Years must be between 1 and 25" }, { status: 400 });
  }

  // Fetch the credit and verify ownership + availability
  const { data: credit, error: creditError } = await supabase
    .from("gift_credits")
    .select("*")
    .eq("id", creditId)
    .eq("user_id", user.id)
    .single();

  if (creditError || !credit) {
    return NextResponse.json({ error: "Credit not found" }, { status: 404 });
  }

  const available = credit.quantity - credit.quantity_used;
  if (years > available) {
    return NextResponse.json(
      { error: `Not enough credits. You have ${available} available but requested ${years}.` },
      { status: 400 }
    );
  }

  // Create one assignment record per year
  const assignments = [];
  const baseDate = new Date(occasionDate);

  for (let i = 0; i < years; i++) {
    const yearDate = new Date(baseDate);
    yearDate.setFullYear(baseDate.getFullYear() + i);

    assignments.push({
      credit_id: creditId,
      user_id: user.id,
      recipient_name: recipientName,
      relationship: relationship || null,
      is_pet: isPet || false,
      pet_type: isPet ? petType || null : null,
      occasion_type: occasionType,
      occasion_date: yearDate.toISOString().split("T")[0],
      scheduled_year: i + 1,
      address_line1: addressLine1 || null,
      address_line2: addressLine2 || null,
      city: city || null,
      state: state || null,
      postal_code: postalCode || null,
      is_professional: isProfessional || false,
      age: age || null,
      gender: gender || null,
      interests: interests || null,
      gift_notes: giftNotes || null,
      recipient_industry: isProfessional ? recipientIndustry || null : null,
      status: "scheduled",
    });
  }

  const { error: insertError } = await supabase
    .from("gift_assignments")
    .insert(assignments);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Update quantity_used on the credit
  const { error: updateError } = await supabase
    .from("gift_credits")
    .update({ quantity_used: credit.quantity_used + years })
    .eq("id", creditId)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    assignmentsCreated: years,
    remaining: available - years,
  });
}
