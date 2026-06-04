import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Public photographer/planner signup endpoint. Auto-approves and issues a
// referral code + portal password so the new affiliate can start sharing
// their link the same minute they apply — friction kills outreach response
// rates and we manually pause bad actors via /api/admin/affiliates PATCH
// active=false if anyone abuses the program.

const RESERVED_CODES = new Set([
  "admin",
  "api",
  "apply",
  "dashboard",
  "login",
  "signup",
  "test",
  "demo",
  "support",
  "help",
  "about",
  "pricing",
  "contact",
  "privacy",
  "terms",
]);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function randomSuffix(len = 4): string {
  // Lowercase hex avoids look-alike chars and matches existing /^[a-z0-9_-]+$/ rule.
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
}

function randomPassword(len = 12): string {
  // URL-safe alphabet, no ambiguous chars (no 0/O/1/l/I).
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function generateUniqueCode(businessName: string): Promise<string | null> {
  const base = slugify(businessName) || "partner";
  // Try the bare slug first (cleaner share link), then append random suffix.
  const candidates = [base, ...Array.from({ length: 6 }, () => `${base}-${randomSuffix()}`)];
  for (const candidate of candidates) {
    if (RESERVED_CODES.has(candidate)) continue;
    const { data } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return null;
}

export async function POST(request: Request) {
  // 3 applications per 10 minutes per IP — generous enough for legit users,
  // tight enough to make scripted abuse painful.
  const ip = getClientIp(request);
  const limit = rateLimit(`affiliate-apply:${ip}`, 3, 3 / 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many applications. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const businessName = typeof body.business_name === "string" ? body.business_name.trim() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";
  const instagram = typeof body.instagram === "string" ? body.instagram.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const audience = typeof body.audience === "string" ? body.audience.trim() : "";

  if (!name || !email || !businessName) {
    return NextResponse.json(
      { error: "Name, email, and business name are required." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (name.length > 80 || businessName.length > 80 || email.length > 120) {
    return NextResponse.json({ error: "One or more fields are too long." }, { status: 400 });
  }

  // Block duplicate applications under the same email — return the existing
  // code/password so the photographer doesn't have to email support to
  // recover access.
  const { data: existing } = await supabaseAdmin
    .from("affiliates")
    .select("code, portal_password")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      already_registered: true,
      code: existing.code,
      portal_url: `https://sealtheday.com/affiliate/${existing.code}`,
      message:
        "You're already in the program. Your existing code and portal link are below.",
    });
  }

  const code = await generateUniqueCode(businessName);
  if (!code) {
    return NextResponse.json(
      { error: "Could not generate a unique code. Try a different business name." },
      { status: 500 }
    );
  }
  const portalPassword = randomPassword(12);

  const notesParts = [
    website ? `Website: ${website}` : null,
    instagram ? `Instagram: ${instagram}` : null,
    city || state ? `Based in: ${[city, state].filter(Boolean).join(", ")}` : null,
    audience ? `Audience: ${audience}` : null,
    "Signed up via /affiliate/apply",
  ].filter(Boolean);

  const { data: affiliate, error } = await supabaseAdmin
    .from("affiliates")
    .insert({
      name,
      email,
      code,
      business_name: businessName,
      first_commission_rate: 15,
      repeat_commission_rate: 10,
      notes: notesParts.join(" • "),
      portal_password: portalPassword,
      active: true,
      total_earned: 0,
      total_paid: 0,
    })
    .select()
    .single();

  if (error || !affiliate) {
    return NextResponse.json(
      { error: error?.message || "Could not create affiliate." },
      { status: 500 }
    );
  }

  // D1: grant the free Anniversary Capsule (1 vault + 6 video + 15 photo).
  // Stored in affiliate_grants — claimed when the affiliate logs into a
  // user account whose email matches their affiliate email. Failure here is
  // non-fatal: the affiliate row already exists and we'd rather they have
  // working access than block on a grant insert.
  try {
    await supabaseAdmin.from("affiliate_grants").insert({
      affiliate_id: affiliate.id,
      vault_fees: 1,
      video_credits: 6,
      photo_credits: 15,
      bundle: "anniversary",
      source: "affiliate_signup_grant",
    });
  } catch (grantError) {
    console.error("Failed to grant free Anniversary Capsule:", grantError);
  }

  const portalUrl = `https://sealtheday.com/affiliate/${code}`;
  const shareLink = `https://sealtheday.com/?ref=${code}`;

  // Welcome email to the new affiliate. Best-effort: the row already exists,
  // so a Resend failure shouldn't fail the request — they can still log in.
  try {
    await resend.emails.send({
      from: "SealTheDay <noreply@sealtheday.com>",
      to: email,
      subject: "You're in — your SealTheDay affiliate link is ready",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744; background: #fdf8f0;">
          <h1 style="color: #1a2744; margin-top: 0;">Welcome, ${name.split(" ")[0]}.</h1>
          <p style="font-size: 16px; line-height: 1.6;">Thanks for joining the SealTheDay affiliate program. You're approved and earning starts on your first referral.</p>

          <div style="background: #fff8e7; border: 1px solid #C9A961; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">Welcome gift &mdash; on us</div>
            <p style="margin: 6px 0; font-size: 15px; color: #1a2744;"><strong>A free Anniversary Capsule</strong> (1 vault + 6 video + 15 photo slots, sealed up to 1 year) is waiting in your dashboard.</p>
            <p style="margin: 10px 0 0; font-size: 13px; color: #6c6357;">Use it for your own family so you can pitch it from experience. Log in to <a href="https://sealtheday.com/auth" style="color: #722F37;">your dashboard</a> with this email to claim it.</p>
          </div>

          <div style="background: #ffffff; border: 1px solid #f1e8db; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">Your share link</div>
            <p style="margin: 6px 0; font-family: ui-monospace, Menlo, monospace; word-break: break-all;"><a href="${shareLink}" style="color: #722F37;">${shareLink}</a></p>
            <p style="margin: 12px 0 0; font-size: 13px; color: #6c6357;">Anyone who clicks this link is cookied to your code for 30 days. Commissions: <strong>15%</strong> on first purchase, <strong>10%</strong> on every repeat purchase forever.</p>
          </div>

          <div style="background: #ffffff; border: 1px solid #f1e8db; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">Your dashboard</div>
            <p style="margin: 6px 0;"><a href="${portalUrl}" style="color: #722F37;">${portalUrl}</a></p>
            <p style="margin: 6px 0;">Portal password: <strong style="font-family: ui-monospace, Menlo, monospace;">${portalPassword}</strong></p>
            <p style="margin: 12px 0 0; font-size: 13px; color: #6c6357;">Save this email. The dashboard has live earnings, QR codes for your booth/cards, and pre-written client emails you can copy-paste.</p>
          </div>

          <h2 style="font-size: 18px; margin: 32px 0 12px; color: #1a2744;">Best ways to share</h2>
          <ol style="padding-left: 20px; line-height: 1.7; color: #2a1418;">
            <li><strong>In your booking confirmation email.</strong> One line: "While you wait, here's a $99 wedding vault so your guests can capture everything I miss."</li>
            <li><strong>On your client questionnaire.</strong> Add a checkbox: "Yes, send me the guest memory vault." Forward responses to your link.</li>
            <li><strong>On your booth or business cards.</strong> Drop a QR code from your dashboard.</li>
          </ol>

          <p style="margin-top: 32px;">Questions? Just reply to this email — it goes straight to me.<br/>— Simaan, founder of SealTheDay</p>

          <hr style="border: none; border-top: 1px solid #f1e8db; margin: 40px 0 20px;" />
          <p style="font-size: 12px; color: #8a8275; text-align: center; line-height: 1.5;">
            SealTheDay is a product of SendForGood, LLC.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send affiliate welcome email:", emailError);
  }

  // Owner notification — quiet on failure, this is internal-only.
  try {
    await resend.emails.send({
      from: "SealTheDay <noreply@sealtheday.com>",
      to: "Simaan23@gmail.com",
      subject: `New affiliate signup: ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2>New affiliate signup</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Business:</strong> ${businessName}</p>
          <p><strong>Code:</strong> ${code}</p>
          <p><strong>Share link:</strong> <a href="${shareLink}">${shareLink}</a></p>
          ${website ? `<p><strong>Website:</strong> ${website}</p>` : ""}
          ${instagram ? `<p><strong>Instagram:</strong> ${instagram}</p>` : ""}
          ${city || state ? `<p><strong>Location:</strong> ${[city, state].filter(Boolean).join(", ")}</p>` : ""}
          ${audience ? `<p><strong>Audience:</strong> ${audience}</p>` : ""}
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send affiliate owner notification:", emailError);
  }

  return NextResponse.json({
    code,
    portal_url: portalUrl,
    share_link: shareLink,
    portal_password: portalPassword,
  });
}
