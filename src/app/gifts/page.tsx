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
          "A quality gift in the $15\u201320 range, selected based on the occasion",
      },
      {
        name: "Classic",
        suffix: "/yr",
        description:
          "A genuine gift in the $30\u201345 range, curated to their interests",
      },
      {
        name: "Premium",
        suffix: "/yr",
        description:
          "A higher value gift in the $55\u201375 range, matched to what they love",
      },
      {
        name: "Deluxe",
        suffix: "/yr",
        description:
          "A premium gift in the $90\u2013115 range, extra care taken in selection",
      },
      {
        name: "Legacy",
        suffix: "/yr",
        description:
          "Our best gift in the $150\u2013180 range \u2014 the most thoughtfully selected",
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
          "A quality gift in the $15\u201320 range, selected based on the occasion",
      },
      {
        name: "Classic",
        description:
          "A genuine gift in the $30\u201345 range, curated to their interests",
      },
      {
        name: "Premium",
        description:
          "A higher value gift in the $55\u201375 range, matched to what they love",
      },
      {
        name: "Deluxe",
        description:
          "A premium gift in the $90\u2013115 range, extra care taken in selection",
      },
      {
        name: "Legacy",
        description:
          "Our best gift in the $150\u2013180 range \u2014 the most thoughtfully selected",
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
          "A quality gift in the $15\u201320 range, selected based on the occasion",
      },
      {
        name: "Classic",
        description:
          "A genuine gift in the $30\u201345 range, curated to their interests",
      },
      {
        name: "Premium",
        description:
          "A higher value gift in the $55\u201375 range, matched to what they love",
      },
      {
        name: "Deluxe",
        description:
          "A premium gift in the $90\u2013115 range, extra care taken in selection",
      },
      {
        name: "Legacy",
        description:
          "Our best gift in the $150\u2013180 range \u2014 the most thoughtfully selected",
      },
    ],
  },
  {
    emoji: "\u{1F384}",
    title: "Holidays",
    intro: "Festive gifts that arrive right on time, every year.",
    tiers: [
      {
        name: "Starter",
        description:
          "A quality gift in the $15\u201320 range, selected based on the occasion",
      },
      {
        name: "Classic",
        description:
          "A genuine gift in the $30\u201345 range, curated to their interests",
      },
      {
        name: "Premium",
        description:
          "A higher value gift in the $55\u201375 range, matched to what they love",
      },
      {
        name: "Deluxe",
        description:
          "A premium gift in the $90\u2013115 range, extra care taken in selection",
      },
      {
        name: "Legacy",
        description:
          "Our best gift in the $150\u2013180 range \u2014 the most thoughtfully selected",
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
          "A quality gift in the $15\u201320 range, selected based on the occasion",
      },
      {
        name: "Classic",
        description:
          "A genuine gift in the $30\u201345 range, curated to their interests",
      },
      {
        name: "Premium",
        description:
          "A higher value gift in the $55\u201375 range, matched to what they love",
      },
      {
        name: "Deluxe",
        description:
          "A premium gift in the $90\u2013115 range, extra care taken in selection",
      },
      {
        name: "Legacy",
        description:
          "Our best gift in the $150\u2013180 range \u2014 the most thoughtfully selected",
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
          "A quality gift in the $15\u201320 range, selected based on the occasion",
      },
      {
        name: "Classic",
        description:
          "A genuine gift in the $30\u201345 range, curated to their interests",
      },
      {
        name: "Premium",
        description:
          "A higher value gift in the $55\u201375 range, matched to what they love",
      },
      {
        name: "Deluxe",
        description:
          "A premium gift in the $90\u2013115 range, extra care taken in selection",
      },
      {
        name: "Legacy",
        description:
          "Our best gift in the $150\u2013180 range \u2014 the most thoughtfully selected",
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
          "A quality gift in the $15\u201320 range, selected based on the occasion",
      },
      {
        name: "Classic",
        suffix: "/yr",
        description:
          "A genuine gift in the $30\u201345 range, curated to their interests",
      },
      {
        name: "Premium",
        suffix: "/yr",
        description:
          "A higher value gift in the $55\u201375 range, matched to what they love",
      },
      {
        name: "Deluxe",
        suffix: "/yr",
        description:
          "A premium gift in the $90\u2013115 range, extra care taken in selection",
      },
      {
        name: "Legacy",
        suffix: "/yr",
        description:
          "Our best gift in the $150\u2013180 range \u2014 the most thoughtfully selected",
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
            Thoughtfully Curated, Every Time
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
          These are gift examples only. We curate each gift individually based
          on what you tell us about your recipient. The actual gift may differ.
        </p>
      </div>

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
