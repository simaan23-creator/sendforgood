"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LetterSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const deliveryType = searchParams.get("delivery_type") || "physical";
  const quantity = parseInt(searchParams.get("quantity") || "1");

  const isDigital = deliveryType === "digital";
  const hasPhoto = deliveryType === "physical_photo";
  const plural = quantity > 1;

  const title = plural ? "Your Letters Are Scheduled" : "Your Letter Is Scheduled";

  const subtitle = isDigital
    ? `Your ${plural ? "letters have" : "letter has"} been saved and will be delivered automatically by email on the scheduled date${plural ? "s" : ""}. You can write and edit ${plural ? "them" : "it"} anytime from your dashboard.`
    : `Your ${plural ? "letters have" : "letter has"} been saved and will be printed on quality paper and mailed to the recipient${plural ? "s" : ""}. You can write and edit ${plural ? "them" : "it"} anytime from your dashboard before ${plural ? "they go" : "it goes"} to print.`;

  const steps = isDigital
    ? [
        "Your letters are stored securely in your account",
        "Write your letters anytime from your dashboard",
        "On the scheduled date, we automatically email them to the recipient",
        "They receive a beautifully formatted letter from you",
      ]
    : hasPhoto
    ? [
        "Your letters are stored securely in your account",
        "Upload a wallet-sized photo from your dashboard",
        "~2 weeks before delivery, we'll contact you to confirm everything looks good",
        "We print the letter and photo and mail them together to the recipient",
      ]
    : [
        "Your letters are stored securely in your account",
        "Write your letters anytime from your dashboard",
        "~2 weeks before delivery, we'll contact you to confirm everything looks good",
        "We print and mail your letter to the recipient on the scheduled date",
      ];

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
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-warm-gray">
          {subtitle}
        </p>

        {isDigital && (
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm font-medium text-gold-dark">
            📧 Digital delivery — fully automated
          </div>
        )}

        {hasPhoto && (
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm font-medium text-gold-dark">
            📸 Physical letter + photo — printed & mailed
          </div>
        )}

        <div className="mx-auto mt-10 max-w-md rounded-xl border border-cream-dark bg-white p-6 text-left space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
            What happens next
          </h2>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold-dark">
                {i + 1}
              </span>
              <p className="text-sm text-warm-gray">{step}</p>
            </div>
          ))}
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
