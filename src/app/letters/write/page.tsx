"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type DeliveryType = "digital" | "physical" | "physical_photo";

interface FormData {
  recipientName: string;
  relationship: string;
  letterType: "annual" | "milestone";
  deliveryType: DeliveryType;
  years: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  recipientEmail: string;
}

export default function WriteLetterPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "milestone" ? "milestone" : "annual";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const [form, setForm] = useState<FormData>({
    recipientName: "",
    relationship: "",
    letterType: initialType,
    deliveryType: "physical",
    years: 5,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    recipientEmail: "",
  });

  // Pricing
  const [milestoneQuantity, setMilestoneQuantity] = useState<"single" | "bundle5" | "bundle10">("single");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ id: user.id, email: user.email || "" });
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
      }
    });
  }, []);

  function update(field: keyof FormData, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function getPerYearCents(): number {
    if (form.deliveryType === "digital") return 100;
    if (form.deliveryType === "physical_photo") return 1500;
    return 1000;
  }

  function getPerYearDollars(): number {
    return getPerYearCents() / 100;
  }

  function getPrice(): number {
    if (form.letterType === "annual") {
      return getPerYearDollars() * form.years;
    }
    if (milestoneQuantity === "bundle5") return getPerYearDollars() * 5;
    if (milestoneQuantity === "bundle10") return getPerYearDollars() * 10;
    return getPerYearDollars();
  }

  function getPriceCents(): number {
    if (form.letterType === "annual") {
      return getPerYearCents() * form.years;
    }
    if (milestoneQuantity === "bundle5") return getPerYearCents() * 5;
    if (milestoneQuantity === "bundle10") return getPerYearCents() * 10;
    return getPerYearCents();
  }

  function getDeliveryLabel(): string {
    if (form.deliveryType === "digital") return "Digital (Email)";
    if (form.deliveryType === "physical_photo") return "Physical + Photo";
    return "Physical (Mailed)";
  }

  function getQuantityLabel(): string {
    if (form.letterType === "annual") {
      return `${form.years} year${form.years > 1 ? "s" : ""} ($${getPerYearDollars()}/yr)`;
    }
    if (milestoneQuantity === "bundle5") return "5 Milestone Letters";
    if (milestoneQuantity === "bundle10") return "10 Milestone Letters";
    return "1 Milestone Letter";
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return form.recipientName.trim().length > 0 && form.relationship.trim().length > 0;
      case 2:
        if (form.deliveryType === "digital") {
          return form.recipientEmail.trim().length > 0 && form.recipientEmail.includes("@");
        }
        return (
          form.addressLine1.trim().length > 0 &&
          form.city.trim().length > 0 &&
          form.state.trim().length > 0 &&
          form.postalCode.trim().length > 0
        );
      case 3:
        return !user ? email.trim().length > 0 : true;
      default:
        return true;
    }
  }

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/letters/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          milestoneQuantity,
          priceCents: getPriceCents(),
          email: email || user?.email || "",
          fullName,
          deliveryType: form.deliveryType,
          recipientEmail: form.recipientEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const totalSteps = 3;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/letters"
            className="text-sm font-medium text-warm-gray hover:text-navy transition-colors"
          >
            &larr; Back to Legacy Letters
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-navy">
            Create Your Legacy Letters
          </h1>
          <p className="mt-2 text-warm-gray">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-10 h-2 w-full overflow-hidden rounded-full bg-cream-dark">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step 1: Recipient */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Who are you writing to?
            </h2>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Recipient&apos;s Name
              </label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Your Relationship
              </label>
              <input
                type="text"
                value={form.relationship}
                onChange={(e) => update("relationship", e.target.value)}
                placeholder="e.g. Daughter, Son, Grandchild, Friend"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Letter Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update("letterType", "annual")}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    form.letterType === "annual"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <p className="font-semibold text-navy">Annual Letter</p>
                  <p className="mt-1 text-xs text-warm-gray">
                    Delivered every year on their date
                  </p>
                  <p className="mt-2 text-sm font-bold text-gold">${getPerYearDollars()}/yr</p>
                </button>
                <button
                  type="button"
                  onClick={() => update("letterType", "milestone")}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    form.letterType === "milestone"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <p className="font-semibold text-navy">Milestone Letter</p>
                  <p className="mt-1 text-xs text-warm-gray">
                    One-time delivery for a special moment
                  </p>
                  <p className="mt-2 text-sm font-bold text-gold">From ${getPerYearDollars()}</p>
                </button>
              </div>
            </div>

            {/* Delivery Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                How should we deliver it?
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => update("deliveryType", "digital")}
                  className={`relative rounded-xl border-2 p-4 text-left transition ${
                    form.deliveryType === "digital"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <div className="text-2xl mb-1">&#9993;</div>
                  <p className="font-semibold text-navy text-sm">Digital</p>
                  <p className="mt-0.5 text-xs text-warm-gray leading-relaxed">
                    Delivered by email
                  </p>
                  <span className="mt-1.5 inline-block rounded-full bg-forest/10 px-2 py-0.5 text-xs font-bold text-forest">
                    $1/yr
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => update("deliveryType", "physical")}
                  className={`relative rounded-xl border-2 p-4 text-left transition ${
                    form.deliveryType === "physical"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <div className="text-2xl mb-1">&#128236;</div>
                  <p className="font-semibold text-navy text-sm">Physical</p>
                  <p className="mt-0.5 text-xs text-warm-gray leading-relaxed">
                    Printed &amp; mailed
                  </p>
                  <span className="mt-1.5 inline-block rounded-full bg-forest/10 px-2 py-0.5 text-xs font-bold text-forest">
                    $10/yr
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => update("deliveryType", "physical_photo")}
                  className={`relative rounded-xl border-2 p-4 text-left transition ${
                    form.deliveryType === "physical_photo"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <span className="absolute -top-2.5 right-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Popular
                  </span>
                  <div className="text-2xl mb-1">&#128247;</div>
                  <p className="font-semibold text-navy text-sm">Physical + Photo</p>
                  <p className="mt-0.5 text-xs text-warm-gray leading-relaxed">
                    Mailed with printed photo
                  </p>
                  <span className="mt-1.5 inline-block rounded-full bg-forest/10 px-2 py-0.5 text-xs font-bold text-forest">
                    $15/yr
                  </span>
                </button>
              </div>
            </div>

            {/* Quantity selection inline with step 1 */}
            {form.letterType === "annual" ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  How many years?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={form.years}
                    onChange={(e) => update("years", parseInt(e.target.value))}
                    className="flex-1 accent-gold"
                  />
                  <span className="w-16 text-center text-lg font-bold text-navy">
                    {form.years} yr{form.years > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-warm-gray">
                  Total: <span className="font-semibold text-navy">${getPrice()}</span>{" "}
                  (${getPerYearDollars()}/yr &times; {form.years} years)
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Pricing
                </label>
                <div className="space-y-2">
                  {([
                    { id: "single" as const, label: "1 Milestone Letter", price: `$${getPerYearDollars()}` },
                    { id: "bundle5" as const, label: "5 Milestone Letters", price: `$${getPerYearDollars() * 5}` },
                    { id: "bundle10" as const, label: "10 Milestone Letters", price: `$${getPerYearDollars() * 10}` },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMilestoneQuantity(opt.id)}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        milestoneQuantity === opt.id
                          ? "border-gold bg-gold/5"
                          : "border-cream-dark bg-white hover:border-gold/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-navy">
                          {opt.label}
                        </span>
                        <span className="font-bold text-navy">
                          {opt.price}
                        </span>
                      </div>
                      {opt.id === "bundle5" && (
                        <span className="mt-1 inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                          5-pack
                        </span>
                      )}
                      {opt.id === "bundle10" && (
                        <span className="mt-1 inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                          Best value
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Delivery Details */}
        {step === 2 && (
          <div className="space-y-6">
            {form.deliveryType === "digital" ? (
              <>
                <h2 className="text-xl font-bold text-navy">
                  Where should we email {form.recipientName}&apos;s letters?
                </h2>
                <p className="text-sm text-warm-gray">
                  We&apos;ll send the letter to this email on the scheduled date.
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) => update("recipientEmail", e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    autoFocus
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-navy">
                  Where should we deliver {form.recipientName}&apos;s letters?
                </h2>
                <p className="text-sm text-warm-gray">
                  Continental US only. You can update this anytime from your
                  dashboard.
                </p>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={form.addressLine1}
                    onChange={(e) => update("addressLine1", e.target.value)}
                    placeholder="123 Main St"
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Address Line 2{" "}
                    <span className="text-warm-gray-light font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.addressLine2}
                    onChange={(e) => update("addressLine2", e.target.value)}
                    placeholder="Apt 4B"
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                      placeholder="NY"
                      maxLength={2}
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => update("postalCode", e.target.value)}
                      placeholder="10001"
                      maxLength={10}
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Review & Pay
            </h2>

            <div className="rounded-xl border border-cream-dark bg-white p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Recipient</span>
                <span className="text-sm font-medium text-navy">
                  {form.recipientName} ({form.relationship})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Letter Type</span>
                <span className="text-sm font-medium text-navy capitalize">
                  {form.letterType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Delivery</span>
                <span className="text-sm font-medium text-navy">
                  {getDeliveryLabel()} &mdash; ${getPerYearDollars()}/yr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Quantity</span>
                <span className="text-sm font-medium text-navy">
                  {getQuantityLabel()}
                </span>
              </div>
              {form.deliveryType === "digital" ? (
                <div className="flex justify-between">
                  <span className="text-sm text-warm-gray">Recipient Email</span>
                  <span className="text-sm font-medium text-navy">
                    {form.recipientEmail}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-sm text-warm-gray">Delivery Address</span>
                  <span className="text-sm font-medium text-navy text-right">
                    {form.addressLine1}
                    {form.addressLine2 && `, ${form.addressLine2}`}
                    <br />
                    {form.city}, {form.state} {form.postalCode}
                  </span>
                </div>
              )}

              <div className="border-t border-cream-dark pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-navy">Total</span>
                  <span className="text-2xl font-extrabold text-navy">
                    ${getPrice()}
                  </span>
                </div>
              </div>
            </div>

            {/* Email/Name if not logged in */}
            {!user && (
              <div className="rounded-xl border border-cream-dark bg-white p-6 space-y-4">
                <h3 className="text-sm font-semibold text-navy">
                  Your Information
                </h3>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || !canAdvance()}
              className="w-full rounded-lg bg-forest px-6 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating checkout..." : `Pay $${getPrice()}`}
            </button>

            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
              <p className="text-sm text-navy">
                After purchase, you&apos;ll configure delivery dates, write your letters, and set up your executor from your dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="rounded-lg border border-cream-dark px-6 py-3 text-sm font-medium text-warm-gray transition hover:bg-cream-dark disabled:invisible"
            >
              Back
            </button>
            <button
              onClick={() => setStep(Math.min(totalSteps, step + 1))}
              disabled={!canAdvance()}
              className="rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
