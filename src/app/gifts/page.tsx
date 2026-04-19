import Link from "next/link";
import type { Metadata } from "next";
import { TIERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Our Gifts | SendForGood",
  description:
    "AI-curated gifts shipped directly to your loved ones — every year, automatically. Five tiers from $20 to $200. You tell us about them, we handle the rest.",
};

const TIER_STYLES: Record<string, string> = {
  Starter: "bg-warm-gray-light/20 text-warm-gray",
  Classic: "bg-forest/10 text-forest",
  Premium: "bg-gold/20 text-gold-dark",
  Deluxe: "bg-navy/10 text-navy",
  Legacy: "bg-gold-dark/20 text-gold-dark",
};

const OCCASIONS = [
  { emoji: "\u{1F382}", title: "Birthdays", desc: "A gift every year, right on time." },
  { emoji: "\u{1F393}", title: "Graduations", desc: "Mark the milestone with something they will remember." },
  { emoji: "\u{1F491}", title: "Anniversaries", desc: "Love that shows up, year after year." },
  { emoji: "\u{1F384}", title: "Holidays", desc: "Festive gifts that arrive when the season calls for it." },
  { emoji: "\u{1F3E2}", title: "Business & Corporate", desc: "Keep clients and employees feeling valued." },
  { emoji: "\u{1F381}", title: "Just Because", desc: "Sometimes the best gifts have no reason at all." },
  { emoji: "\uD83D\uDC3E", title: "For Your Pets", desc: "Because the animals in our lives deserve to be celebrated too." },
];

const SAMPLE_PRODUCTS = [
  {
    tier: "Starter",
    price: "$20",
    items: ["Premium scented candle", "Fun card game or puzzle", "Cozy novelty socks set", "Cool desk toy or gadget", "Artisan chocolate box"],
  },
  {
    tier: "Classic",
    price: "$45",
    items: ["Quality skincare or grooming set", "Great book + leather bookmark", "Unique kitchen gadget", "Premium tea or coffee set", "Cozy throw blanket"],
  },
  {
    tier: "Premium",
    price: "$80",
    popular: true,
    items: ["Spa or self-care gift set", "Nice leather wallet or accessory", "Premium board game", "Quality tech accessory", "Gourmet food hamper"],
  },
  {
    tier: "Deluxe",
    price: "$125",
    items: ["Wireless earbuds or headphones", "Premium smartwatch or fitness tracker", "High-end skincare collection", "Designer fragrance", "Luxury home item"],
  },
  {
    tier: "Legacy",
    price: "$200",
    items: ["High-end tech gadget", "Premium experience gift card", "Designer accessory", "Luxury fragrance or skincare", "High-end kitchen or home item"],
  },
];

export default function OurGiftsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-cream to-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            SendForGood Gifts
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            A gift that arrives every year.{" "}
            <span className="text-gold">Automatically.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Tell us about your recipient &mdash; their age, interests, and the
            occasion. We select, wrap, and ship a thoughtful gift directly to
            their door. Every year. No two gifts are exactly alike.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/gifts/buy"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-10 py-4 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Send a Gift
            </Link>
          </div>
        </div>
      </section>

      {/* Five Tiers */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Five tiers. One promise.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
            Every gift includes personal selection, a handwritten-style message
            card, and delivery directly to their door.
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
                <h3 className="text-center text-xl font-bold text-navy">
                  {tier.name}
                </h3>
                <p className="mt-3 text-center">
                  <span className="text-4xl font-extrabold tracking-tight text-navy">
                    ${tier.price}
                  </span>
                  <span className="text-sm text-warm-gray"> per gift</span>
                </p>
                <p className="mt-3 text-center text-sm leading-relaxed text-warm-gray">
                  {tier.description}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
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
                <Link
                  href="/gifts/buy"
                  className={`mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isPopular
                      ? "bg-gold text-navy hover:bg-gold-light focus-visible:outline-gold shadow-sm"
                      : "bg-navy text-cream hover:bg-navy-light focus-visible:outline-navy shadow-sm"
                  }`}
                >
                  Send a Gift &mdash; ${tier.price}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* Sample Products */}
      <section className="bg-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            What kind of gifts do we send?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-warm-gray">
            These are examples of actual products we send. Your recipient will
            receive something similar based on their interests. Exact items vary.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {SAMPLE_PRODUCTS.map((sp) => (
              <div
                key={sp.tier}
                className={`rounded-2xl border bg-white p-6 shadow-md ${
                  sp.popular ? "border-gold ring-2 ring-gold/30" : "border-cream-dark"
                }`}
              >
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES[sp.tier]}`}>
                  {sp.tier}
                </span>
                <p className="mt-2 text-lg font-bold text-navy">
                  {sp.price}<span className="text-sm font-normal text-warm-gray"> per gift</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-warm-gray">
                  {sp.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-forest">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            A gift for every occasion
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {OCCASIONS.map((oc) => (
              <div
                key={oc.title}
                className="rounded-2xl border border-cream-dark bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-3xl">{oc.emoji}</span>
                <h3 className="mt-3 text-lg font-bold text-navy">{oc.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">{oc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How it works
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: 1,
                title: "Choose a tier",
                text: "Pick a gift tier that fits your budget. Buy as many as you need.",
              },
              {
                step: 2,
                title: "Assign a recipient",
                text: "Tell us their name, interests, age, and occasion. Set a delivery date.",
              },
              {
                step: 3,
                title: "We handle the rest",
                text: "We select, wrap, and ship a thoughtful gift directly to their door. Every year.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Ready to start sending?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cream/80">
            Pick a tier. Assign recipients from your dashboard whenever you are
            ready &mdash; we handle the rest.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/gifts/buy"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-10 py-4 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Send a Gift &mdash; From $20
            </Link>
            <Link
              href="/business"
              className="inline-flex items-center justify-center rounded-lg border-2 border-cream/30 px-8 py-3.5 text-base font-semibold text-cream transition hover:border-cream/60 hover:bg-white/5"
            >
              For businesses sending to multiple people
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
