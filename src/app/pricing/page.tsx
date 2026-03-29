import { Metadata } from "next";
import Link from "next/link";
import { TIERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing — SendForGood",
  description:
    "Explore SendForGood gift tiers from $29/yr to $199/yr. Prepay for years of joy — every tier includes gift curation, wrapping, and delivery.",
};

const FAQ = [
  {
    question: "How does prepay work?",
    answer:
      "When you create a gift plan, you pay upfront for the number of years you choose. For example, if you select the Premium tier ($80/yr) for 5 years, your one-time payment is $400. We then curate and deliver a gift on the scheduled occasion every year for the next 5 years — no subscriptions, no renewals, no surprises on your credit card.",
  },
  {
    question: "What if I want to cancel?",
    answer:
      "You may request a full refund within 48 hours of purchase, as long as no gifts have shipped. After that, since gifts are prepaid and our team begins curation early, refunds for already-shipped years aren't available. For multi-year plans with remaining deliveries, please contact us and we'll work with you on a case-by-case basis.",
  },
  {
    question: "What happens to my gifts if something happens to me?",
    answer:
      "This is the heart of SendForGood. All prepaid gift plans are fulfilled in their entirety regardless of your account status. If your account becomes inactive, your scheduled gifts will continue to arrive as promised. A family member or legal representative can also contact us to manage remaining deliveries. Your love keeps arriving.",
  },
  {
    question: "Will the recipient know the gift was sent through SendForGood?",
    answer:
      "They will never see SendForGood branding on anything. For our Starter, Deluxe, and Legacy tiers, gifts are packed and shipped by us personally \u2014 no retailer packaging. For Classic and Premium tiers, gifts ship directly from the retailer, so the box may have retailer branding. Either way, the card is signed with your name and your message, and they will never know it was set up in advance.",
  },
  {
    question: "Can I send gifts to pets?",
    answer:
      "Absolutely! We love celebrating the furry, feathered, and finned members of the family. Select Pet Birthday or Pet Gotcha Day as your occasion type and we will curate age and breed-appropriate treats and toys every year.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "We offer a full refund within 48 hours of purchase, as long as no gifts have been shipped yet. Once a gift has been sent, that year is non-refundable, but we can cancel future years for a prorated refund. Contact us at support@sendforgood.com or text (631) 707-4968.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "At this time we only deliver within the continental United States. We do not ship to Alaska, Hawaii, US territories, or international addresses. We hope to expand in the future!",
  },
];

export default function PricingPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray leading-relaxed">
            Choose a tier, pick how many years, and pay once. Every plan
            includes gift curation, wrapping, a personal message, and delivery.
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
                  href="/send"
                  className={`mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isPopular
                      ? "bg-gold text-navy hover:bg-gold-light focus-visible:outline-gold shadow-sm"
                      : "bg-navy text-cream hover:bg-navy-light focus-visible:outline-navy shadow-sm"
                  }`}
                >
                  Get Started
                </Link>
              </article>
            );
          })}
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
            Not sure which tier is right? Start with any plan &mdash; you can
            always upgrade later.
          </p>
          <Link
            href="/send"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-forest px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Start Sending Today
          </Link>
        </div>
      </div>
    </section>
  );
}
