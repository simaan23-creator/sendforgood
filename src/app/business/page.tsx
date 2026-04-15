"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const FEATURES = [
  {
    icon: "\u{1F4CB}",
    title: "Bulk Upload",
    description:
      "Add dozens of recipients at once via CSV or manual entry",
  },
  {
    icon: "\u{1F3F7}\uFE0F",
    title: "Custom Branding",
    description:
      "Every gift arrives from your company, not from us",
  },
  {
    icon: "\u{1F4CA}",
    title: "Dashboard",
    description:
      "Track all your recipients and upcoming deliveries in one place",
  },
  {
    icon: "\u{1F4B3}",
    title: "Simple Billing",
    description:
      "One invoice, clear pricing, no surprises",
  },
] as const;

const INDUSTRIES = [
  {
    name: "Real Estate",
    blurb:
      "Close the deal and keep the relationship. Send annual gifts to past clients so you're the first name they think of for referrals.",
  },
  {
    name: "Financial Services",
    blurb:
      "Build lasting trust with clients. A thoughtful annual gift shows you value the relationship beyond the portfolio.",
  },
  {
    name: "Healthcare",
    blurb:
      "Show patients and partners they matter. Strengthen referral networks with consistent, meaningful gestures.",
  },
  {
    name: "HR / Corporate",
    blurb:
      "Boost retention and morale. Automate employee birthday and work anniversary gifts at scale.",
  },
  {
    name: "Retail",
    blurb:
      "Turn one-time buyers into lifelong customers. Surprise your top clients with gifts that keep them coming back.",
  },
] as const;

export default function BusinessPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  return (
    <main className="bg-gradient-to-b from-cream to-cream-dark">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy tracking-tight leading-tight">
            Gifting that grows your business
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-warm-gray max-w-2xl mx-auto leading-relaxed">
            Send gifts once, assign clients as you go. Automated,
            effortless, memorable &mdash; we handle the rest.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isLoggedIn ? "/business/dashboard" : "/business/signup"}
              className="inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3.5 text-base font-semibold text-cream shadow-sm hover:bg-navy-light transition-colors duration-150 w-full sm:w-auto"
            >
              {isLoggedIn ? "Go to Business Dashboard" : "Set Up Your Business Account"}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-8 py-3.5 text-base font-semibold text-navy hover:bg-navy hover:text-cream transition-colors duration-150 w-full sm:w-auto"
            >
              View Pricing
            </Link>
          </div>
          {!isLoggedIn && (
            <p className="mt-4 text-sm text-warm-gray">
              Already have an account?{" "}
              <Link href="/auth" className="font-medium text-gold hover:text-gold-dark underline underline-offset-2">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy text-center mb-12">
            Everything you need to gift at scale
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-cream-dark bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <span className="text-3xl" role="img" aria-label={f.title}>
                  {f.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-navy">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-warm-gray leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 sm:py-20 bg-white/50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy text-center mb-4">
            Built for your industry
          </h2>
          <p className="text-warm-gray text-center mb-12 max-w-xl mx-auto">
            No matter your field, SendForGood helps you build stronger
            relationships through consistent, thoughtful gifting.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="rounded-2xl border border-cream-dark bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-navy">{ind.name}</h3>
                <p className="mt-2 text-sm text-warm-gray leading-relaxed">
                  {ind.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing note */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-warm-gray mb-3 leading-relaxed">
            Business accounts use the same gift tiers as individual senders —
            from $20 to $200 per gift. Send gifts in bulk, assign
            clients from your dashboard.
          </p>
          <p className="text-sm text-warm-gray-light mb-3">
            Volume discounts available for 20+ recipients —{" "}
            <a
              href="mailto:support@sendforgood.com"
              className="text-gold hover:text-gold-dark underline underline-offset-2"
            >
              contact us
            </a>
            .
          </p>
          <p className="text-xs text-warm-gray-light mb-10">
            📦 Delivers to continental US only
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-cream transition-colors duration-150"
          >
            See All Tier Details
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 bg-navy">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-cream tracking-tight">
            Ready to start gifting at scale?
          </h2>
          <p className="mt-4 text-lg text-cream/70 max-w-xl mx-auto leading-relaxed">
            Set up your business account in minutes. Buy gift credits, assign
            clients from your dashboard, and we select and ship gifts on your behalf &mdash; automatically.
          </p>
          <Link
            href={isLoggedIn ? "/business/dashboard" : "/business/signup"}
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-gold px-8 py-3.5 text-base font-semibold text-navy shadow-sm hover:bg-gold-light transition-colors duration-150"
          >
            {isLoggedIn ? "Go to Business Dashboard" : "Set Up Your Business Account"}
          </Link>
        </div>
      </section>
    </main>
  );
}
