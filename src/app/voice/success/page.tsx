import Link from "next/link";

export default function VoiceSuccessPage() {
  return (
    <div className="min-h-screen bg-cream">
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
