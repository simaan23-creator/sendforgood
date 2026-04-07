import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

// GET /api/admin/executor-access — list all requests
export async function GET() {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from("executor_access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("Error fetching executor access requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/executor-access — approve / deny a request
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "denied"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("executor_access_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Notify requester of decision
    if (updated) {
      if (status === "approved") {
        await resend.emails.send({
          from: "SendForGood <noreply@sendforgood.com>",
          to: updated.requester_email,
          subject: "Your executor access request has been approved",
          text: `Hello ${updated.requester_name},

Good news — your request to access the SendForGood account belonging to ${updated.account_holder_name} has been approved.

A member of our team will be in touch shortly with the next steps for accessing the account.

If you have any questions, reply to this email or text us at (631) 707-4968.

— The SendForGood Team`,
        });
      } else {
        await resend.emails.send({
          from: "SendForGood <noreply@sendforgood.com>",
          to: updated.requester_email,
          subject: "Your executor access request has been declined",
          text: `Hello ${updated.requester_name},

Your request to access the SendForGood account belonging to ${updated.account_holder_name} has been declined.

This decision may be based on a response from the account holder, an inability to verify your identity, or other factors at our discretion.

If you believe this was a mistake, or you have additional information you would like us to consider, please reply to this email or text us at (631) 707-4968.

— The SendForGood Team`,
        });
      }
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Error updating executor access request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
