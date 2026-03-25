import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — SendForGood",
};

export default function AboutPage() {
  return (
    <>
      {/* ───────────────────────────── Hero Section ───────────────────────────── */}
      <section className="bg-gradient-to-b from-cream to-cream-dark px-6 py-24 sm:py-32 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-navy sm:text-5xl md:text-6xl">
            Every Gift Tells a Story
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            SendForGood was born from a simple but powerful idea: love
            shouldn&rsquo;t stop being expressed just because life is
            unpredictable.
          </p>
        </div>
      </section>

      {/* ──────────────────────── Our Story Section ─────────────────────────── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Why We Built SendForGood
          </h2>

          <div className="mt-12 space-y-8">
            <p className="text-lg leading-relaxed text-warm-gray">
              It started with a question a father asked himself:{" "}
              <em className="font-medium text-navy not-italic">
                &ldquo;If something happened to me tomorrow, would my daughter
                still get a birthday gift from me every year?&rdquo;
              </em>
            </p>

            <p className="text-lg leading-relaxed text-warm-gray">
              That question became an obsession, then a mission, then
              SendForGood. We believe that the people you love should feel your
              love&nbsp;&mdash; on their birthday, their anniversary, their
              graduation&nbsp;&mdash; year after year, no matter what life
              brings.
            </p>

            <p className="text-lg leading-relaxed text-warm-gray">
              We&rsquo;re not just a gift company.{" "}
              <span className="font-semibold text-navy">
                We&rsquo;re a legacy company.
              </span>{" "}
              We help you set up a chain of love that keeps going, so your
              presence is felt even in your absence.
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────── How It Works (Brief) ────────────────────────── */}
      <section className="bg-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Simple by Design
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {/* Card 1 — You Choose */}
            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-navy">
                You Choose
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Pick who you love, what occasions matter, and how many years of
                gifts you want to send.
              </p>
            </article>

            {/* Card 2 — We Curate */}
            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-forest">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <rect x="3" y="8" width="18" height="13" rx="2" />
                  <path d="M12 8v13" />
                  <path d="M3 13h18" />
                  <path d="M8 8c0-2 0-5 4-5" />
                  <path d="M16 8c0-2 0-5-4-5" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-navy">
                We Curate
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Our team hand-selects a thoughtful, beautifully wrapped gift
                tailored to the recipient and the occasion.
              </p>
            </article>

            {/* Card 3 — They Receive */}
            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-navy">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-navy">
                They Receive
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Year after year, your loved one gets a gift from you&nbsp;&mdash;
                on time, with your personal message, no matter what.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ──────────────────── The Legacy Promise Section ────────────────────── */}
      <section className="bg-cream-dark px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            What Happens to My Gifts If Something Happens to Me?
          </h2>

          <div className="mt-12 space-y-6">
            <p className="text-center text-lg leading-relaxed text-warm-gray">
              This is the question at the heart of everything we do.
              Here&rsquo;s our promise:
            </p>

            <div className="rounded-2xl bg-white p-8 shadow-md sm:p-10">
              <div className="space-y-6">
                <p className="text-lg leading-relaxed text-warm-gray">
                  <span className="font-semibold text-navy">
                    Your gifts are prepaid and pre-planned.
                  </span>{" "}
                  Once you set up a gift plan, we honor it&nbsp;&mdash;
                  completely and unconditionally.
                </p>

                <p className="text-lg leading-relaxed text-warm-gray">
                  If something happens to you, your recipient will still receive
                  every gift you&rsquo;ve arranged.{" "}
                  <span className="font-medium text-navy">
                    Every birthday. Every holiday. Every special occasion.
                  </span>{" "}
                  For as many years as you&rsquo;ve chosen.
                </p>

                <p className="text-lg leading-relaxed text-warm-gray">
                  We keep a secure record of every plan. Your gifts will arrive
                  on time, beautifully wrapped, with whatever message
                  you&rsquo;ve chosen.{" "}
                  <span className="font-semibold text-forest">
                    Your love keeps arriving.
                  </span>
                </p>

                <p className="text-lg leading-relaxed text-warm-gray">
                  You can also designate a{" "}
                  <span className="font-medium text-navy">
                    trusted contact
                  </span>{" "}
                  who can update delivery addresses or manage your plans if
                  needed.
                </p>
              </div>
            </div>

            <p className="pt-4 text-center text-xl font-semibold leading-relaxed text-navy">
              That&rsquo;s the SendForGood promise.
              <br />
              Set it once. They&rsquo;ll feel your love for years to come.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Values Section ────────────────────────────── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            What We Stand For
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Reliability */}
            <article className="rounded-2xl border border-cream-dark bg-cream p-8 text-center transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy">
                Reliability
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                Every gift, on time, every year. We never miss a delivery.
              </p>
            </article>

            {/* Thoughtfulness */}
            <article className="rounded-2xl border border-cream-dark bg-cream p-8 text-center transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy">
                Thoughtfulness
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                Each gift is hand-curated for the occasion and the recipient.
              </p>
            </article>

            {/* Security */}
            <article className="rounded-2xl border border-cream-dark bg-cream p-8 text-center transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy">
                Security
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                Your plans and payments are protected with bank-level
                encryption.
              </p>
            </article>

            {/* Legacy */}
            <article className="rounded-2xl border border-cream-dark bg-cream p-8 text-center transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy">Legacy</h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                We exist so your love outlasts everything else.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ────────────────────────── CTA Section ─────────────────────────────── */}
      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl md:text-5xl">
            Ready to Start Your Legacy?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/80">
            It only takes a few minutes to set up a gift plan that lasts for
            years. Your loved ones deserve to feel your love&nbsp;&mdash; always.
          </p>
          <div className="mt-10">
            <Link
              href="/send"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Start Sending
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
