import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Memory Vault — SendForGood",
  description:
    "Create a Memory Vault for your wedding. Guests record video messages from their phone — no app, no account. Seal it for your anniversary.",
};

const STEPS = [
  {
    emoji: "\u{1F6D2}",
    title: "Buy video recordings",
    description:
      "$10 per recording. Buy as many as you have guests. Unused recordings never expire.",
  },
  {
    emoji: "\u{1F517}",
    title: "Create your vault",
    description:
      "Set your anniversary date as the seal date. Your vault locks automatically.",
  },
  {
    emoji: "\u{1F4F1}",
    title: "Share the link",
    description:
      "Send it to guests before or during the wedding. They record from any phone in seconds.",
  },
  {
    emoji: "\u{1F510}",
    title: "Watch together",
    description:
      "On your anniversary, your vault opens. Every message is waiting.",
  },
];

const USE_CASES = [
  {
    emoji: "\u{1F48D}",
    title: "Weddings",
    description:
      "The obvious one. 80 guests, 80 memories, sealed for a decade.",
  },
  {
    emoji: "\u{1F382}",
    title: "Milestone birthdays",
    description:
      "Turning 50? Let everyone record a message. Open it on your 60th.",
  },
  {
    emoji: "\u{1F393}",
    title: "Graduations",
    description:
      "Collect words of wisdom from the people who shaped you.",
  },
  {
    emoji: "\u{1F454}",
    title: "Retirement parties",
    description:
      "Let your team record their favorite memories of working with you.",
  },
  {
    emoji: "\u{1F476}",
    title: "Baby showers",
    description:
      "Collect video messages for the baby to watch when they turn 18.",
  },
];

const FAQS = [
  {
    q: "Do guests need an account?",
    a: "No. They tap the link, see a big record button, and speak. That is it.",
  },
  {
    q: "What if not all guests record?",
    a: "Unused credits stay in your account forever. Use them for your next milestone.",
  },
  {
    q: "Can we unseal the vault early?",
    a: "No. The vault is locked until the date you set. That is part of what makes it special.",
  },
  {
    q: "How long can each message be?",
    a: "Up to 5 minutes per recording.",
  },
  {
    q: "What if a guest does not have the link?",
    a: "You can share the link anytime before the vault seals \u2014 before, during, or after the event.",
  },
];

export default function WeddingPage() {
  return (
    <main className="bg-cream">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-cream to-cream-dark px-6 py-24 sm:py-32 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Memory Vault for Weddings
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl md:text-6xl">
            The wedding gift your guests will never forget giving.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Create a Memory Vault for your wedding. Share a link with every
            guest. They record a video message from their phone &mdash; no app,
            no account needed. Seal it for your 10th anniversary. Watch it
            together on the night that matters.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/messages/buy"
              className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
            >
              Create Your Wedding Vault
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream sm:w-auto"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Emotional Hook ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Imagine opening 80 video messages on your 10th anniversary.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Your grandmother at the reception, a little wobbly but smiling. Your
            college roommate doing a terrible impression of your first date
            story. Your dad trying not to cry. All of it, exactly as it happened
            &mdash; waiting for you.
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="bg-cream-dark px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How it works
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="text-4xl">{step.emoji}</span>
                <h3 className="mt-4 text-xl font-semibold text-navy">
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

      {/* ── Use Cases ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Not just for weddings
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-warm-gray">
            A Memory Vault works for any milestone worth remembering.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((uc, i) => (
              <div
                key={i}
                className="rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="text-4xl">{uc.emoji}</span>
                <h3 className="mt-4 text-xl font-semibold text-navy">
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

      {/* ── Pricing ── */}
      <section className="bg-cream-dark px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Simple pricing
          </h2>
          <div className="mx-auto mt-10 max-w-md rounded-2xl bg-white p-8 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-cream-dark/60 pb-3">
                <span className="font-semibold text-navy">Video credits</span>
                <span className="text-2xl font-extrabold tracking-tight text-navy">
                  $10<span className="text-sm font-normal text-warm-gray"> each</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cream-dark/60 pb-3">
                <span className="font-semibold text-navy">Audio credits</span>
                <span className="text-2xl font-extrabold tracking-tight text-navy">
                  $5<span className="text-sm font-normal text-warm-gray"> each</span>
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-warm-gray">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  Buy any quantity &mdash; no minimum
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  Unused credits never expire
                </li>
              </ul>
            </div>
            <Link
              href="/messages/buy"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Buy Credits &amp; Create Your Vault
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Questions &amp; answers
          </h2>
          <dl className="mt-12 space-y-8">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <dt className="text-lg font-semibold text-navy">{faq.q}</dt>
                <dd className="mt-2 leading-relaxed text-warm-gray">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Give your guests a reason to speak from the heart.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cream/70">
            Start your Wedding Memory Vault today. It takes two minutes.
          </p>
          <div className="mt-10">
            <Link
              href="/messages/buy"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Create Your Wedding Vault
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
