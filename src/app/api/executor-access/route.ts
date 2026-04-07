import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      requesterName,
      requesterEmail,
      requesterRelationship,
      accountHolderName,
      accountHolderEmail,
      reason,
    } = body;

    if (
      !requesterName ||
      !requesterEmail ||
      !requesterRelationship ||
      !accountHolderName ||
      !accountHolderEmail ||
      !reason
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Save to database
    const { data: inserted, error: dbError } = await supabaseAdmin
      .from("executor_access_requests")
      .insert({
        requester_name: requesterName,
        requester_email: requesterEmail,
        requester_relationship: requesterRelationship,
        account_holder_name: accountHolderName,
        account_holder_email: accountHolderEmail,
        reason,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) throw dbError;

    const submittedAt = new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });

    // 1. Email admin
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `New Executor Access Request — ${accountHolderName}`,
      replyTo: requesterEmail,
      text: `A new executor access request has been submitted.

REQUESTER
Name: ${requesterName}
Email: ${requesterEmail}
Relationship: ${requesterRelationship}

ACCOUNT HOLDER
Name: ${accountHolderName}
Email: ${accountHolderEmail}

REASON
${reason}

Submitted: ${submittedAt}
Request ID: ${inserted.id}

Go to the admin dashboard to review, approve, or deny this request:
https://sendforgood.com/admin`,
    });

    // 2. Email account holder (notification)
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: accountHolderEmail,
      subject: "Someone has requested executor access to your SendForGood account",
      text: `Hello ${accountHolderName},

${requesterName} (${requesterEmail}) has submitted a request to access your SendForGood account as your executor. Their stated relationship: ${requesterRelationship}.

If you authorized this person as your executor, no action is needed.

If you did NOT authorize this request, please contact us immediately at support@sendforgood.com or text (631) 707-4968.

We will not grant access until we have verified the requester's identity and given you a chance to respond.

— The SendForGood Team`,
    });

    // 3. Confirmation to requester
    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: requesterEmail,
      subject: "We received your executor access request",
      text: `Hello ${requesterName},

Thank you for reaching out. We have received your request to access the SendForGood account belonging to ${accountHolderName}.

WHAT HAPPENS NEXT:
1. We have immediately notified the account holder of your request. If they respond within 7 days to deny it, your request will be declined.
2. A member of our team will contact you within 2 business days to verify your identity.
3. If we are unable to reach the account holder within 7 days, and your identity is verified, access may be granted at our discretion.
4. All requests are reviewed manually by our team.

If you have any questions in the meantime, reply to this email or text us at (631) 707-4968.

— The SendForGood Team`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Executor access request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}
