import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/letters/[id]/gift-executor
// Returns the gift order's executor info for a letter (matched via recipient_id)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: letterId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the letter's recipient_id (only if owned by user)
    const { data: letter, error: letterError } = await supabase
      .from("letters")
      .select("recipient_id")
      .eq("id", letterId)
      .eq("user_id", user.id)
      .single();

    if (letterError || !letter) {
      return NextResponse.json(
        { error: "Letter not found" },
        { status: 404 }
      );
    }

    // Find the order for this recipient with executor info
    const { data: order } = await supabase
      .from("orders")
      .select("executor_name, executor_email, executor_phone, executor_address")
      .eq("recipient_id", letter.recipient_id)
      .not("executor_email", "is", null)
      .limit(1)
      .single();

    if (!order || !order.executor_email) {
      return NextResponse.json({ giftExecutor: null });
    }

    return NextResponse.json({
      giftExecutor: {
        executor_name: order.executor_name || "",
        executor_email: order.executor_email,
        executor_phone: order.executor_phone || "",
        executor_address: order.executor_address || "",
      },
    });
  } catch (error) {
    console.error("Error fetching gift executor:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift executor" },
      { status: 500 }
    );
  }
}
