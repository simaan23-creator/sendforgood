import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// CAN-SPAM compliance endpoint. Every cold outreach email links here with
// ?email=<recipient>&token=<hmac>. We accept the request even if the token
// is missing/invalid — getting opt-outs is more important than preventing
// a tiny amount of false-positive unsubscribes from people who type into
// the URL bar. (Worst case: someone unsubs another photographer they
// dislike. Same outcome: that photographer isn't bothered by us again.)
//
// On success we both:
//   1. Insert into lead_unsubscribes (the canonical suppression list)
//   2. Update photographer_leads.status='unsubscribed' for matching rows

async function processUnsubscribe(email: string) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }
  const normalized = email.trim().toLowerCase();

  await supabaseAdmin
    .from("lead_unsubscribes")
    .upsert(
      { email: normalized, reason: "user_request" },
      { onConflict: "email", ignoreDuplicates: true }
    );

  await supabaseAdmin
    .from("photographer_leads")
    .update({ status: "unsubscribed" })
    .eq("email", normalized);

  return { ok: true };
}

// GET allows one-click unsubscribe directly from the email link (some
// clients won't follow POST without a confirmation step).
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`leads-unsub-get:${ip}`, 20, 20 / 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const email = new URL(request.url).searchParams.get("email") || "";
  const result = await processUnsubscribe(email);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";
  if (!result.ok) {
    return NextResponse.redirect(`${siteUrl}/leads/unsubscribed?error=1`, 302);
  }
  return NextResponse.redirect(
    `${siteUrl}/leads/unsubscribed?ok=1&email=${encodeURIComponent(email)}`,
    302
  );
}

// POST for programmatic use (admin tooling, "Mark unsubscribed" buttons).
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`leads-unsub-post:${ip}`, 20, 20 / 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = await processUnsubscribe(body.email || "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
