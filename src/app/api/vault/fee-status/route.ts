import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: fees, error } = await supabaseAdmin
    .from("vault_fees")
    .select("id")
    .eq("user_id", user.id)
    .is("used_at", null);

  if (error) {
    console.error("Error fetching vault fees:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const feeCount = fees?.length || 0;

  return NextResponse.json({
    hasFee: feeCount > 0,
    feeCount,
  });
}
