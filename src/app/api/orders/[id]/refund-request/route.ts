import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import { TIERS } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch order with recipient info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, recipients(name)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check for existing pending refund request
    const { data: existing } = await supabase
      .from("refund_requests")
      .select("id")
      .eq("order_id", orderId)
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "A refund request is already pending for this order" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason, details } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const tier = TIERS.find((t) => t.id === order.tier);
    const refundAmount = (order.years_remaining ?? 0) * (tier?.priceInCents ?? 0);

    // Create refund request
    const { error: insertError } = await supabase
      .from("refund_requests")
      .insert({
        order_id: orderId,
        user_id: user.id,
        reason,
        details: details || null,
        status: "pending",
        refund_amount: refundAmount,
      });

    if (insertError) throw insertError;

    // Send email notification to owner
    const recipientName = order.recipients?.name ?? "Unknown";
    const tierName = tier?.name ?? order.tier;
    const refundFormatted = `$${(refundAmount / 100).toFixed(2)}`;

    try {
      await resend.emails.send({
        from: "SendForGood <noreply@sendforgood.com>",
        to: "Simaan23@gmail.com",
        subject: `Refund Request — ${recipientName} ${tierName} plan`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1a2744;">Refund Request Received</h1>
            <div style="background: #fff3f3; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin-top: 0;">Request Details</h2>
              <p><strong>Customer:</strong> ${user.email}</p>
              <p><strong>Recipient:</strong> ${recipientName}</p>
              <p><strong>Tier:</strong> ${tierName}</p>
              <p><strong>Years remaining:</strong> ${order.years_remaining}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Details:</strong> ${details || "None provided"}</p>
              <p><strong>Estimated refund:</strong> ${refundFormatted}</p>
            </div>
            <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin Dashboard</a></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send refund request email:", emailError);
    }

    return NextResponse.json({ success: true, refund_amount: refundAmount });
  } catch (error) {
    console.error("Error creating refund request:", error);
    return NextResponse.json(
      { error: "Failed to create refund request" },
      { status: 500 }
    );
  }
}
