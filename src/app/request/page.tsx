"use client";

import Link from "next/link";

export default function RequestMemoryPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg
            className="absolute -top-10 right-0 h-72 w-72 text-gold/10 sm:h-96 sm:w-96"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path
              d="M120 20c30 15 60 50 60 90s-20 60-50 70-70-10-80-50 10-80 40-100 30-10 30-10z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="text-6xl">🎙️</span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-navy sm:text-5xl">
            Ask someone to record a message for you.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-gray">
            Create a request, share the link, and receive a voice message on
            your chosen date. Birthdays, anniversaries, or just because.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            How it works
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <article className="rounded-2xl bg-cream p-8 text-center shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy text-lg font-bold text-cream">
                1
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy">
                Create a request
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Tell us what you want them to record and when you want to
                receive it.
              </p>
            </article>

            <article className="rounded-2xl bg-cream p-8 text-center shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy text-lg font-bold text-cream">
                2
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy">
                Share the link
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Send the link to anyone you want. They can record a message
                right from their browser &mdash; no account needed.
              </p>
            </article>

            <article className="rounded-2xl bg-cream p-8 text-center shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy text-lg font-bold text-cream">
                3
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy">
                Receive it on your date
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                On your chosen date, we email you every recording. Listen
                whenever you want.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <Link
            href="/request/create"
            className="inline-flex items-center justify-center rounded-lg bg-navy px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light"
          >
            Create Your Request
          </Link>
          <p className="mt-4 text-sm text-warm-gray">
            Creating a request is free. Storage and delivery fees apply.
          </p>
        </div>
      </section>
    </main>
  );
}
