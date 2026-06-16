"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

// Per-credit prices in USD. Mirrors src/app/api/vault/checkout/route.ts —
// keep these in sync if pricing changes.
const PRICE_AUDIO_USD = 0.25;
const PRICE_VIDEO_USD = 1.0;
const PRICE_PHOTO_USD = 0.25;

function SuccessContent() {
  const searchParams = useSearchParams();
  const audio = searchParams.get("audio") || "0";
  const video = searchParams.get("video") || "0";
  const photo = searchParams.get("photo") || "0";
  const sessionId = searchParams.get("session_id") || "";
  const isGift = searchParams.get("gift") === "1";
  const giftRecipient = searchParams.get("recipient") || "";

  if (isGift) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
              <svg
                className="h-8 w-8 text-forest"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-navy">
              Gift sent &mdash; nicely done.
            </h1>
            <p className="mt-3 text-warm-gray">
              We just emailed{" "}
              <span className="font-semibold text-navy">
                {giftRecipient || "your recipient"}
              </span>{" "}
              a one-time link to claim their Anniversary Capsule. A confirmation
              copy is also on its way to your inbox.
            </p>
            <p className="mt-4 text-sm text-warm-gray">
              If they don&apos;t see it in the next few minutes, ask them to
              check spam (the claim email comes from{" "}
              <span className="font-mono text-xs">noreply@sealtheday.com</span>).
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/vault/my"
                className="rounded-lg bg-gold px-6 py-4 text-base font-bold text-navy shadow-md transition hover:bg-gold-light"
              >
                Back to my dashboard
              </Link>
              <Link
                href="/vault/buy?bundle=anniversary"
                className="text-sm font-medium text-warm-gray underline hover:text-navy"
              >
                Send another Anniversary Capsule
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fire purchase conversion to GA4 + Google Ads on mount. trackPurchase
  // dedupes via sessionStorage so a refresh won't double-count.
  useEffect(() => {
    const audioN = parseInt(audio, 10) || 0;
    const videoN = parseInt(video, 10) || 0;
    const photoN = parseInt(photo, 10) || 0;
    const valueUsd =
      audioN * PRICE_AUDIO_USD +
      videoN * PRICE_VIDEO_USD +
      photoN * PRICE_PHOTO_USD;
    if (valueUsd <= 0) return;
    // Fall back to a synthetic id if Stripe didn't supply session_id (legacy
    // success URLs without the CHECKOUT_SESSION_ID template).
    const transactionId =
      sessionId ||
      `vault_${audioN}a_${videoN}v_${photoN}p_${Math.floor(Date.now() / 1000)}`;
    trackPurchase({
      transactionId,
      valueUsd,
      itemCategory: "vault_credits",
    });
  }, [audio, video, photo, sessionId]);

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
            <svg
              className="h-8 w-8 text-forest"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-navy">
            You&rsquo;re in. Let&rsquo;s build your vault.
          </h1>
          <p className="mt-3 text-warm-gray">
            Your credits are live. Three quick steps and your guests can start recording.
          </p>
          <p className="mt-2 text-xs text-warm-gray-light">
            Yours forever &mdash; once your vault opens, you can download and keep
            every video and photo on your own devices.
          </p>

          <div className="mt-6 rounded-lg bg-cream p-4">
            <div className="flex justify-center gap-6">
              {parseInt(audio) > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-navy">{audio}</p>
                  <p className="text-sm text-warm-gray">Audio credits</p>
                </div>
              )}
              {parseInt(video) > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-navy">{video}</p>
                  <p className="text-sm text-warm-gray">Video credits</p>
                </div>
              )}
              {parseInt(photo) > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-navy">{photo}</p>
                  <p className="text-sm text-warm-gray">Photo credits</p>
                </div>
              )}
            </div>
          </div>

          {/* What's next checklist */}
          <ol className="mt-8 space-y-3 text-left text-sm">
            <li className="flex items-start gap-3 rounded-lg border-2 border-gold bg-gold/5 p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                1
              </span>
              <div>
                <div className="font-semibold text-navy">Name your vault &amp; pick your seal date</div>
                <div className="mt-0.5 text-xs text-warm-gray">
                  Takes 60 seconds. Seal it for the morning after, your 1st anniversary, or your 10th.
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-cream-dark p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-dark text-xs font-bold text-navy">
                2
              </span>
              <div>
                <div className="font-semibold text-navy">Grab your Wedding Kit</div>
                <div className="mt-0.5 text-xs text-warm-gray">
                  Printable QR table cards, MC script, and guest invitations &mdash; ready to print.
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-cream-dark p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-dark text-xs font-bold text-navy">
                3
              </span>
              <div>
                <div className="font-semibold text-navy">Share with your guests</div>
                <div className="mt-0.5 text-xs text-warm-gray">
                  Drop the link in your wedding website, text it, or just leave the QR cards on every table.
                </div>
              </div>
            </li>
          </ol>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/request/create"
              className="rounded-lg bg-gold px-6 py-4 text-base font-bold text-navy shadow-md transition hover:bg-gold-light"
            >
              Create my vault now &rarr;
            </Link>
            <Link
              href="/vault/my"
              className="text-sm font-medium text-warm-gray underline hover:text-navy"
            >
              I&rsquo;ll do it later &mdash; take me to my dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VaultSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
