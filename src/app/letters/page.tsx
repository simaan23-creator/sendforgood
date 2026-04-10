import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legacy Letters — SendForGood",
  description:
    "Write letters today that arrive in the future. Birthday letters every year, milestone letters for graduations, weddings, and more. Your words keep arriving — even after you're gone.",
};

const DELIVERY_TIERS = [
  {
    id: "digital",
    name: "Digital Letter",
    icon: "\u2709",
    price: 1,
    unit: "/yr per letter",
    description: "Delivered by email on the scheduled date. Instant, reliable, costs less.",
    features: [
      "Delivered via email on the scheduled date",
      "Beautiful, styled HTML letter with your words",
      "Instant delivery — no printing delays",
      "Annual or milestone letter types",
      "Keeps arriving for up to 25 years",
      "Continues even if something happens to you",
    ],
    cta: "Write a Digital Letter",
    href: "/letters/write?type=annual",
    popular: false,
  },
  {
    id: "physical",
    name: "Physical Letter",
    icon: "\uD83D\uDCEC",
    price: 10,
    unit: "/yr per letter",
    description: "Printed on quality paper and mailed to their address. A real keepsake they can hold.",
    features: [
      "Professionally printed on premium stationery",
      "Sealed and mailed directly to them via USPS",
      "Annual or milestone letter types",
      "A real keepsake they can hold onto",
      "Keeps arriving for up to 25 years",
      "Continues even if something happens to you",
    ],
    cta: "Write a Physical Letter",
    href: "/letters/write?type=annual",
    popular: false,
  },
  {
    id: "physical_photo",
    name: "Physical + Photo",
    icon: "\uD83D\uDCF7",
    price: 15,
    unit: "/yr per letter",
    description: "Everything in Physical, plus a wallet-sized photo printed and included in the envelope.",
    features: [
      "Everything in Physical Letter, plus:",
      "Upload any photo — printed wallet-sized",
      "Photo included in the envelope with your letter",
      "Annual or milestone letter types",
      "Keeps arriving for up to 25 years",
      "The most personal keepsake you can send",
    ],
    cta: "Write a Letter + Photo",
    href: "/letters/write?type=annual",
    popular: true,
  },
];

const USE_CASES = [
  {
    icon: "🎂",
    title: "Birthday Letters",
    description:
      "Write your child a letter for every birthday from age 5 to 25. Even if you're not there, your words will be.",
  },
  {
    icon: "🎓",
    title: "Graduation Day",
    description:
      "Write a letter to your grandchild for high school graduation — even if it's 15 years away.",
  },
  {
    icon: "💍",
    title: "Wedding Day",
    description:
      "A letter from a parent, waiting at the altar. Written years before, delivered at exactly the right moment.",
  },
  {
    icon: "👶",
    title: "First Child",
    description:
      "Welcome your future grandchild into the world with words you wrote before they were even born.",
  },
  {
    icon: "🏠",
    title: "First Home",
    description:
      "Congratulate them on a milestone you knew they'd reach — with a letter you wrote years ago.",
  },
  {
    icon: "🎖️",
    title: "Retirement",
    description:
      "A lifetime of work deserves a letter of pride. Write it now, deliver it when the day comes.",
  },
  {
    icon: "💸",
    title: "Anyone on a Budget",
    description:
      "At $1/year, there is no reason not to. Send a digital letter to everyone you love \u2014 children, grandchildren, friends, pets. Start today.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Write Your Letter",
    description:
      "Write from the heart. Tell them what you want them to know — on a birthday, a milestone, or just because.",
  },
  {
    step: 2,
    title: "Choose When It Arrives",
    description:
      "Pick a date — a birthday each year, or a specific milestone moment. We'll hold it safe until then.",
  },
  {
    step: 3,
    title: "We Deliver It",
    description:
      "Digital? We email it automatically on the scheduled date \u2014 no stamps, no waiting, no effort. Physical? We print it on premium stationery, seal it, and mail it directly to them.",
  },
  {
    step: 4,
    title: "It Keeps Arriving",
    description:
      "Even if something happens to you, your letters arrive as scheduled. Your executor is notified, and your words live on.",
  },
];

const FAQ = [
  {
    question: "What happens to my letters if something happens to me?",
    answer:
      "This is the entire purpose of Legacy Letters. All prepaid letters are stored securely and delivered on their scheduled dates regardless of your account status. When you purchase letters, you can designate an executor — a trusted person who will be notified and can manage your letter deliveries. Your words keep arriving.",
  },
  {
    question: "How are the letters delivered?",
    answer:
      "You choose your delivery type: Digital ($1/yr) — delivered by email on the scheduled date. Physical ($10/yr) — printed on premium stationery and mailed via USPS. Physical + Photo ($15/yr) — same as Physical, plus a wallet-sized photo included in the envelope. You can change the delivery type from your dashboard.",
  },
  {
    question: "Can I edit my letters after writing them?",
    answer:
      "Yes — you can edit any letter that hasn't been printed yet. Once a letter enters our print queue (about 2 weeks before its delivery date), it can no longer be modified. We'll send you a reminder before each letter is finalized.",
  },
  {
    question: "What's the difference between annual and milestone letters?",
    answer:
      "Annual letters are delivered once per year on a recurring date (like a birthday). You write one letter per year for as many years as you choose. Milestone letters are one-time deliveries timed to specific life events — graduation, wedding, first child, retirement, etc.",
  },
  {
    question: "Can I add a letter to an existing gift plan?",
    answer:
      "Absolutely! When creating a new gift plan, you'll see the option to add a letter for just $8/year on top of your gift tier. The letter ships alongside the gift each year.",
  },
  {
    question: "What if the recipient moves?",
    answer:
      "We reach out before every delivery to confirm the address is still current. You can update it anytime from your dashboard. If we are unable to reach you or your executor, we will attempt to verify the address on file and if necessary, try to locate a current address using the name and last known address on record. If we are still unable to deliver, your letter will be held securely on our servers — protected and waiting — until the intended recipient comes forward, verifies their identity, and claims it.",
  },
  {
    question: "Is there a maximum letter length?",
    answer:
      "Letters can be up to 5,000 characters (roughly 2 printed pages). We find that the most meaningful letters are often just one heartfelt page.",
  },
  {
    question: "Can I see a preview before it ships?",
    answer:
      "Yes. About 2 weeks before each letter is scheduled to ship, we'll send you (or your executor) a digital preview and a chance to make final edits.",
  },
];

export default function LettersPage() {
  return (
    <div className="bg-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Legacy Letters
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-navy sm:text-5xl md:text-6xl lg:text-7xl">
            Your words.{" "}
            <span className="text-gold">Delivered when it matters most.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Write letters to the people you love. Starting at just $1 per year.
            Choose email delivery for instant automation, or physical mail for a
            lasting keepsake.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/letters/write?type=annual"
              className="inline-flex items-center justify-center rounded-lg bg-navy px-8 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Write Your First Letter
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream"
            >
              How It Works
            </Link>
          </div>
          <p className="mt-6 text-sm text-warm-gray-light">
            From $1/year (digital) &middot; No subscriptions &middot;
            Delivered forever
          </p>
        </div>
      </section>

      {/* Emotional hook */}
      <section className="bg-navy px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-2xl font-bold leading-relaxed text-cream sm:text-3xl md:text-4xl">
            &ldquo;The most meaningful thing I ever received was a letter my
            father wrote before he passed. He wrote it ten years before I
            opened it.&rdquo;
          </p>
          <p className="mt-6 text-sm text-cream/60">
            This is the kind of moment Legacy Letters creates.
          </p>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              Choose How Your Letter Is Delivered
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              Three delivery options. Simple per-letter, per-year pricing.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {/* Digital */}
            <div className="relative flex flex-col rounded-2xl border border-cream-dark bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-3xl">📧</span>
              <h3 className="mt-3 text-xl font-bold text-navy">Digital</h3>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-navy">$1</span>
                <span className="text-sm text-warm-gray">/yr per letter</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Delivered by email", "Fully automated", "Instant and reliable", "Perfect for everyday letters"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-warm-gray">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/letters/write?type=annual"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Start at $1/year
              </Link>
            </div>

            {/* Physical */}
            <div className="relative flex flex-col rounded-2xl border border-cream-dark bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-3xl">✉️</span>
              <h3 className="mt-3 text-xl font-bold text-navy">Physical</h3>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-navy">$10</span>
                <span className="text-sm text-warm-gray">/yr per letter</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Printed and mailed", "Quality paper", "A real keepsake", "Perfect for meaningful moments"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-warm-gray">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/letters/write?type=annual"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Start at $10/year
              </Link>
            </div>

            {/* Physical + Photo */}
            <div className="relative flex flex-col rounded-2xl border-gold bg-white p-8 shadow-lg ring-2 ring-gold/30 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Most Popular
              </span>
              <span className="text-3xl">📸</span>
              <h3 className="mt-3 text-xl font-bold text-navy">Physical + Photo</h3>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-navy">$15</span>
                <span className="text-sm text-warm-gray">/yr per letter</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Letter + wallet photo", "Printed and mailed together", "Most personal option"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-warm-gray">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/letters/write?type=annual"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Start at $15/year
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              Who Writes Legacy Letters?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              Write now. Deliver later. Some letters are too important to leave
              unwritten.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="rounded-2xl border border-cream-dark bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-3xl">{uc.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-navy">
                  {uc.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-cream-dark px-6 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              How Legacy Letters Work
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              Four simple steps to make your words immortal.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-xl font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              Choose How Your Letter Is Delivered
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              Three delivery options. All per-letter, per-year pricing. Pay once
              &mdash; your letters are stored and delivered for as long as you
              need.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {DELIVERY_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl ${
                  tier.popular
                    ? "border-gold shadow-lg ring-2 ring-gold/30"
                    : "border-cream-dark shadow-md"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Most Popular
                  </span>
                )}
                <span className="text-3xl">{tier.icon}</span>
                <h3 className="mt-3 text-xl font-bold text-navy">{tier.name}</h3>
                <p className="mt-3">
                  <span className="text-4xl font-extrabold tracking-tight text-navy">
                    ${tier.price}
                  </span>
                  <span className="text-sm text-warm-gray">{tier.unit}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-warm-gray">
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
                  href={tier.href}
                  className={`mt-8 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.popular
                      ? "bg-gold text-navy shadow-sm hover:bg-gold-light focus-visible:outline-gold"
                      : "bg-navy text-cream shadow-sm hover:bg-navy-light focus-visible:outline-navy"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Add-on callout */}
          <div className="mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center sm:p-8">
            <p className="text-lg font-bold text-navy">
              Already sending a gift?{" "}
              <span className="text-gold">Add a letter for just $8/year</span>
            </p>
            <p className="mt-2 text-sm text-warm-gray">
              When you create a gift plan, add a personal letter that ships
              alongside each gift. The most meaningful $8 you&apos;ll ever
              spend.
            </p>
            <Link
              href="/send"
              className="mt-5 inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
            >
              Create a Gift Plan with Letters
            </Link>
          </div>
        </div>
      </section>

      {/* Voice Messages Cross-Sell */}
      <section className="bg-gradient-to-b from-cream to-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Want to send your voice instead?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Some things are better heard than read. Record a voice message and
            we deliver it alongside your letter, or on its own.
          </p>

          <div className="mt-10 mx-auto max-w-md">
            <article className="rounded-2xl border-gold bg-white p-8 text-center shadow-lg ring-2 ring-gold/30 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-5xl" role="img" aria-label="Voice Message">
                🎙️
              </span>
              <h3 className="mt-5 text-xl font-bold text-navy">
                Voice Message &mdash; $5/year
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Record your voice and we deliver it by email every year on the
                date you choose. Your actual voice, on the days that matter
                most. Even after you&apos;re gone.
              </p>
              <Link
                href="/voice/record"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3 text-base font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Record a Voice Message &rarr;
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Trust / Executor Section */}
      <section className="bg-navy px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Your Letters Are Safe. Forever.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/70">
            When you write a Legacy Letter, you can designate an executor
            &mdash; a trusted person (spouse, child, attorney) who is notified
            if your account becomes inactive. They can verify delivery
            addresses and ensure your letters arrive as planned.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Encrypted & Secure",
                desc: "Your letters are stored with bank-level encryption until their delivery date.",
              },
              {
                title: "Executor Notified",
                desc: "Your designated executor is contacted to confirm addresses and manage deliveries.",
              },
              {
                title: "Delivered On Time",
                desc: "Every letter arrives on its scheduled date, no matter what. That's our promise.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white/5 p-6">
                <h3 className="text-lg font-bold text-cream">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
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
      </section>

      {/* Bottom CTA */}
      <section className="bg-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Don&apos;t Leave Words Unwritten
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-warm-gray">
            The best time to write a letter is today. The best time for it to
            arrive might be years from now.
          </p>
          <Link
            href="/letters/write"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-forest px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Write Your First Letter &mdash; From $1/yr
          </Link>
          <p className="mt-10 text-sm text-warm-gray">
            Are you an executor? If the account holder has passed or is unable
            to manage their account, you can{" "}
            <Link
              href="/executor-access"
              className="font-semibold text-navy underline underline-offset-2 hover:text-gold"
            >
              request access here
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
