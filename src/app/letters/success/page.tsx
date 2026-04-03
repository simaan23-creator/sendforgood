"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LetterSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest/10">
            <svg
              className="h-10 w-10 text-forest"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Your Letter Is Scheduled
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-warm-gray">
          Your Legacy Letter has been saved and will be printed on premium
          stationery and delivered on schedule. You can edit it anytime from
          your dashboard before it goes to print.
        </p>

        <div className="mx-auto mt-10 max-w-md rounded-xl border border-cream-dark bg-white p-6 text-left space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
            What happens next
          </h2>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold-dark">
              1
            </span>
            <p className="text-sm text-warm-gray">
              Your letter is stored securely in your account
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold-dark">
              2
            </span>
            <p className="text-sm text-warm-gray">
              ~2 weeks before delivery, we&apos;ll send you a preview to confirm
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold-dark">
              3
            </span>
            <p className="text-sm text-warm-gray">
              We print it on premium stationery and mail it to the recipient
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold-dark">
              4
            </span>
            <p className="text-sm text-warm-gray">
              Your letter arrives on the exact date you chose
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light"
          >
            View Your Letters
          </Link>
          <Link
            href="/letters/write"
            className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-8 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
          >
            Write Another Letter
          </Link>
        </div>

        {sessionId && (
          <p className="mt-8 text-xs text-warm-gray-light">
            Confirmation ID: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
}
