import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Photographer-to-client gift: spends 1 gift_credit, inserts an
// affiliate_grants row with recipient_email + 90-day expiry, and emails
// the recipient a claim link. Decrement is atomic so concurrent submits
// can't double-spend the slot.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip = getClientIp(request);
  const ipLimit = rateLimit(`affiliate-send-gift-ip:${ip}`, 5, 5 / 600);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
    );
  }

  const { code: currentCode } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const portalPassword =
    typeof body.portal_password === "string" ? body.portal_password : "";
  const recipientEmail =
    typeof body.recipient_email === "string"
      ? body.recipient_email.trim().toLowerCase()
      : "";
  const personalMessage =
    typeof body.personal_message === "string"
      ? body.personal_message.trim()
      : "";

  if (!portalPassword) {
    return NextResponse.json({ error: "Password required" }, { status: 401 });
  }
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Recipient email is required." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid recipient email." },
      { status: 400 }
    );
  }
  if (personalMessage.length > 500) {
    return NextResponse.json(
      { error: "Personal message must be 500 characters or fewer." },
      { status: 400 }
    );
  }

  const codeLower = currentCode.trim().toLowerCase();
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id, code, business_name, name, portal_password, gift_credits")
    .or(`code.eq.${codeLower},aliases.cs.{${codeLower}}`)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }
  if (!affiliate.portal_password || affiliate.portal_password !== portalPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const affiliateLimit = rateLimit(`gift:${affiliate.id}`, 3, 3 / 3600);
  if (!affiliateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many gifts sent in the last hour. Please try again later." },
      { status: 429, headers: { "Retry-After": String(affiliateLimit.retryAfterSec) } }
    );
  }

  if ((affiliate.gift_credits || 0) <= 0) {
    return NextResponse.json(
      { error: "No gift credits remaining." },
      { status: 409 }
    );
  }

  // Atomic decrement: only succeeds if gift_credits is still > 0. Filter
  // ensures two concurrent requests can't both consume the same slot.
  const { data: decremented, error: decError } = await supabaseAdmin
    .from("affiliates")
    .update({ gift_credits: (affiliate.gift_credits || 0) - 1 })
    .eq("id", affiliate.id)
    .gt("gift_credits", 0)
    .select("id, gift_credits")
    .maybeSingle();

  if (decError || !decremented) {
    return NextResponse.json(
      { error: "No gift credits remaining." },
      { status: 409 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);

  const { data: grant, error: grantError } = await supabaseAdmin
    .from("affiliate_grants")
    .insert({
      affiliate_id: affiliate.id,
      vault_fees: 1,
      video_credits: 6,
      photo_credits: 15,
      bundle: "anniversary",
      source: "affiliate_gift",
      recipient_email: recipientEmail,
      personal_message: personalMessage || null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (grantError || !grant) {
    // Roll back the credit decrement so the photographer keeps their slot.
    await supabaseAdmin
      .from("affiliates")
      .update({ gift_credits: affiliate.gift_credits || 0 })
      .eq("id", affiliate.id);
    return NextResponse.json(
      { error: grantError?.message || "Could not create gift." },
      { status: 500 }
    );
  }

  const businessName =
    affiliate.business_name || affiliate.name || "Your photographer";
  const claimUrl = `https://sealtheday.com/gift/claim/${grant.id}`;
  const expiresLabel = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const messageBlock = personalMessage
    ? `<blockquote style="margin: 24px 0; padding: 16px 20px; background: #fff8e7; border-left: 4px solid #C9A961; border-radius: 8px; font-style: italic; color: #1a2744; line-height: 1.6;">${escapeHtml(personalMessage)}</blockquote>`
    : "";

  try {
    await resend.emails.send({
      from: "SealTheDay <noreply@sealtheday.com>",
      to: recipientEmail,
      subject: `${businessName} sent you a wedding memory vault`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744; background: #fdf8f0;">
          <h1 style="color: #1a2744; margin-top: 0;">You've got a gift from ${escapeHtml(businessName)}</h1>
          ${messageBlock}
          <p style="font-size: 16px; line-height: 1.6;">
            They've gifted you a <strong>SealTheDay Anniversary Capsule</strong> &mdash; a private vault where your guests can record video messages for you to open on your first anniversary.
          </p>

          <div style="background: #ffffff; border: 1px solid #f1e8db; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">What's included</div>
            <ul style="margin: 8px 0 0; padding-left: 20px; line-height: 1.8; color: #1a2744;">
              <li>1 private memory vault</li>
              <li>6 video message slots</li>
              <li>15 photo upload slots</li>
              <li>Sealed for up to 12 months &mdash; opens on the date you choose</li>
            </ul>
          </div>

          <p style="margin-top: 28px; text-align: center;">
            <a href="${claimUrl}" style="background: #C9A961; color: #1a2744; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Claim my gift &rarr;</a>
          </p>

          <p style="margin-top: 32px; font-size: 13px; color: #6c6357; text-align: center;">
            Expires ${expiresLabel}.
          </p>

          <hr style="border: none; border-top: 1px solid #f1e8db; margin: 40px 0 20px;" />
          <p style="font-size: 12px; color: #8a8275; text-align: center; line-height: 1.5;">
            SealTheDay is a product of SendForGood, LLC.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send gift claim email:", emailError);
    // Roll back: re-increment gift_credits, delete the grant. The
    // photographer can try again instead of losing their slot to a
    // grant the recipient never received.
    await supabaseAdmin
      .from("affiliates")
      .update({ gift_credits: affiliate.gift_credits || 0 })
      .eq("id", affiliate.id);
    await supabaseAdmin.from("affiliate_grants").delete().eq("id", grant.id);
    return NextResponse.json(
      { error: "Could not send gift email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sent: true,
    expires_at: grant.expires_at,
    gift_id: grant.id,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
