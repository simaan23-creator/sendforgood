import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { letterId } = await request.json();
    if (!letterId) {
      return NextResponse.json({ error: "Letter ID required" }, { status: 400 });
    }

    // Fetch the letter with recipient info
    const { data: letter, error } = await supabaseAdmin
      .from("letters")
      .select("*, recipients(name, address_line1, city, state, postal_code), profiles:user_id(email, full_name)")
      .eq("id", letterId)
      .eq("user_id", user.id)
      .single();

    if (error || !letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    if (!letter.content) {
      return NextResponse.json({ error: "Cannot release an empty letter" }, { status: 400 });
    }

    // Update status to released
    await supabaseAdmin
      .from("letters")
      .update({ status: "released" })
      .eq("id", letterId);

    // Send notification to admin
    const senderName = (letter.profiles as { full_name?: string })?.full_name || user.email;
    const recipientName = (letter.recipients as { name?: string })?.name || "recipient";

    await resend.emails.send({
      from: "SendForGood <noreply@sendforgood.com>",
      to: "Simaan23@gmail.com",
      subject: `📬 Milestone Letter Released — ${recipientName} from ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a2744;">Milestone Letter Released</h1>
          <p><strong>From:</strong> ${senderName} (${user.email})</p>
          <p><strong>To:</strong> ${recipientName}</p>
          <p><strong>Delivery type:</strong> ${letter.delivery_type || "physical"}</p>
          ${letter.milestone_label ? `<p><strong>Milestone:</strong> ${letter.milestone_label}</p>` : ""}
          <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">Letter Content</h2>
            <p style="white-space: pre-wrap;">${letter.content}</p>
          </div>
          ${letter.delivery_type === "digital" && letter.recipient_email
            ? `<p><strong>Recipient email:</strong> ${letter.recipient_email}</p>`
            : `<p><strong>Mailing address:</strong> ${(letter.recipients as { address_line1?: string; city?: string; state?: string; postal_code?: string })?.address_line1}, ${(letter.recipients as { city?: string })?.city}, ${(letter.recipients as { state?: string })?.state} ${(letter.recipients as { postal_code?: string })?.postal_code}</p>`
          }
          <p><a href="https://sendforgood.com/admin" style="background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Admin</a></p>
        </div>
      `,
    });

    // If digital, send email to recipient automatically
    if (letter.delivery_type === "digital" && letter.recipient_email) {
      await resend.emails.send({
        from: "SendForGood <noreply@sendforgood.com>",
        to: letter.recipient_email,
        subject: `A letter for you — from ${senderName}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744;">
            <p style="font-size: 14px; color: #888; margin-bottom: 32px;">Someone who cares about you wanted you to receive this.</p>
            <div style="border-left: 3px solid #C9A84C; padding-left: 24px; margin: 32px 0;">
              <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.8;">${letter.content}</p>
            </div>
            <p style="margin-top: 40px; font-size: 13px; color: #888;">Delivered with love by <a href="https://sendforgood.com" style="color: #C9A84C;">SendForGood</a></p>
          </div>
        `,
      });

      // Mark as delivered if digital
      await supabaseAdmin
        .from("letters")
        .update({ status: "delivered" })
        .eq("id", letterId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error releasing letter:", error);
    return NextResponse.json({ error: "Failed to release letter" }, { status: 500 });
  }
}
