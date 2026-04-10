import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Start Sending - SendForGood",
  description:
    "Choose how you want to show love - send annual gifts, write heartfelt letters, or both. Set it up once, we handle the rest.",
};

const CARDS = [
  {
    emoji: "🎁",
    title: "Send a Gift",
    subtitle: "From $20/year",
    description:
      "Annual gifts delivered to anyone you love - birthdays, holidays, anniversaries, pets, and more. Set it up once, we handle the rest every year.",
    features: ["All occasions", "5 tiers from $20-$200/yr", "Up to 25 years"],
    cta: "Choose a Gift",
    href: "/send",
    borderColor: "border-navy",
    ctaBg: "bg-navy hover:bg-navy-light",
    badge: null,
  },
  {
    emoji: "✉️",
    title: "Write a Letter",
    subtitle: "From $1/year",
    description:
      "Write letters to the people you love. Delivered by email, or printed and mailed. Annual or milestone letters stored safely until the moment is right.",
    features: [
      "Digital from $1/yr",
      "Physical from $10/yr",
      "With photo from $15/yr",
    ],
    cta: "Write a Letter",
    href: "/letters/write",
    borderColor: "border-gold",
    ctaBg: "bg-gold hover:bg-gold-dark",
    badge: "New",
  },
  {
    emoji: "🎁✉️",
    title: "Gifts + Letters",
    subtitle: "Best value",
    description:
      "The complete experience. Send annual gifts AND write heartfelt letters - both delivered automatically, every year. Add them to your cart together.",
    features: [
      "One checkout",
      "Gifts and letters combined",
      "Most meaningful option",
    ],
    cta: "Start with Gifts",
    href: "/send",
    borderColor: "border-forest",
    ctaBg: "bg-forest hover:bg-forest-light",
    badge: "Most Popular",
  },
  {
    emoji: "\uD83C\uDF99\uFE0F",
    title: "Record a Voice Message",
    subtitle: "$5/year",
    description:
      "Record your voice and we deliver it by email every year. Your actual voice — on their birthday, a milestone, or any day that matters. Even after you are gone.",
    features: [
      "Record in your browser",
      "Annual or milestone delivery",
      "Stored securely forever",
    ],
    cta: "Record a Message",
    href: "/voice/record",
    borderColor: "border-navy/40",
    ctaBg: "bg-navy/80 hover:bg-navy",
    badge: "New",
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
            Choose one or mix and match - you can always add more later.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
