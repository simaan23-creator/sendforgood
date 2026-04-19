import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

  const { data: credits, error } = await supabase
    .from("message_credits")
    .select("format, quantity, quantity_used")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching message credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }

  // Sum credits by format
  const balances: Record<string, number> = {
    letter_digital: 0,
    letter_physical: 0,
    letter_photo: 0,
    audio: 0,
    video: 0,
  };

  for (const credit of credits || []) {
    const remaining = (credit.quantity || 0) - (credit.quantity_used || 0);
    if (remaining > 0 && balances[credit.format] !== undefined) {
      balances[credit.format] += remaining;
    }
  }

  return NextResponse.json(balances);
}
