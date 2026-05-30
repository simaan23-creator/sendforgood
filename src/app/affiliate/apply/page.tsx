"use client";

import { useState } from "react";
import Link from "next/link";

interface SuccessResponse {
  code: string;
  portal_url: string;
  share_link: string;
  portal_password?: string;
  already_registered?: boolean;
  message?: string;
}

export default function AffiliateApplyPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    business_name: "",
    website: "",
    instagram: "",
    city: "",
    state: "",
    audience: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard API blocked — silently ignore; the value is on screen.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSuccess(data);
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="bg-cream min-h-screen px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            {success.already_registered ? "Already in the program" : "You're in"}
          </p>
          <h1 className="mt-4 text-4xl font-bold text-navy sm:text-5xl">
            {success.already_registered
              ? "Welcome back."
              : "Welcome to the program."}
          </h1>
          {success.message && (
            <p className="mt-4 text-lg text-warm-gray">{success.message}</p>
          )}
          <p className="mt-4 text-lg text-warm-gray">
            {success.already_registered
              ? "Your existing link and dashboard are below. Check your email for your portal password if you've forgotten it."
              : "Earning starts on your first referral. We just emailed everything below — save it."}
          </p>

          <div className="mt-10 space-y-5">
            <div className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-gold">
                Your share link
              </div>
              <p className="mt-2 break-all font-mono text-sm text-navy">
                {success.share_link}
              </p>
              <button
                onClick={() => copy(success.share_link, "link")}
                className="mt-3 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-navy/90"
              >
                {copied === "link" ? "Copied!" : "Copy link"}
              </button>
              <p className="mt-3 text-xs text-warm-gray">
                Anyone who clicks this is cookied to your code for 30 days.
                15% on first purchase, 10% on every repeat forever.
              </p>
            </div>

            <div className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-gold">
                Your dashboard
              </div>
              <p className="mt-2 break-all font-mono text-sm text-navy">
                {success.portal_url}
              </p>
              {success.portal_password && (
                <p className="mt-2 text-sm text-warm-gray">
                  Portal password:{" "}
                  <span className="rounded bg-cream-dark px-2 py-0.5 font-mono text-navy">
                    {success.portal_password}
                  </span>
                </p>
              )}
              <Link
                href={success.portal_url}
                className="mt-4 inline-flex items-center rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-navy transition hover:bg-gold-light"
              >
                Open dashboard &rarr;
              </Link>
            </div>
          </div>

          <p className="mt-12 text-center text-sm text-warm-gray">
            Questions? Just reply to the welcome email — it goes straight to the founder.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-cream via-cream to-cream-dark px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Affiliate Program
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-navy sm:text-5xl md:text-6xl">
            Earn from every couple
            <br />
            <span className="text-gold">you already work with.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            You spend a year with each couple. Add 30 seconds of your time and
            earn a recurring commission every time they buy more vault credits
            — for life.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-cream px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Apply in 60 seconds",
                body: "Fill the form below. You're approved instantly and get your share link by email.",
              },
              {
                step: "2",
                title: "Drop your link",
                body: "In your booking confirmation, on your client questionnaire, on your booth, in your DMs. The cookie lasts 30 days.",
              },
              {
                step: "3",
                title: "Get paid",
                body: "We pay 15% on the couple's first purchase and 10% on every repeat — for the life of their account. Payouts via PayPal or Venmo.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold font-bold text-navy">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The math ── */}
      <section className="bg-cream-dark/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            What you actually earn
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-warm-gray">
            Numbers from a typical photographer doing 20 weddings a year. Assumes
            only half of your couples buy and they pick the $99.95 Starter Package.
          </p>
          <div className="mt-10 rounded-xl border border-cream-dark bg-white p-8 shadow-sm">
            <dl className="divide-y divide-cream-dark">
              <div className="flex justify-between py-3">
                <dt className="text-warm-gray">Weddings booked / year</dt>
                <dd className="font-semibold text-navy">20</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-warm-gray">Couples who buy (50%)</dt>
                <dd className="font-semibold text-navy">10</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-warm-gray">First-purchase commission (15% of $99.95)</dt>
                <dd className="font-semibold text-navy">~$15 each</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-warm-gray">Year-1 earnings (first purchases only)</dt>
                <dd className="font-bold text-gold">~$150</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-warm-gray">Plus 10% on every repeat purchase</dt>
                <dd className="font-semibold text-navy">Recurring</dd>
              </div>
            </dl>
          </div>
          <p className="mt-6 text-center text-sm text-warm-gray">
            Real talk: this won&apos;t replace your shooting income. It will buy you
            a nice dinner every month and your clients will love you for it.
          </p>
        </div>
      </section>

      {/* ── Application form ── */}
      <section id="apply" className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Apply now
          </h2>
          <p className="mt-4 text-center text-warm-gray">
            Instant approval. Your share link is in your inbox 60 seconds from now.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Your name"
                required
                value={form.name}
                onChange={(v) => update("name", v)}
                placeholder="Jane Smith"
              />
              <Field
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(v) => update("email", v)}
                placeholder="jane@studio.com"
              />
            </div>
            <Field
              label="Business name"
              required
              value={form.business_name}
              onChange={(v) => update("business_name", v)}
              placeholder="Jane Smith Photography"
              hint="This becomes your share-link slug, e.g. sealtheday.com/?ref=jane-smith-photography"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Website"
                value={form.website}
                onChange={(v) => update("website", v)}
                placeholder="janesmith.com"
              />
              <Field
                label="Instagram"
                value={form.instagram}
                onChange={(v) => update("instagram", v)}
                placeholder="@janesmithphoto"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="City"
                value={form.city}
                onChange={(v) => update("city", v)}
                placeholder="Austin"
              />
              <Field
                label="State"
                value={form.state}
                onChange={(v) => update("state", v)}
                placeholder="TX"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy">
                Who&apos;s your audience?{" "}
                <span className="font-normal text-warm-gray">(optional)</span>
              </label>
              <textarea
                value={form.audience}
                onChange={(e) => update("audience", e.target.value)}
                rows={3}
                placeholder="Mostly Texas Hill Country weddings, 100–200 guests, $40k+ budgets."
                className="mt-2 w-full rounded-md border border-cream-dark bg-white px-4 py-3 text-sm text-navy placeholder:text-warm-gray/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gold px-8 py-4 text-lg font-bold text-navy shadow-sm transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Get my affiliate link"}
            </button>
            <p className="text-center text-xs text-warm-gray">
              By applying you agree to our{" "}
              <Link href="/terms" className="underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-cream-dark/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Quick FAQ
          </h2>
          <dl className="mt-10 space-y-6">
            {[
              {
                q: "When and how do I get paid?",
                a: "Monthly via PayPal or Venmo, on commissions older than 30 days (Stripe refund window). $25 minimum to send. You tell us your handle when we send your first payout email.",
              },
              {
                q: "How long does the cookie last?",
                a: "30 days. If a couple clicks your link today and buys 3 weeks from now, you're still credited.",
              },
              {
                q: "What counts as a referral?",
                a: "Any purchase made by someone whose last affiliate cookie was yours. We track the cookie at checkout — they don't need to enter a code.",
              },
              {
                q: "Can I promote on Google or Meta ads?",
                a: "Yes, but no bidding on \"SealTheDay\" or trademark variants, and no incentivized fake reviews. We'll pause anyone running misleading creative.",
              },
              {
                q: "Do I get marketing materials?",
                a: "Your dashboard has copy-paste email templates, social-post drafts, a vendor pitch script, and a QR-code generator for booth cards.",
              },
            ].map((f) => (
              <div key={f.q}>
                <dt className="text-base font-semibold text-navy">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-cream-dark bg-white px-4 py-3 text-sm text-navy placeholder:text-warm-gray/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
      {hint && <p className="mt-1.5 text-xs text-warm-gray">{hint}</p>}
    </div>
  );
}
