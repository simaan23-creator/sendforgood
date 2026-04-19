import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const [gcResult, letterResult, voiceResult] = await Promise.all([
      supabaseAdmin.from("gift_credits").select("quantity"),
      supabaseAdmin.from("letters").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("voice_messages").select("id", { count: "exact", head: true }),
    ]);

    const giftCreditTotal = (gcResult.data || []).reduce(
      (sum: number, row: { quantity: number }) => sum + (row.quantity || 0),
      0
    );
    const letterCount = letterResult.count || 0;
    const voiceCount = voiceResult.count || 0;

    const total = giftCreditTotal + letterCount + voiceCount;

    return NextResponse.json(
      { total },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ total: 0 }, { status: 500 });
  }
}
