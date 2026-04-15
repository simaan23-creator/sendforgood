import { Metadata } from "next";
import Link from "next/link";
import { TIERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing — SendForGood",
  description:
    "Explore SendForGood gift tiers from $20 to $200. Buy gifts, assign recipients from your dashboard — every tier includes gift curation, wrapping, and delivery.",
};

const FAQ = [
  {
    question: "How do gifts work?",
    answer:
      "Choose a gift tier \u2014 from Starter ($20) to Legacy ($200). Your gifts are managed in your dashboard. When you are ready, assign a recipient, occasion, and date to each gift. We handle gift selection, wrapping, and delivery. No subscriptions, no renewals. Your gifts never expire.",
  },
  {
    question: "How do messages work?",
    answer:
      "Buy digital digital letters ($1), physical letters ($10), letter + photo ($15), audio messages ($5), or video messages ($10). Write your letters and record your messages from your dashboard. Set delivery dates or milestones \u2014 your words arrive on schedule. Your gifts never expire.",
  },
  {
    question: "Can I assign the same gift to multiple years?",
    answer:
      "Each gift covers one delivery. If you want to send a gift every year for 5 years, buy 5 gifts. You can assign them all to the same person with different dates.",
  },
  {
    question: "What is the Memory Vault?",
    answer:
      "The Memory Vault lets you collect audio and video messages from others. Share a link, share a link, and people record for you. You can seal the vault until a future date \u2014 like a 10th anniversary or a birthday milestone. Perfect for group gifts and time capsules.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Physical gifts and letters are delivered within the continental United States only. Digital letters, audio messages, and video messages are delivered worldwide by email.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "We offer a full refund within 48 hours of purchase, as long as no gifts have been sent. Once a gift is sent, it is non-refundable. Contact us at support@sendforgood.com or text (631) 707-4968.",
  },
  {
    question: "Will the recipient know it was automated?",
    answer:
      "No. There is no SendForGood branding on anything we deliver. Gifts ship from our fulfillment partners with a card featuring your name and personal message. Letters and recordings arrive from you \u2014 not from us.",
  },
  {
    question: "Can I send gifts to pets?",
    answer:
      "Absolutely! We love celebrating the furry, feathered, and finned members of the family. Select Pet Birthday or Pet Gotcha Day as your occasion type and we will select age and breed-appropriate treats and toys every year.",
  },
  {
    question: "Will you contact me before each delivery?",
    answer:
      "Yes \u2014 about 2 weeks before each scheduled delivery, we will reach out by email (and text if you have added your number) to confirm your delivery details are still correct. If your address has changed or you want to update the gift preferences, just reply to our message and we will take care of it. If we do not hear back within 3 days, we will proceed as originally planned.",
  },
];

export default function PricingPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Trust Bar */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl bg-cream px-6 py-4 text-sm font-medium text-navy">
          <span>✓ 48-hour money-back guarantee</span>
          <span>✓ No subscriptions ever</span>
          <span>✓ Ships directly to recipient</span>
          <span>✓ AI-powered gift selection</span>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray leading-relaxed">
            Choose a gift tier. Assign recipients from your dashboard
            whenever you are ready. Every gift includes gift selection, a
            personal message card, and delivery.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                <p className="mt-1 text-center text-xs text-warm-gray-light">
                  Just {(tier.price / 12).toFixed(2)} per month
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

                <Link
                  href="/gifts/buy"
                  className={`mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isPopular
                      ? "bg-gold text-navy hover:bg-gold-light focus-visible:outline-gold shadow-sm"
                      : "bg-navy text-cream hover:bg-navy-light focus-visible:outline-navy shadow-sm"
                  }`}
                >
                  Buy Gift Credits
                </Link>
              </article>
            );
          })}
        </div>

        {/* Messages — Letters, Voice & Video */}
        <div className="mx-auto mt-24 max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            Messages
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg leading-relaxed text-warm-gray">
            Send your words in any format. Written letters, voice messages, or video messages — delivered on your schedule, forever.
          </p>

          {/* Letters */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Digital Letter", price: "$1", desc: "Delivered by email. Fully automated." },
              { label: "Physical Letter", price: "$10", desc: "Printed and mailed to the recipient." },
              { label: "Letter + Photo", price: "$15", desc: "Printed letter + wallet-sized photo mailed together." },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-cream-dark bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-warm-gray">{item.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-navy">{item.price}<span className="text-base font-normal text-warm-gray">/letter</span></p>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-10 text-center text-lg font-semibold text-navy">Audio & Video</h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-warm-gray">
            Record your voice or face and we deliver it by email on the scheduled date. Stored securely forever.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-cream-dark bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-5xl" role="img" aria-label="Audio Message">
                🎙️
              </span>
              <h3 className="mt-4 text-xl font-bold text-navy">
                Audio Message
              </h3>
              <p className="mt-2">
                <span className="text-4xl font-extrabold tracking-tight text-navy">$5</span>
                <span className="text-sm text-warm-gray">/yr</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                Your voice, delivered by email. Up to 5 minutes per message.
              </p>
              <Link
                href="/voice/record"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light"
              >
                Record Audio
              </Link>
            </div>

            <div className="relative rounded-2xl border-gold bg-cream p-8 text-center shadow-lg ring-2 ring-gold/30 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                NEW
              </span>
              <span className="text-5xl" role="img" aria-label="Video Message">
                🎬
              </span>
              <h3 className="mt-4 text-xl font-bold text-navy">
                Video Message
              </h3>
              <p className="mt-2">
                <span className="text-4xl font-extrabold tracking-tight text-navy">$10</span>
                <span className="text-sm text-warm-gray">/yr</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                Your face and voice together. The most powerful legacy you can leave.
              </p>
              <Link
                href="/voice/record"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-8 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-light"
              >
                Record Video
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
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

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-warm-gray">
            Not sure which tier is right? Start with any tier &mdash; you can
            always buy more later.
          </p>
          <Link
            href="/gifts/buy"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-forest px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Send a Gift &mdash; From $20
          </Link>
        </div>
      </div>
    </section>
  );
}
