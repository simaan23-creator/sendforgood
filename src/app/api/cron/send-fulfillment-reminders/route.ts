import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let sent = 0;

  try {
    // Find assignments due in exactly 14 days with status = pending
    const today = new Date();
    const target = new Date(today);
    target.setDate(target.getDate() + 14);
    const targetDate = target.toISOString().split("T")[0];

    const { data: assignments, error: fetchError } = await supabaseAdmin
      .from("gift_assignments")
      .select(`
        id,
        recipient_name,
        relationship,
        occasion_type,
        occasion_date,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        interests,
        gift_notes,
        age,
        gender,
        gift_credits!inner(tier),
        profiles:user_id(email, full_name)
      `)
      .eq("status", "pending")
      .eq("occasion_date", targetDate);

    if (fetchError) {
      console.error("Error fetching assignments:", fetchError);
      return NextResponse.json(
        { sent: 0, errors: [fetchError.message] },
        { status: 500 }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ sent: 0, message: "No assignments due in 14 days" });
    }

    const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://sendforgood.com"}/admin`;

    for (const a of assignments) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gc = a.gift_credits as any;
        const tier: string = (Array.isArray(gc) ? gc[0]?.tier : gc?.tier) || "unknown";
        const recipientName = a.recipient_name;
        const occasion = a.occasion_type.replace(/_/g, " ");
        const address = [
          a.address_line1,
          a.address_line2,
          [a.city, a.state, a.postal_code].filter(Boolean).join(", "),
          a.country || "US",
        ].filter(Boolean).join("\n");

        // Build Amazon search URL
        const searchParts = [tier === "starter" ? "" : tier, a.interests, occasion, "gift"].filter(Boolean);
        const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchParts.join(" "))}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prof = a.profiles as any;
        const profileObj = Array.isArray(prof) ? prof[0] : prof;
        const customerEmail: string = profileObj?.email || "unknown";
        const customerName: string = profileObj?.full_name || "Unknown";

        await resend.emails.send({
          from: "SendForGood <notifications@sendforgood.com>",
          to: "Simaan23@gmail.com",
          subject: `Gift Due in 14 Days - ${recipientName} (${tier.charAt(0).toUpperCase() + tier.slice(1)})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1B2A4A; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 20px;">Gift Due in 14 Days</h1>
              </div>
              <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 120px;">Recipient:</td>
                    <td style="padding: 8px 0; font-weight: 600;">${recipientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Relationship:</td>
                    <td style="padding: 8px 0;">${a.relationship || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Tier:</td>
                    <td style="padding: 8px 0;"><strong>${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Occasion:</td>
                    <td style="padding: 8px 0;">${occasion} &mdash; ${a.occasion_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Address:</td>
                    <td style="padding: 8px 0; white-space: pre-line;">${address}</td>
                  </tr>
                  ${a.interests ? `<tr><td style="padding: 8px 0; color: #6b7280;">Interests:</td><td style="padding: 8px 0;">${a.interests}</td></tr>` : ""}
                  ${a.gift_notes ? `<tr><td style="padding: 8px 0; color: #6b7280;">Gift Notes:</td><td style="padding: 8px 0;">${a.gift_notes}</td></tr>` : ""}
                  ${a.age ? `<tr><td style="padding: 8px 0; color: #6b7280;">Age:</td><td style="padding: 8px 0;">${a.age}</td></tr>` : ""}
                  ${a.gender ? `<tr><td style="padding: 8px 0; color: #6b7280;">Gender:</td><td style="padding: 8px 0;">${a.gender}</td></tr>` : ""}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Customer:</td>
                    <td style="padding: 8px 0;">${customerName} (${customerEmail})</td>
                  </tr>
                </table>

                <div style="margin-top: 24px; display: flex; gap: 12px;">
                  <a href="${adminUrl}" style="display: inline-block; background: #1B2A4A; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    Open Admin Dashboard
                  </a>
                  <a href="${amazonUrl}" style="display: inline-block; background: #FF9900; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    Search Amazon
                  </a>
                </div>
              </div>
            </div>
          `,
        });

        sent++;
      } catch (emailError) {
        const msg = emailError instanceof Error ? emailError.message : String(emailError);
        errors.push(`Failed to send reminder for ${a.recipient_name}: ${msg}`);
        console.error(`Failed to send fulfillment reminder for ${a.id}:`, emailError);
      }
    }

    return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    console.error("Fulfillment reminders cron error:", err);
    return NextResponse.json(
      { sent, errors: [...errors, err instanceof Error ? err.message : String(err)] },
      { status: 500 }
    );
  }
}
