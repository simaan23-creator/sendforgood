"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const MILESTONE_SUGGESTIONS = [
  "High School Graduation",
  "College Graduation",
  "Wedding Day",
  "First Child Born",
  "18th Birthday",
  "21st Birthday",
  "30th Birthday",
  "40th Birthday",
  "50th Birthday",
  "Retirement",
  "First Home",
  "First Job",
];

const MAX_LETTER_LENGTH = 5000;

interface FormData {
  recipientName: string;
  relationship: string;
  letterType: "annual" | "milestone";
  title: string;
  content: string;
  scheduledDate: string;
  milestoneLabel: string;
  years: number;
  executorEmail: string;
  executorName: string;
  executorPhone: string;
  executorAddress: string;
  executorCanView: boolean;
  executorCanEdit: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

export default function WriteLetterPage() {
  const router = useRouter();
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
    title: "",
    content: "",
    scheduledDate: "",
    milestoneLabel: "",
    years: 5,
    executorEmail: "",
    executorName: "",
    executorPhone: "",
    executorAddress: "",
    executorCanView: false,
    executorCanEdit: false,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
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

  function getPrice(): number {
    if (form.letterType === "annual") {
      return 10 * form.years;
    }
    if (milestoneQuantity === "bundle5") return 60;
    if (milestoneQuantity === "bundle10") return 100;
    return 15;
  }

  function getPriceCents(): number {
    if (form.letterType === "annual") {
      return 1000 * form.years;
    }
    if (milestoneQuantity === "bundle5") return 6000;
    if (milestoneQuantity === "bundle10") return 10000;
    return 1500;
  }

  function getPriceLabel(): string {
    if (form.letterType === "annual") {
      return `$10/yr × ${form.years} year${form.years > 1 ? "s" : ""} = $${getPrice()}`;
    }
    if (milestoneQuantity === "bundle5") return "5 Milestone Letters — $60";
    if (milestoneQuantity === "bundle10") return "10 Milestone Letters — $100";
    return "1 Milestone Letter — $15";
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return form.recipientName.trim().length > 0 && form.relationship.trim().length > 0;
      case 2:
        if (form.letterType === "annual") {
          return form.scheduledDate.length > 0;
        }
        return form.milestoneLabel.trim().length > 0;
      case 3:
        return form.title.trim().length > 0 && form.content.trim().length >= 20;
      case 4:
        return (
          form.addressLine1.trim().length > 0 &&
          form.city.trim().length > 0 &&
          form.state.trim().length > 0 &&
          form.postalCode.trim().length > 0
        );
      case 5:
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

  const totalSteps = 5;
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
            Write Your Letter
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
              Who is this letter for?
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
                  <p className="mt-2 text-sm font-bold text-gold">$10/yr</p>
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
                  <p className="mt-2 text-sm font-bold text-gold">From $15</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              {form.letterType === "annual"
                ? "When should it arrive each year?"
                : "What milestone is this for?"}
            </h2>

            {form.letterType === "annual" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Delivery Date (month & day each year)
                  </label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => update("scheduledDate", e.target.value)}
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    autoFocus
                  />
                  <p className="mt-1.5 text-xs text-warm-gray-light">
                    The first letter will go out on this date (or the next
                    occurrence if in the past).
                  </p>
                </div>

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
                    Total: <span className="font-semibold text-navy">${form.years * 10}</span>{" "}
                    ($10/yr &times; {form.years} years)
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Milestone
                  </label>
                  <input
                    type="text"
                    value={form.milestoneLabel}
                    onChange={(e) => update("milestoneLabel", e.target.value)}
                    placeholder="e.g. College Graduation"
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    autoFocus
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MILESTONE_SUGGESTIONS.map((ms) => (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => update("milestoneLabel", ms)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          form.milestoneLabel === ms
                            ? "border-gold bg-gold/10 text-gold-dark"
                            : "border-cream-dark bg-white text-warm-gray hover:border-gold/50"
                        }`}
                      >
                        {ms}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Estimated delivery date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => update("scheduledDate", e.target.value)}
                    className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <p className="mt-1.5 text-xs text-warm-gray-light">
                    Don&apos;t know yet? That&apos;s fine &mdash; you or your executor
                    can set this later.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Pricing
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        { id: "single" as const, label: "1 Milestone Letter", price: "$15" },
                        { id: "bundle5" as const, label: "5 Milestone Letters", price: "$60", save: "Save $15" },
                        { id: "bundle10" as const, label: "10 Milestone Letters", price: "$100", save: "Save $50" },
                      ] as const
                    ).map((opt) => (
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
                        {"save" in opt && opt.save && (
                          <span className="mt-1 inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                            {opt.save}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Write the letter */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Write your letter to {form.recipientName}
            </h2>
            <p className="text-sm text-warm-gray">
              Write from the heart. This letter will be printed on premium
              stationery and sealed with care.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Letter Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={
                  form.letterType === "annual"
                    ? `e.g. Happy Birthday, ${form.recipientName}`
                    : `e.g. For Your ${form.milestoneLabel || "Graduation"}`
                }
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Your Letter
              </label>
              <textarea
                value={form.content}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_LETTER_LENGTH) {
                    update("content", e.target.value);
                  }
                }}
                rows={14}
                placeholder={`Dear ${form.recipientName},\n\nI'm writing this letter because...`}
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 font-serif text-base leading-relaxed"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs text-warm-gray-light">
                  Minimum 20 characters. You can edit this later before it prints.
                </p>
                <p
                  className={`text-xs font-medium ${
                    form.content.length > MAX_LETTER_LENGTH * 0.9
                      ? "text-red-500"
                      : "text-warm-gray-light"
                  }`}
                >
                  {form.content.length.toLocaleString()}/{MAX_LETTER_LENGTH.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Delivery Address */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Where should we deliver {form.recipientName}&apos;s letter?
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Executor Email{" "}
                <span className="text-warm-gray-light font-normal">(optional but recommended)</span>
              </label>
              <input
                type="email"
                value={form.executorEmail}
                onChange={(e) => update("executorEmail", e.target.value)}
                placeholder="spouse@email.com"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <p className="mt-1.5 text-xs text-warm-gray-light">
                Your executor will be notified to manage letter deliveries if your account becomes inactive.
              </p>
              {form.executorEmail && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      Executor Full Name{" "}
                      <span className="text-warm-gray-light font-normal">(required)</span>
                    </label>
                    <input
                      type="text"
                      value={form.executorName}
                      onChange={(e) => update("executorName", e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      Executor Phone{" "}
                      <span className="text-warm-gray-light font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.executorPhone}
                      onChange={(e) => update("executorPhone", e.target.value)}
                      placeholder="(555) 555-5555"
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      Executor Address{" "}
                      <span className="text-warm-gray-light font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={form.executorAddress}
                      onChange={(e) => update("executorAddress", e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                      rows={2}
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
              )}
              {form.executorEmail && (
                <div className="mt-4 space-y-3 rounded-lg border border-cream-dark bg-cream/50 p-4">
                  <p className="text-sm font-medium text-navy">Executor permissions:</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.executorCanView}
                      onChange={(e) => update("executorCanView", e.target.checked)}
                      className="h-4 w-4 rounded border-cream-dark accent-gold"
                    />
                    <span className="text-sm text-warm-gray">Allow executor to <strong>view</strong> my letters</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.executorCanEdit}
                      onChange={(e) => update("executorCanEdit", e.target.checked)}
                      className="h-4 w-4 rounded border-cream-dark accent-gold"
                    />
                    <span className="text-sm text-warm-gray">Allow executor to <strong>edit</strong> my letters</span>
                  </label>
                  <p className="text-xs text-warm-gray-light">By default, executors can only release letters — not read or change them.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Pay */}
        {step === 5 && (
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
              {form.letterType === "annual" && (
                <div className="flex justify-between">
                  <span className="text-sm text-warm-gray">Delivery Date</span>
                  <span className="text-sm font-medium text-navy">
                    {form.scheduledDate
                      ? new Date(form.scheduledDate + "T00:00:00").toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        })
                      : "Not set"}
                    , every year for {form.years} year{form.years > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {form.letterType === "milestone" && (
                <div className="flex justify-between">
                  <span className="text-sm text-warm-gray">Milestone</span>
                  <span className="text-sm font-medium text-navy">
                    {form.milestoneLabel}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Title</span>
                <span className="text-sm font-medium text-navy">
                  {form.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Delivery Address</span>
                <span className="text-sm font-medium text-navy text-right">
                  {form.addressLine1}
                  {form.addressLine2 && `, ${form.addressLine2}`}
                  <br />
                  {form.city}, {form.state} {form.postalCode}
                </span>
              </div>
              {form.executorEmail && (
                <div className="flex justify-between">
                  <span className="text-sm text-warm-gray">Executor</span>
                  <span className="text-sm font-medium text-navy">
                    {form.executorEmail}
                  </span>
                </div>
              )}

              <div className="border-t border-cream-dark pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-warm-gray">Letter Preview</span>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs font-medium text-gold hover:text-gold-dark transition"
                  >
                    Edit Letter
                  </button>
                </div>
                <div className="mt-2 rounded-lg bg-cream/50 p-4 font-serif text-sm leading-relaxed text-navy max-h-40 overflow-y-auto">
                  {form.content.split("\n").map((line, i) => (
                    <p key={i} className={line.trim() === "" ? "h-4" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="border-t border-cream-dark pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-navy">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-navy">
                      ${getPrice()}
                    </p>
                    <p className="text-xs text-warm-gray">{getPriceLabel()}</p>
                  </div>
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
              {loading ? "Creating checkout..." : `Pay $${getPrice()} & Schedule Letter`}
            </button>

            <p className="text-center text-xs text-warm-gray-light">
              Your letter will be stored securely and delivered on schedule.
              You can edit it anytime before it prints.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 5 && (
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
