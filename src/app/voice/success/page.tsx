import Link from "next/link";
import PurchaseTracker from "@/components/PurchaseTracker";

export default function VoiceSuccessPage() {
  // Synthetic transaction id (hour-bucketed) — voice success URL doesn't
  // carry the Stripe session id today, so this approximates dedup. Add
  // `?session_id={CHECKOUT_SESSION_ID}` to the voice checkout's
  // success_url for proper deduplication.
  const hourBucket = Math.floor(Date.now() / (60 * 60 * 1000));
  const transactionId = `voice_${hourBucket}`;

  return (
    <div className="min-h-screen bg-cream">
      <PurchaseTracker
        transactionId={transactionId}
        valueUsd={0}
        itemCategory="voice_message"
      />
      <div className="mx-auto max-w-lg px-4 py-24 sm:px-6 text-center">
        <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
            <svg
              className="h-8 w-8 text-forest"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-navy">
            Your message plan is ready!
          </h1>

          <p className="mt-4 text-warm-gray">
            Head to your dashboard to record your message and set the delivery
            date whenever you are ready.
          </p>

          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-lg bg-forest px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-light"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
