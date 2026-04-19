import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Start Sending - SendForGood",
  description:
    "Choose how you want to show love — send gifts, write heartfelt letters, record voice or video messages. Assign recipients from your dashboard whenever you are ready.",
};

const CARDS = [
  {
    emoji: "🎁",
    title: "Send Gifts",
    subtitle: "From $20 per gift",
    description:
      "Buy gifts by tier. Assign recipients, dates, and preferences from your dashboard whenever you are ready. Never expire.",
    features: ["5 tiers from $20\u2013$200", "Assign recipients anytime", "Never expire"],
    cta: "Send a Gift",
    href: "/gifts/buy",
    borderColor: "border-navy",
    ctaBg: "bg-navy hover:bg-navy-light",
    badge: null,
  },
  {
    emoji: "\u2709\uFE0F",
    title: "Messages",
    subtitle: "From $1 per letter",
    description:
      "Send written letters, voice messages, or video messages. Digital or physical. Your words, delivered forever.",
    features: [
      "Letters from $1",
      "Audio $5, Video $10",
      "Never expire",
    ],
    cta: "Send a Message",
    href: "/messages/buy",
    borderColor: "border-gold",
    ctaBg: "bg-gold hover:bg-gold-dark",
    badge: null,
  },
] as const;

export default function StartPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy">
            What would you like to send?
          </h1>
          <p className="mt-3 text-lg text-navy/60">
            Choose one or mix and match &mdash; you can always add more later.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className={`relative flex flex-col rounded-2xl border-2 ${card.borderColor} bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md`}
            >
              {/* Badge */}
              {card.badge && (
                <span
                  className={`absolute -top-3 right-4 inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white ${
                    card.badge === "Most Popular" ? "bg-forest" : "bg-gold"
                  }`}
                >
                  {card.badge}
                </span>
              )}

              {/* Emoji + Title */}
              <div className="mb-4">
                <span className="text-3xl">{card.emoji}</span>
                <h2 className="mt-2 text-xl font-bold text-navy">
                  {card.title}
                </h2>
                <p className="text-sm font-semibold text-navy/50">
                  {card.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-navy/70 leading-relaxed mb-5">
                {card.description}
              </p>

              {/* Features */}
              <ul className="mb-6 space-y-2 flex-1">
                {card.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-navy/80"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={card.href}
                className={`block w-full rounded-lg ${card.ctaBg} px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors duration-150`}
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
