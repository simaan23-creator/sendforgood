import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — SealTheDay Wedding Vault",
  description:
    "$10 one-time vault fee. $1 per video slot, $0.25 per photo slot. Buy any quantity. Slots never expire.",
};

const FAQ = [
  {
    question: "How does pricing work?",
    answer:
      "It is purely \u00e0 la carte. Pay $10 once to create your vault, then buy as many recording slots as you want \u2014 $1 per video, $0.25 per photo. No minimum. No subscription. Unused slots never expire.",
  },
  {
    question: "How many video slots do most weddings buy?",
    answer:
      "Most couples buy 30 to 50 video slots \u2014 roughly one per guest who is likely to record. If you run out, you can top up the same vault at any time without paying the $10 fee again.",
  },
  {
    question: "What is the seal date?",
    answer:
      "When you create the vault, you choose when it unlocks \u2014 the morning after your wedding, your 1st anniversary, your 10th, or any date you pick. Until then, even you cannot view what your guests have submitted. It is a real time capsule.",
  },
  {
    question: "Do my guests need to download anything?",
    answer:
      "No. Guests tap your link or scan your QR code, record straight from the browser on their phone, and upload. No app, no account.",
  },
  {
    question: "How long can each recording be?",
    answer:
      "Video recordings are capped at 3 minutes each. Photos are uploaded at full resolution.",
  },
  {
    question: "What if I add more slots later?",
    answer:
      "Open your dashboard, choose the vault you want to top up, and buy more slots. No new $10 vault fee \u2014 that is only charged when you create a brand new vault.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "We refund the $10 vault fee in full within 48 hours of purchase as long as no guests have submitted to your vault. Unused recording slots can be refunded any time before the vault is sealed. Contact support@sealtheday.com.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const ITEMS = [
  {
    emoji: "\uD83D\uDD12",
    label: "Vault",
    price: "$10",
    unit: "one-time",
    desc: "Pay once to create a vault. Choose your seal date. Share the link with guests.",
    featured: false,
  },
  {
    emoji: "\uD83C\uDFA5",
    label: "Video Slot",
    price: "$1",
    unit: "per slot",
    desc: "Guests record up to 3 minutes of video from their phone browser.",
    featured: true,
  },
  {
    emoji: "\uD83D\uDCF7",
    label: "Photo Slot",
    price: "$0.25",
    unit: "per slot",
    desc: "Guests upload a full-resolution photo straight to your vault.",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl bg-cream px-6 py-4 text-sm font-medium text-navy">
          <span>{"\u2713"} Slots never expire</span>
          <span>{"\u2713"} No subscription</span>
          <span>{"\u2713"} 48-hour refund on unused slots</span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            {"\u00C0"} la carte. Built for one day.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Pay $10 once to open your vault. Add only the recording slots you
            need. Most couples buy 30&ndash;50 video slots.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <article
              key={item.label}
              className={`relative flex flex-col rounded-2xl border bg-white p-7 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl ${
                item.featured
                  ? "border-gold ring-2 ring-gold/30"
                  : "border-cream-dark"
              }`}
            >
              {item.featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Recommended
                </span>
              )}
              <span className="text-4xl">{item.emoji}</span>
              <h3 className="mt-3 text-lg font-bold text-navy">{item.label}</h3>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight">
                  {item.price}
                </span>
                <span className="text-sm text-warm-gray"> {item.unit}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                {item.desc}
              </p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-cream-dark bg-cream/40 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Example bundle
          </p>
          <p className="mt-2 text-navy">
            $10 vault + 40 video slots + 20 photo slots
          </p>
          <p className="mt-1 text-3xl font-bold text-navy">$55</p>
          <p className="mt-1 text-sm text-warm-gray">For a 150-guest wedding</p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/vault/buy"
            className="inline-flex items-center justify-center rounded-lg bg-gold px-10 py-4 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light"
          >
            Create Your Wedding Vault
          </Link>
        </div>

        {/* Anniversary Capsule sampler */}
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border-2 border-gold bg-white p-8 text-center shadow-md">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Sampler
          </p>
          <h3 className="mt-2 text-2xl font-bold text-navy">
            The Anniversary Capsule
          </h3>
          <p className="mt-2 text-sm text-warm-gray">
            The gift you open together on your first anniversary. 1 vault, 6 videos,
            15 photos &mdash; sealed for up to 1 year.
          </p>
          <p className="mt-4 text-3xl font-extrabold text-navy">$29.95</p>
          <Link
            href="/vault/buy?bundle=anniversary"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3 text-base font-bold text-cream shadow-md transition hover:bg-navy/90"
          >
            Get the Anniversary Capsule
          </Link>
        </div>

        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <dl className="mt-10 space-y-8">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="text-lg font-semibold text-navy">
                  {item.question}
                </dt>
                <dd className="mt-2 leading-relaxed text-warm-gray">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
