import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// One-time backfill: create vault_fees rows for users who already purchased
// vault credits (their checkout included the $10 fee).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get distinct user_ids from memory_credits (users who have purchased)
  const { data: creditRows } = await supabaseAdmin
    .from("memory_credits")
    .select("user_id");

  if (!creditRows || creditRows.length === 0) {
    return NextResponse.json({ message: "No users to backfill", backfilled: 0 });
  }

  const userIds = [...new Set(creditRows.map((r) => r.user_id))];
  let backfilled = 0;

  for (const userId of userIds) {
    // Count existing vaults
    const { count: vaultCount } = await supabaseAdmin
      .from("memory_requests")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", userId);

    // Count existing vault fees
    const { count: feeCount } = await supabaseAdmin
      .from("vault_fees")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const existingVaults = vaultCount || 0;
    const existingFees = feeCount || 0;

    // Need: one used fee per existing vault + 1 unused for next vault
    const totalNeeded = existingVaults + 1;
    const toInsert = totalNeeded - existingFees;

    if (toInsert > 0) {
      const rows = [];
      for (let i = 0; i < toInsert; i++) {
        rows.push({
          user_id: userId,
          source: "purchase" as const,
          source_id: "backfill",
          // Mark as used for existing vaults, unused for the extra one
          used_at: i < existingVaults - existingFees ? new Date().toISOString() : null,
        });
      }

      await supabaseAdmin.from("vault_fees").insert(rows);
      backfilled += toInsert;
    }
  }

  return NextResponse.json({
    message: `Backfilled ${backfilled} vault fee(s) for ${userIds.length} user(s)`,
    backfilled,
    users: userIds.length,
  });
}
