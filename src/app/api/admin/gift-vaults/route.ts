import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import crypto from "crypto";

const ADMIN_PASSWORD = "SendAdmin2026!";

function generateClaimCode(): string {
  return crypto.randomBytes(8).toString("hex");
}

// GET: List all admin vault gifts
export async function GET(request: Request) {
  const password = request.headers.get("x-admin-password");
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: gifts, error } = await supabaseAdmin
    .from("admin_vault_gifts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gifts: gifts || [] });
}

// POST: Send a vault gift package
export async function POST(request: Request) {
  const password = request.headers.get("x-admin-password");
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    recipientName,
    recipientEmail,
    audioCredits = 0,
    videoCredits = 0,
    photoCredits = 0,
    message,
  } = body;

  if (!recipientName || !recipientEmail) {
    return NextResponse.json(
      { error: "Recipient name and email are required" },
      { status: 400 }
    );
  }

  if (audioCredits <= 0 && videoCredits <= 0 && photoCredits <= 0) {
    return NextResponse.json(
      { error: "Must include at least one credit" },
      { status: 400 }
    );
  }

  const claimCode = generateClaimCode();

  const { data: gift, error: insertError } = await supabaseAdmin
    .from("admin_vault_gifts")
    .insert({
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      audio_credits: audioCredits,
      video_credits: videoCredits,
      photo_credits: photoCredits,
      message: message || null,
      claim_code: claimCode,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create admin vault gift:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sendforgood.com";
  const claimUrl = `${baseUrl}/claim/vault/${claimCode}`;

  const creditParts = [];
  if (audioCredits > 0) creditParts.push(`${audioCredits} audio`);
  if (videoCredits > 0) creditParts.push(`${videoCredits} video`);
  if (photoCredits > 0) creditParts.push(`${photoCredits} photo`);
  const creditSummary = creditParts.join(", ") + " recording slots";

  try {
    await resend.emails.send({
      from: "SendForGood <hello@sendforgood.com>",
      to: recipientEmail,
      subject: "You've been gifted a Memory Vault!",
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #FDF8F0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: rgba(200, 169, 98, 0.1); border-radius: 50%; padding: 16px;">
              <span style="font-size: 32px;">&#x1F381;</span>
            </div>
          </div>
          <h1 style="color: #1B2A4A; text-align: center; font-size: 24px; margin-bottom: 8px;">
            You've been gifted a Memory Vault!
          </h1>
          <p style="color: #6B7280; text-align: center; font-size: 16px; margin-bottom: 24px;">
            Hi <strong style="color: #1B2A4A;">${recipientName}</strong>, someone special has gifted you a Memory Vault on SendForGood &mdash; a place to collect audio, video, and photo messages from your loved ones.
          </p>
          <div style="background: rgba(200, 169, 98, 0.08); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #1B2A4A; font-weight: bold; margin: 0 0 8px 0;">Your package includes:</p>
            <p style="color: #6B7280; margin: 0;">${creditSummary}</p>
            <p style="color: #6B7280; margin: 4px 0 0 0;">+ Free vault creation</p>
          </div>
          ${
            message
              ? `<div style="background: rgba(200, 169, 98, 0.08); border-left: 4px solid #C8A962; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="color: #1B2A4A; font-style: italic; margin: 0;">"${message}"</p>
                </div>`
              : ""
          }
          <div style="text-align: center; margin-top: 24px;">
            <a href="${claimUrl}" style="display: inline-block; background-color: #2D5016; color: #FDF8F0; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Claim Your Vault
            </a>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
            SendForGood &mdash; Gifts that keep on giving
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send vault gift email:", emailError);
  }

  return NextResponse.json({
    success: true,
    gift,
    claimUrl,
  });
}
