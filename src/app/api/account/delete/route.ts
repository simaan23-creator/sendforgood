import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/account/delete
 *
 * Permanently deletes the calling user's account. Body must include
 * `{ confirm: "DELETE" }` to guard against accidental calls.
 *
 * Most user data cascades from auth.users (profiles -> orders, recipients,
 * letters, voice_messages, gift_credits, gift_assignments, memory_requests,
 * memory_credits, etc.). A few tables don't cascade and are cleaned up
 * explicitly below.
 *
 * Note: storage objects (uploaded photos, audio, video) are not deleted
 * here. They become orphaned and can be swept periodically.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Body must include { "confirm": "DELETE" }' },
      { status: 400 }
    );
  }

  const userId = user.id;

  // 1. Tables that reference auth.users without ON DELETE CASCADE.
  await supabaseAdmin.from("vault_fees").delete().eq("user_id", userId);
  await supabaseAdmin.from("refund_requests").delete().eq("user_id", userId);

  // 2. Detach (don't delete) any admin gift vaults the user claimed.
  //    The historical record stays; the link to the user is severed.
  await supabaseAdmin
    .from("admin_vault_gifts")
    .update({ claimed_by: null })
    .eq("claimed_by", userId);

  // 3. Delete the auth user. This cascades through profiles and onward.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to delete account: ${deleteError.message}` },
      { status: 500 }
    );
  }

  // Sign the (now deleted) user out of this session.
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
