import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch gift credits for this user
  const { data: credits, error: creditsError } = await supabase
    .from("gift_credits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (creditsError) {
    return NextResponse.json({ error: creditsError.message }, { status: 500 });
  }

  // Fetch assignments for all credits
  const creditIds = (credits || []).map((c: { id: string }) => c.id);
  let assignments: Record<string, unknown>[] = [];

  if (creditIds.length > 0) {
    const { data: assignData, error: assignError } = await supabase
      .from("gift_assignments")
      .select("*")
      .in("credit_id", creditIds)
      .order("created_at", { ascending: false });

    if (!assignError && assignData) {
      assignments = assignData;
    }
  }

  // Group assignments by credit_id
  const assignmentsByCredit: Record<string, typeof assignments> = {};
  for (const a of assignments) {
    const creditId = a.credit_id as string;
    if (!assignmentsByCredit[creditId]) {
      assignmentsByCredit[creditId] = [];
    }
    assignmentsByCredit[creditId].push(a);
  }

  const result = (credits || []).map((credit: Record<string, unknown>) => ({
    ...credit,
    assignments: assignmentsByCredit[credit.id as string] || [],
  }));

  return NextResponse.json({ credits: result });
}
