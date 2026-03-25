import Link from "next/link";
import { TIERS } from "@/lib/constants";

export default function HomePage() {
  return (
    <main>
      {/* ───────────────────────────── Hero Section ───────────────────────────── */}
      <section className="bg-gradient-to-b from-cream to-cream-dark px-6 py-20 sm:py-28 md:py-36">
        <div className="mx-auto max-w-4xl text-center md:text-left">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Send a gift.
            <br />
            <span className="text-gold">For good.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl md:mx-0">
            Prepay for gifts to be delivered to your loved ones every year
            &mdash; birthdays, holidays, milestones. Even after you&rsquo;re
            gone, your love keeps arriving.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
            <Link
              href="/send"
              className="inline-flex w-full items-center justify-center rounded-lg bg-forest px-8 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:w-auto"
            >
              Start Sending
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ──────────────────────── How It Works Section ────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            How It Works
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Step 1 */}
            <article className="rounded-2xl bg-cream p-8 shadow-md transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-lg font-bold text-white">
                1
              </div>

              <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center text-navy">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M12 11l-1.5 2.5L12 16l1.5-2.5z" />
                  <path d="M10.5 13.5C9 14 8 15 8 16.5" />
                  <path d="M13.5 13.5C15 14 16 15 16 16.5" />
                </svg>
              </div>

              <h3 className="mt-5 text-center text-xl font-semibold">
                Choose Your Recipient
              </h3>
              <p className="mt-3 text-center leading-relaxed text-warm-gray">
                Tell us who you want to surprise and what occasion to celebrate.
              </p>
            </article>

            {/* Step 2 */}
            <article className="rounded-2xl bg-cream p-8 shadow-md transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-lg font-bold text-white">
                2
              </div>

              <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center text-navy">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12"
                >
                  <rect x="3" y="8" width="18" height="13" rx="2" />
                  <path d="M12 8v13" />
                  <path d="M3 13h18" />
                  <path d="M8 8c0-2 0-5 4-5" />
                  <path d="M16 8c0-2 0-5-4-5" />
                </svg>
              </div>

              <h3 className="mt-5 text-center text-xl font-semibold">
                Pick a Plan
              </h3>
              <p className="mt-3 text-center leading-relaxed text-warm-gray">
                Select a gift tier and how many years you&rsquo;d like to send
                gifts.
              </p>
            </article>

            {/* Step 3 */}
            <article className="rounded-2xl bg-cream p-8 shadow-md transition hover:shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-lg font-bold text-white">
                3
              </div>

              <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center text-navy">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12"
                >
                  <rect x="1" y="12" width="15" height="8" rx="1" />
                  <path d="M16 12h4l3 3v5h-7" />
                  <circle cx="5.5" cy="20" r="2.5" />
                  <circle cx="18.5" cy="20" r="2.5" />
                  <path d="M8 20h8" />
                  <path d="M1 15h15" />
                </svg>
              </div>

              <h3 className="mt-5 text-center text-xl font-semibold">
                We Deliver, Every Year
              </h3>
              <p className="mt-3 text-center leading-relaxed text-warm-gray">
                Sit back. We&rsquo;ll curate and deliver the perfect gift, year
                after year.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── Pricing Section ──────────────────────────── */}
      <section
        id="pricing"
        className="bg-gradient-to-b from-cream-dark to-cream px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Choose Your Gift Tier
            </h2>
            <p className="mt-3 text-lg text-warm-gray">
              One-time payment. Years of joy.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TIERS.map((tier) => {
              const isPopular = "popular" in tier && tier.popular;
              return (
                <article
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl ${
                    isPopular
                      ? "border-gold shadow-lg ring-2 ring-gold/30"
                      : "border-cream-dark shadow-md"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold tracking-wide text-white uppercase">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-center text-xl font-bold">{tier.name}</h3>

                  <p className="mt-3 text-center">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${tier.price}
                    </span>
                    <span className="text-sm text-warm-gray">/yr</span>
                  </p>

                  <p className="mt-3 text-center text-sm leading-relaxed text-warm-gray">
                    {tier.description}
                  </p>

                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="mt-0.5 h-4 w-4 shrink-0 text-forest"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-warm-gray">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/send"
              className="inline-flex items-center justify-center rounded-lg bg-forest px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              Start Sending Today
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Testimonials Section ───────────────────────── */}
      <section className="bg-cream-dark px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Stories from Our Gift-Givers
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  "I set up birthday gifts for my daughter for the next 18 years. Knowing she\u2019ll always get something from me, no matter what, gives me incredible peace of mind.",
                author: "Sarah M.",
                role: "Mother",
              },
              {
                quote:
                  "After my father passed, a gift arrived on my birthday with a note he had written. I\u2019ve never felt so loved and so heartbroken at the same time. What a beautiful service.",
                author: "James T.",
                role: "Son",
              },
              {
                quote:
                  "We set up anniversary gifts for each other. It\u2019s become our little tradition that takes zero effort but brings so much joy every year.",
                author: "The Hendersons",
                role: "",
              },
            ].map((testimonial) => (
              <blockquote
                key={testimonial.author}
                className="flex flex-col rounded-2xl bg-cream p-8 shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mb-4 h-8 w-8 text-gold-light"
                  aria-hidden="true"
                >
                  <path d="M11.3 2.8C6.1 5.1 3 9.2 3 14c0 3.3 2.4 6 5.4 6 2.6 0 4.6-2 4.6-4.4 0-2.5-1.8-4.2-4.1-4.2-.4 0-1 .1-1.2.2.6-3 3-5.8 5.8-7.4L11.3 2.8zm10 0C16.1 5.1 13 9.2 13 14c0 3.3 2.4 6 5.4 6 2.6 0 4.6-2 4.6-4.4 0-2.5-1.8-4.2-4.1-4.2-.4 0-1 .1-1.2.2.6-3 3-5.8 5.8-7.4L21.3 2.8z" />
                </svg>

                <p className="flex-1 text-base leading-relaxed text-warm-gray italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <footer className="mt-6 border-t border-cream-dark pt-4">
                  <cite className="not-italic">
                    <span className="font-semibold text-navy">
                      {testimonial.author}
                    </span>
                    {testimonial.role && (
                      <span className="ml-1 text-sm text-warm-gray-light">
                        &mdash; {testimonial.role}
                      </span>
                    )}
                  </cite>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── Final CTA Section ────────────────────────── */}
      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl md:text-5xl">
            Start a Legacy of Love
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/80">
            Set it up once. They&rsquo;ll feel your love for years to come.
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
    </main>
  );
}
