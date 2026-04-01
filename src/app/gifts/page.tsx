import Link from "next/link";
import type { Metadata } from "next";

/* ═══════════════════════════════════════════════════════════════════════════
   SEO Metadata
   ═══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Our Gifts | SendForGood",
  description:
    "See examples of the thoughtfully curated gifts we send for birthdays, graduations, anniversaries, holidays, and more — personalized for every recipient.",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Tier Badge Styles
   ═══════════════════════════════════════════════════════════════════════════ */

const TIER_STYLES: Record<string, string> = {
  Starter: "bg-warm-gray-light/20 text-warm-gray",
  Classic: "bg-forest/10 text-forest",
  Premium: "bg-gold/20 text-gold-dark",
  Deluxe: "bg-navy/10 text-navy",
  Legacy: "bg-gold-dark/20 text-gold-dark",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Occasion Data
   ═══════════════════════════════════════════════════════════════════════════ */

interface Tier {
  name: string;
  suffix?: string;
  description: string;
}

interface Occasion {
  emoji: string;
  title: string;
  intro: string;
  tiers: Tier[];
}

const OCCASIONS: Occasion[] = [
  {
    emoji: "\u{1F382}",
    title: "Birthdays",
    intro: "From quality gifts to premium selections \u2014 every birthday feels special.",
    tiers: [
      {
        name: "Starter",
        suffix: "/yr",
        description:
          "A fun birthday gift in the $15\u201320 range \u2014 think novelty items, treats, or something quirky and fun",
      },
      {
        name: "Classic",
        suffix: "/yr",
        description:
          "A genuine birthday gift in the $35\u201345 range \u2014 skincare sets, cool gadgets, games, or something they would actually use",
      },
      {
        name: "Premium",
        suffix: "/yr",
        description:
          "A higher value birthday gift in the $60\u201375 range \u2014 quality items matched to their hobbies and interests",
      },
      {
        name: "Deluxe",
        suffix: "/yr",
        description:
          "A premium birthday gift in the $100\u2013115 range \u2014 something they would never buy themselves but would love",
      },
      {
        name: "Legacy",
        suffix: "/yr",
        description:
          "Our best birthday gift \u2014 a high-end item in the $160\u2013180 range that makes them feel truly celebrated",
      },
    ],
  },
  {
    emoji: "\u{1F393}",
    title: "Graduation",
    intro: "Mark their milestone with something they will actually remember.",
    tiers: [
      {
        name: "Starter",
        description:
          "A fun graduation keepsake or treat in the $15\u201320 range \u2014 something to mark the milestone",
      },
      {
        name: "Classic",
        description:
          "A practical gift for their next chapter in the $35\u201345 range \u2014 quality notebook, coffee setup, or useful accessory",
      },
      {
        name: "Premium",
        description:
          "A standout graduation gift in the $60\u201375 range \u2014 something useful for their new life stage",
      },
      {
        name: "Deluxe",
        description:
          "A premium graduation gift in the $100\u2013115 range \u2014 tech, luggage, or something that sets them up for success",
      },
      {
        name: "Legacy",
        description:
          "Our best graduation gift \u2014 a high-end item in the $160\u2013180 range they will remember forever",
      },
    ],
  },
  {
    emoji: "\u{1F491}",
    title: "Anniversaries",
    intro: "Love that shows up, year after year.",
    tiers: [
      {
        name: "Starter",
        description:
          "A sweet anniversary treat in the $15\u201320 range \u2014 something romantic or sentimental",
      },
      {
        name: "Classic",
        description:
          "A thoughtful anniversary gift in the $35\u201345 range \u2014 candles, keepsakes, or something to enjoy together",
      },
      {
        name: "Premium",
        description:
          "A quality anniversary gift in the $60\u201375 range \u2014 experiences, premium home items, or something special for two",
      },
      {
        name: "Deluxe",
        description:
          "A premium anniversary gift in the $100\u2013115 range \u2014 jewelry, luxury items, or something truly memorable",
      },
      {
        name: "Legacy",
        description:
          "Our most romantic gift \u2014 a high-end item in the $160\u2013180 range that shows how much the relationship means",
      },
    ],
  },
  {
    emoji: "\u{1F384}",
    title: "Holidays",
    intro: "Festive gifts that arrive right on time, every year. ??",
    tiers: [
      {
        name: "Starter",
        description:
          "A festive holiday treat in the $15\u201320 range \u2014 seasonal goodies, fun ornaments, or cozy items",
      },
      {
        name: "Classic",
        description:
          "A quality holiday gift in the $35\u201345 range \u2014 cozy home items, gourmet treats, or something seasonal and special",
      },
      {
        name: "Premium",
        description:
          "A premium holiday gift in the $60\u201375 range \u2014 a curated set of items they will genuinely enjoy",
      },
      {
        name: "Deluxe",
        description:
          "A luxurious holiday gift in the $100\u2013115 range \u2014 something indulgent and high quality",
      },
      {
        name: "Legacy",
        description:
          "Our finest holiday gift \u2014 a high-end item in the $160\u2013180 range that makes the season unforgettable",
      },
    ],
  },
  {
    emoji: "\u{1F3E2}",
    title: "Business & Corporate",
    intro: "Keep clients and employees feeling valued \u2014 automatically.",
    tiers: [
      {
        name: "Starter",
        description:
          "A professional gift in the $15\u201320 range \u2014 something tasteful and appropriate for any client",
      },
      {
        name: "Classic",
        description:
          "A quality client gift in the $35\u201345 range \u2014 premium desk items, food gifts, or useful accessories",
      },
      {
        name: "Premium",
        description:
          "A standout client gift in the $60\u201375 range \u2014 something that gets noticed and remembered",
      },
      {
        name: "Deluxe",
        description:
          "A premium client gift in the $100\u2013115 range \u2014 high-end and impressive, builds real loyalty",
      },
      {
        name: "Legacy",
        description:
          "Our best corporate gift \u2014 a luxury item in the $160\u2013180 range that turns clients into advocates",
      },
    ],
  },
  {
    emoji: "\u{1F381}",
    title: "Just Because",
    intro: "Sometimes the best gifts have no reason at all.",
    tiers: [
      {
        name: "Starter",
        description:
          "A fun surprise in the $15\u201320 range \u2014 something that says I was thinking of you",
      },
      {
        name: "Classic",
        description:
          "A genuine just because gift in the $35\u201345 range \u2014 something they would enjoy but never buy themselves",
      },
      {
        name: "Premium",
        description:
          "A quality surprise gift in the $60\u201375 range \u2014 matched to what they love",
      },
      {
        name: "Deluxe",
        description:
          "A premium just because gift in the $100\u2013115 range \u2014 the kind that makes people cry happy tears",
      },
      {
        name: "Legacy",
        description:
          "Our most thoughtful surprise \u2014 a high-end item in the $160\u2013180 range that shows you really know them",
      },
    ],
  },
  {
    emoji: "\uD83D\uDC3E",
    title: "For Your Pets",
    intro: "Because the animals in our lives deserve to be celebrated too.",
    tiers: [
      {
        name: "Starter",
        suffix: "/yr",
        description:
          "A fun pet treat or toy in the $15\u201320 range \u2014 something your pet will go crazy for",
      },
      {
        name: "Classic",
        suffix: "/yr",
        description:
          "A quality pet gift in the $35\u201345 range \u2014 premium treats, a durable toy, or a cozy accessory",
      },
      {
        name: "Premium",
        suffix: "/yr",
        description:
          "A premium pet gift in the $60\u201375 range \u2014 breed-appropriate toys, gourmet treats, or a nice accessory",
      },
      {
        name: "Deluxe",
        suffix: "/yr",
        description:
          "A luxury pet gift in the $100\u2013115 range \u2014 something spoil-worthy for your furry family member",
      },
      {
        name: "Legacy",
        suffix: "/yr",
        description:
          "Our finest pet gift \u2014 a high-end item in the $160\u2013180 range for the pet who has everything",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Occasion Section Component
   ═══════════════════════════════════════════════════════════════════════════ */

function OccasionSection({ occasion }: { occasion: Occasion }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">
          <span className="mr-3">{occasion.emoji}</span>
          {occasion.title}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-warm-gray sm:text-lg">
          {occasion.intro}
        </p>
      </div>

      <div className="space-y-4">
        {occasion.tiers.map((tier) => (
          <div
            key={tier.name}
            className="flex flex-col gap-3 rounded-xl border border-cream-dark/60 bg-white p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
          >
            <span
              className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES[tier.name]}`}
            >
              {tier.name}
              {tier.suffix && (
                <span className="ml-1 text-[10px] font-normal opacity-70">
                  {tier.suffix}
                </span>
              )}
            </span>
            <span className="hidden text-warm-gray-light sm:inline">&mdash;</span>
            <p className="text-sm leading-relaxed text-warm-gray sm:text-base">
              {tier.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function OurGiftsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-white">
      {/* ─────────────────────────── Hero Section ─────────────────────────── */}
      <section className="bg-gradient-to-b from-cream to-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            What Kinds of Gifts Do We Send?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Every gift is selected based on your recipient&rsquo;s interests,
            age, and occasion, then shipped directly to their door. Below are
            examples of what we send &mdash; your recipient&rsquo;s actual gift
            will be uniquely chosen just for them.
          </p>
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-1.5 text-sm font-medium text-gold-dark">
            &#10024; No two gifts are exactly alike
          </span>
        </div>
      </section>

      {/* ─────────────────────── Disclaimer Banner ────────────────────────── */}
      <div className="bg-gold/15 px-6 py-4">
        <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-gold-dark sm:text-base">
          These are examples of actual products we send. Your recipient will
          receive something similar based on their interests. Exact items vary.
        </p>
      </div>

      {/* ─────────────────────── Sample Products by Tier ──────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Sample Products by Tier
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Starter */}
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES.Starter}`}>Starter</span>
            <p className="mt-2 text-lg font-bold text-navy">$20<span className="text-sm font-normal text-warm-gray">/yr</span></p>
            <ul className="mt-4 space-y-2 text-sm text-warm-gray">
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Premium scented candle</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Fun card game or puzzle</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Cozy novelty socks set</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Cool desk toy or gadget</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Artisan chocolate box</li>
            </ul>
          </div>

          {/* Classic */}
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES.Classic}`}>Classic</span>
            <p className="mt-2 text-lg font-bold text-navy">$45<span className="text-sm font-normal text-warm-gray">/yr</span></p>
            <ul className="mt-4 space-y-2 text-sm text-warm-gray">
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Quality skincare or grooming set</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Great book + leather bookmark</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Unique kitchen gadget</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Premium tea or coffee set</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Cozy throw blanket</li>
            </ul>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border border-gold bg-white p-6 shadow-md ring-2 ring-gold/30">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES.Premium}`}>Premium</span>
            <p className="mt-2 text-lg font-bold text-navy">$80<span className="text-sm font-normal text-warm-gray">/yr</span></p>
            <ul className="mt-4 space-y-2 text-sm text-warm-gray">
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Spa or self-care gift set</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Nice leather wallet or accessory</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Premium board game</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Quality tech accessory</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Gourmet food hamper</li>
            </ul>
          </div>

          {/* Deluxe */}
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES.Deluxe}`}>Deluxe</span>
            <p className="mt-2 text-lg font-bold text-navy">$125<span className="text-sm font-normal text-warm-gray">/yr</span></p>
            <ul className="mt-4 space-y-2 text-sm text-warm-gray">
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Wireless earbuds or headphones</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Premium smartwatch or fitness tracker</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>High-end skincare collection</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Designer fragrance</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Luxury home item</li>
            </ul>
          </div>

          {/* Legacy */}
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES.Legacy}`}>Legacy</span>
            <p className="mt-2 text-lg font-bold text-navy">$200<span className="text-sm font-normal text-warm-gray">/yr</span></p>
            <ul className="mt-4 space-y-2 text-sm text-warm-gray">
              <li className="flex items-start gap-2"><span className="text-forest">•</span>High-end tech gadget</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Premium experience gift card</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Designer accessory</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>Luxury fragrance or skincare</li>
              <li className="flex items-start gap-2"><span className="text-forest">•</span>High-end kitchen or home item</li>
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-warm-gray-light">
          These are representative examples. Your actual gift is personally
          selected based on what you tell us about your recipient.
        </p>
      </section>

      {/* ─────────────────────── Occasion Sections ────────────────────────── */}
      <div className="mx-auto max-w-4xl px-6">
        {OCCASIONS.map((occasion, i) => (
          <div key={occasion.title}>
            <OccasionSection occasion={occasion} />
            {i < OCCASIONS.length - 1 && (
              <hr className="border-cream-dark/60" />
            )}
          </div>
        ))}
      </div>

      {/* ─────────────────────── Bottom CTA Section ───────────────────────── */}
      <section className="bg-navy px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Ready to start sending?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cream/80">
            Tell us about your recipient and we&rsquo;ll handle everything from
            there.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/send"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-10 py-4 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Start Sending
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
