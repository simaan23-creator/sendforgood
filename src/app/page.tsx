"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ─────────────────────────────── Data ─────────────────────────────── */

const USE_CASES = [
  {
    emoji: "🧓",
    label: "Grandparents",
    headline: "Never miss a birthday again",
    description:
      "Set up gifts for all your grandkids at once. They\u2019ll feel your love every year, no matter what.",
    quote:
      "I set it up once for all 6 grandkids. Now I never have to worry about forgetting.",
  },
  {
    emoji: "🎁",
    label: "Treat Yourself",
    headline: "The gift you never buy yourself — delivered every year",
    description:
      "Set up a birthday or holiday gift for YOU. Something you actually want, picked by our AI, arriving every year without you lifting a finger.",
    quote:
      "I bought it for myself on my birthday after a long week. Best decision ever. It shows up every year and I genuinely forget until it arrives.",
  },
  {
    emoji: "🏠",
    label: "Realtors",
    headline: "Turn one sale into a lifetime relationship",
    description:
      "Send your clients a gift every year on their home anniversary. The referrals will follow.",
    quote:
      "My clients call ME when their friends are buying. This is why.",
  },
  {
    emoji: "💑",
    label: "Couples",
    headline: "Love that shows up, every year",
    description:
      "Prepay for anniversary gifts years in advance. Even when life gets busy, your partner feels remembered.",
    quote:
      "I set up years of anniversary gifts. It arrives every year without me doing a thing.",
  },
  {
    emoji: "🏢",
    label: "Businesses",
    headline: "Client retention, automated",
    description:
      "Birthdays, work anniversaries, holidays \u2014 keep your best clients feeling valued all year long.",
    quote:
      "Our client churn dropped 30% after we started SendForGood. People don\u2019t leave companies that remember them.",
  },
  {
    emoji: "👨‍👩‍👧",
    label: "Parents",
    headline: "A gift from you, even when you can\u2019t be there",
    description:
      "Set up birthday gifts for your kids \u2014 up to 25 years at a time. We handle everything, every year.",
    quote:
      "I set up years of birthday gifts for my daughter in one sitting. Done.",
  },
  {
    emoji: "🕯️",
    label: "Legacy Gifting",
    headline: "Your love outlives everything",
    description:
      "The most meaningful gift you can give is one that keeps coming. Even if something happens to you, they still receive your love.",
    quote:
      "My dad set this up before he passed. We still get a gift from him every Christmas.",
  },
  {
    emoji: "🐾",
    label: "Pet Parents",
    headline: "Because fur babies deserve birthdays too",
    description:
      "Send annual treats, toys, and surprises for the pets you love. They may not know what day it is, but you do.",
    quote:
      "My dog gets a birthday box every year. The look on his face when it arrives never gets old.",
  },
  {
    emoji: "\u2709\uFE0F",
    label: "Legacy Letters",
    headline: "Say what you have always meant to say",
    description:
      "Write letters to the people you love. Digital delivery starts at just $1/year \u2014 or choose physical mail for a lasting keepsake.",
    quote:
      "My grandfather wrote me a letter for my wedding day before he passed. I did not know it existed until the envelope arrived. It was the greatest gift I have ever received.",
  },
  {
    emoji: "\uD83D\uDCB2",
    label: "Starting at $1/Year",
    headline: "The most affordable legacy you can leave",
    description:
      "Digital letters delivered automatically by email. Write once, we send it every year on their birthday, anniversary, or any day you choose. Starting at just $1 per year.",
    quote:
      "I set up digital letters for all 6 grandkids for their birthdays. $6 a year total. Best money I ever spent.",
  },
];

const BUSINESS_CARDS = [
  {
    emoji: "🏠",
    title: "Real Estate",
    description: "Home anniversary gifts that keep you top of mind",
  },
  {
    emoji: "🏢",
    title: "Corporate",
    description: "Employee birthdays and work anniversaries, automated",
  },
  {
    emoji: "💰",
    title: "Financial Services",
    description: "Client milestone gifts that build lifelong loyalty",
  },
  {
    emoji: "🛍️",
    title: "Small Business",
    description: "VIP customer gifts that turn buyers into superfans",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I set this up for all 6 grandkids at once. Every birthday, a gift shows up at their door. I did it once and have not thought about it since.",
    author: "Sandra M.",
    role: "Grandmother",
  },
  {
    quote:
      "My clients get a gift on their home anniversary every year. The referrals I get from it are worth 10 times what I spend.",
    author: "James T.",
    role: "Realtor",
  },
  {
    quote:
      "My dog Holly gets a birthday gift every year automatically. Best money I ever spent.",
    author: "Maria L.",
    role: "Pet Owner",
  },
];

/* ─────────────────────────────── Page ─────────────────────────────── */

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % USE_CASES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <main>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-cream to-cream-dark px-6 py-24 sm:py-32 md:py-40">
        {/* Decorative ribbon SVGs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* Top-right ribbon */}
          <svg
            className="absolute -top-10 right-0 h-72 w-72 text-gold/10 sm:h-96 sm:w-96"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path
              d="M120 20c30 15 60 50 60 90s-20 60-50 70-70-10-80-50 10-80 40-100 30-10 30-10z"
              fill="currentColor"
            />
          </svg>
          {/* Bottom-left ribbon */}
          <svg
            className="absolute -bottom-16 -left-10 h-64 w-64 text-gold/8 sm:h-80 sm:w-80"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path
              d="M40 160c-20-30-10-80 20-110s80-30 100-5 0 70-30 95-60 30-90 20z"
              fill="currentColor"
            />
          </svg>
          {/* Center-right small accent */}
          <svg
            className="absolute right-1/4 top-1/3 h-32 w-32 text-gold/5"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="45" fill="currentColor" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl md:text-6xl lg:text-7xl">
            Send a gift once.
            <br />
            <span className="text-gold">Deliver joy forever.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Whether you&rsquo;re a grandparent, a realtor, or a business &mdash;
            SendForGood handles the gifting so you never miss a moment that
            matters.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-navy/60 sm:text-lg italic">
            Now introducing Legacy Letters &mdash; words that outlast a lifetime.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/send"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
            >
              Send Your First Gift &mdash; From $20
            </Link>
            <Link
              href="/letters/write"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
            >
              Send Your First Letter &mdash; From $1
            </Link>
          </div>

          {/* For Businesses — centered below */}
          <div className="mt-4 flex justify-center">
            <a
              href="#for-businesses"
              className="inline-flex items-center justify-center rounded-lg border-2 border-navy/30 px-8 py-3 text-base font-semibold text-navy/70 transition hover:border-navy hover:text-navy"
            >
              For Businesses
            </a>
          </div>

          {/* Trust badges */}
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-warm-gray">
            <span>🛡️ 48-hour money-back guarantee</span>
            <span>✓ No subscriptions</span>
            <span>✓ Ships directly to them</span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════ USE CASES CAROUSEL ═══════════════════════ */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            One platform, every reason to gift
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-warm-gray">
            See how people just like you use SendForGood.
          </p>

          {/* Carousel */}
          <div
            className="relative mt-14"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Slides container */}
            <div className="overflow-hidden rounded-2xl bg-cream shadow-lg">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {USE_CASES.map((uc) => (
                  <div
                    key={uc.label}
                    className="w-full shrink-0 px-8 py-12 sm:px-12 sm:py-16"
                  >
                    <div className="text-center">
                      <span className="text-6xl sm:text-7xl" role="img" aria-label={uc.label}>
                        {uc.emoji}
                      </span>

                      <p className="mt-3 text-sm font-semibold tracking-widest text-gold uppercase">
                        {uc.label}
                      </p>

                      <h3 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">
                        {uc.headline}
                      </h3>

                      <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-warm-gray sm:text-lg">
                        {uc.description}
                      </p>

                      <blockquote className="mx-auto mt-8 max-w-md rounded-xl bg-cream-dark/60 px-6 py-5">
                        <p className="text-base leading-relaxed text-navy/80 italic">
                          &ldquo;{uc.quote}&rdquo;
                        </p>
                      </blockquote>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dot navigation */}
            <div className="mt-6 flex items-center justify-center gap-2.5">
              {USE_CASES.map((uc, i) => (
                <button
                  key={uc.label}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Go to slide: ${uc.label}`}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    i === activeSlide
                      ? "w-8 bg-navy"
                      : "w-3 bg-navy/20 hover:bg-navy/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ AI CURATION ═══════════════════════ */}
      <section className="bg-gradient-to-b from-white to-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Smarter gift selection, powered by AI
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-warm-gray">
            Tell us about your recipient &mdash; their age, interests,
            personality. Our AI analyzes thousands of products to find something
            they will genuinely love. Not a generic gift. The right gift.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="Matched to their interests">🎯</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">Matched to their interests</h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                We factor in age, hobbies, personality, and what they actually care about.
              </p>
            </article>

            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="Different every year">🔄</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">Different every year</h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Our AI makes sure they never get the same gift twice.
              </p>
            </article>

            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="Curated, not random">✨</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">Curated, not random</h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Every gift is reviewed before it ships.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section id="how-it-works" className="bg-gradient-to-b from-cream-dark to-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-warm-gray">
            Three steps. That&rsquo;s all it takes.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                emoji: "🎯",
                title: "Choose your recipient & occasion",
                description:
                  "Pick who, what occasion, and how many years",
              },
              {
                step: "2",
                emoji: "🎁",
                title: "Select your gift tier",
                description:
                  "From quality gifts to premium selections",
              },
              {
                step: "3",
                emoji: "✅",
                title: "We handle everything, forever",
                description:
                  "We source, select, and ship the gift every year. Two weeks before each delivery we check in with you to confirm the details \u2014 address, preferences, anything that may have changed. No surprises.",
              },
            ].map((item) => (
              <article
                key={item.step}
                className="group relative rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy text-lg font-bold text-cream">
                  {item.step}
                </div>
                <span className="mt-5 block text-4xl" role="img" aria-label={item.title}>
                  {item.emoji}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-navy">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-warm-gray">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHITE LABEL / NO BRANDING ═══════════════════ */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Your name. Their smile. Delivered.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-warm-gray">
            Every gift arrives with no SendForGood branding. The recipient just
            knows someone who loves them sent something wonderful.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
            <article className="rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="Gifts shipped directly to them">
                🎁
              </span>
              <h3 className="mt-4 text-xl font-semibold text-navy">
                Gifts shipped directly to them
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                No middleman, no delays. Ordered and shipped to their door.
              </p>
            </article>

            <article className="rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="They never know it was automated">
                ✨
              </span>
              <h3 className="mt-4 text-xl font-semibold text-navy">
                They never know it was automated
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                It just looks like you remembered. Because in every way that matters, you did.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ B2B SECTION ═══════════════════════ */}
      <section id="for-businesses" className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-cream sm:text-4xl">
            Built for businesses that care about relationships
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-cream/70">
            From realtors to HR teams to small businesses &mdash; SendForGood
            is your always-on gifting department.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {BUSINESS_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-cream/10 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10"
              >
                <span className="text-4xl" role="img" aria-label={card.title}>
                  {card.emoji}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-cream">
                  {card.title}
                </h3>
                <p className="mt-2 leading-relaxed text-cream/70">
                  {card.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-10 py-4 text-lg font-semibold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Contact us about business plans
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SELF-GIFTING ═══════════════════════ */}
      <section className="bg-gradient-to-b from-cream-dark to-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Treat Yourself. Every Year.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-warm-gray">
            You buy gifts for everyone else. Who buys gifts for you? Set up a
            birthday or holiday gift for yourself &mdash; something you actually
            want, arriving every year automatically. Or write yourself a digital
            letter for just $1/year &mdash; the cheapest way to leave a legacy.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="Your birthday, done right">🎂</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">Your birthday, done right</h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Stop forgetting your own birthday. Set up something you actually want.
              </p>
            </article>

            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="Holiday treats for you">🎄</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">Holiday treats for you</h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                A Christmas or holiday gift to yourself, every year, no effort.
              </p>
            </article>

            <article className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl" role="img" aria-label="You deserve it">💆</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">You deserve it</h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Seriously. You work hard. Treat yourself.
              </p>
            </article>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/send"
              className="inline-flex items-center justify-center rounded-lg bg-navy px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Send Yourself a Gift
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ LEGACY LETTERS ═══════════════════════ */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl md:text-5xl">
            Leave more than a gift. Leave your words.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-warm-gray">
            Write letters to the people you love. Choose how they arrive &mdash;
            by email for as little as $1 a year, or printed and mailed for a
            more personal touch. We keep them safe and deliver them when the time
            comes.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            <article className="rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-5xl" role="img" aria-label="Digital Letters">
                📧
              </span>
              <h3 className="mt-5 text-xl font-semibold text-navy">
                Digital Letters &mdash; $1/year
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Delivered by email on the scheduled date. Automated, reliable,
                and starts at just $1 per year.
              </p>
            </article>

            <article className="rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-5xl" role="img" aria-label="Physical Letters">
                ✉️
              </span>
              <h3 className="mt-5 text-xl font-semibold text-navy">
                Physical Letters &mdash; $10/year
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Printed on quality paper and mailed to their address. A real
                keepsake they can hold and keep forever.
              </p>
            </article>

            <article className="rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-5xl" role="img" aria-label="Physical + Photo Letters">
                📸
              </span>
              <h3 className="mt-5 text-xl font-semibold text-navy">
                Physical + Photo &mdash; $15/year
              </h3>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Everything in Physical, plus a wallet-sized photo printed and
                mailed with the letter. Our most popular letter option.
              </p>
            </article>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/letters"
              className="inline-flex items-center justify-center rounded-lg bg-navy px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Start Writing Your Letters &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SOCIAL PROOF ═══════════════════════ */}
      <section className="bg-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Trusted by thoughtful people
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.author}
                className="flex flex-col rounded-2xl bg-white p-8 shadow-md transition hover:shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mb-4 h-8 w-8 text-gold/40"
                  aria-hidden="true"
                >
                  <path d="M11.3 2.8C6.1 5.1 3 9.2 3 14c0 3.3 2.4 6 5.4 6 2.6 0 4.6-2 4.6-4.4 0-2.5-1.8-4.2-4.1-4.2-.4 0-1 .1-1.2.2.6-3 3-5.8 5.8-7.4L11.3 2.8zm10 0C16.1 5.1 13 9.2 13 14c0 3.3 2.4 6 5.4 6 2.6 0 4.6-2 4.6-4.4 0-2.5-1.8-4.2-4.1-4.2-.4 0-1 .1-1.2.2.6-3 3-5.8 5.8-7.4L21.3 2.8z" />
                </svg>

                <p className="flex-1 text-base leading-relaxed text-warm-gray italic">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <footer className="mt-6 border-t border-cream-dark pt-4">
                  <cite className="not-italic">
                    <span className="font-semibold text-navy">
                      {t.author}
                    </span>
                    <span className="ml-1 text-sm text-warm-gray-light">
                      &mdash; {t.role}
                    </span>
                  </cite>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRICING PREVIEW ═══════════════════════ */}
      <section className="bg-cream-dark px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">
            As little as <span className="text-gold">$1.67/month</span> — gifts delivered every year.
          </h2>
          <p className="mt-3 text-base font-medium text-navy/80">
            Legacy Letters from $1/year &mdash; Digital, Physical, or Physical + Photo
          </p>
          <p className="mt-4 text-lg text-warm-gray">
            One payment. Up to 25 years of joy. No subscriptions.
          </p>
          <p className="mt-2 text-sm text-warm-gray-light">
            Currently serving the continental United States
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-1.5 text-lg font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4 transition hover:text-navy-light hover:decoration-gold-light"
          >
            View all gift tiers
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════ CUSTOMER VOICES ═══════════════════════ */}
      <section className="bg-cream px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            Real people. Real gifts. Real joy.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <blockquote className="rounded-xl bg-white p-6 shadow-md">
              <p className="text-sm leading-relaxed text-warm-gray italic">
                &ldquo;I set it up in 10 minutes for all my grandkids. Have not thought about it since.&rdquo;
              </p>
              <footer className="mt-4 text-xs font-semibold text-navy">
                — Grandmother of 4
              </footer>
            </blockquote>
            <blockquote className="rounded-xl bg-white p-6 shadow-md">
              <p className="text-sm leading-relaxed text-warm-gray italic">
                &ldquo;My client got a home anniversary gift. They called me for a referral the next week.&rdquo;
              </p>
              <footer className="mt-4 text-xs font-semibold text-navy">
                — Realtor
              </footer>
            </blockquote>
            <blockquote className="rounded-xl bg-white p-6 shadow-md">
              <p className="text-sm leading-relaxed text-warm-gray italic">
                &ldquo;Holly gets a birthday box every year. She loses her mind when it arrives.&rdquo;
              </p>
              <footer className="mt-4 text-xs font-semibold text-navy">
                — Pet owner
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="relative overflow-hidden bg-navy px-6 py-24 sm:py-32">
        {/* Subtle decorative accents */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg
            className="absolute -left-20 top-0 h-80 w-80 text-gold/5"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle cx="100" cy="100" r="90" fill="currentColor" />
          </svg>
          <svg
            className="absolute -bottom-10 right-0 h-64 w-64 text-gold/5"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path
              d="M120 20c30 15 60 50 60 90s-20 60-50 70-70-10-80-50 10-80 40-100 30-10 30-10z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl md:text-5xl">
            Some moments only come once.
            <br />
            <span className="text-gold">Make sure you&rsquo;re there for all of them.</span>
          </h2>
          <div className="mt-10">
            <Link
              href="/send"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Start Sending Today
            </Link>
          </div>
          <p className="mt-5 text-sm text-cream/60">
            47 gift plans scheduled and counting
          </p>
        </div>
      </section>
    </main>
  );
}
