import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 5 messages per IP per hour (refill ~1 per 12 min, burst of 5)
  const ip = getClientIp(request);
  const limit = rateLimit(`contact:${ip}`, 5, 5 / 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    await resend.emails.send({
      from: "SealTheDay <noreply@sendforgood.com>",
      to: "support@sendforgood.com",
      subject: `Contact form: ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }
}
