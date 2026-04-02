"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS, OCCASION_TYPES } from "@/lib/constants";
import type { TierId } from "@/lib/constants";
import { addToCart, getCartCount } from "@/lib/cart";

/* ─────────────────────────────── US States ─────────────────────────────── */

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

const US_STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",
  KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",
  MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",
  NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",
  OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",
  SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",
  VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",
  WI:"Wisconsin",WY:"Wyoming",
};

/* ──────────────────────────── Step Definitions ─────────────────────────── */

const STEP_LABELS = [
  "Recipient",
  "Occasion",
  "Gift Tier",
  "Address",
  "About Them",
  "Review",
];

const RELATIONSHIP_OPTIONS = [
  "Parent",
  "Child",
  "Grandchild",
  "Sibling",
  "Partner/Spouse",
  "Friend",
  "My Pet / Fur Baby",
  "Other",
];

const PET_TYPE_OPTIONS = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Other"] as const;

/* ──────────────────────────── Form Data Type ───────────────────────────── */

interface FormData {
  recipientName: string;
  relationship: string;
  occasionType: string;
  occasionLabel: string;
  occasionDate: string;
  years: number;
  tier: TierId | "";
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  fullName: string;
  recipientAge: string;
  recipientGender: string;
  interests: string[];
  giftNotes: string;
  petType: string;
}

const initialFormData: FormData = {
  recipientName: "",
  relationship: "",
  occasionType: "",
  occasionLabel: "",
  occasionDate: "",
  years: 5,
  tier: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  email: "",
  fullName: "",
  recipientAge: "",
  recipientGender: "",
  interests: [],
  giftNotes: "",
  petType: "",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SendPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  /* Check if user is logged in */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        setUserEmail(data.user.email ?? null);
        setForm((prev) => ({
          ...prev,
          email: data.user!.email ?? "",
          fullName: data.user!.user_metadata?.full_name ?? "",
        }));
      }
    });
  }, []);

  /* Track cart count */
  useEffect(() => {
    setCartCount(getCartCount());
    const onCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener("cart-updated", onCartUpdate);
    return () => window.removeEventListener("cart-updated", onCartUpdate);
  }, []);

  /* ────────────────────────── Helpers ──────────────────────────── */

  const update = (field: keyof FormData, value: string | number | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const selectedTier = TIERS.find((t) => t.id === form.tier);
  const totalPrice = selectedTier ? selectedTier.price * form.years : 0;
  const currentYear = new Date().getFullYear();

  /* ────────────────────────── Validation ───────────────────────── */

  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (s === 0) {
      if (!form.recipientName.trim()) errs.recipientName = "Recipient name is required";
      if (!form.relationship) errs.relationship = "Please select a relationship";
      if (!form.occasionType) errs.occasionType = "Please select an occasion type";
      if (form.occasionType === "custom" && !form.occasionLabel.trim()) {
        errs.occasionLabel = "Please enter a custom occasion label";
      }
    }

    if (s === 1) {
      if (!form.occasionDate) errs.occasionDate = "Please select a date";
      if (form.years < 1 || form.years > 25) errs.years = "Years must be between 1 and 25";
    }

    if (s === 2) {
      if (!form.tier) errs.tier = "Please select a gift tier";
    }

    if (s === 3) {
      if (!form.addressLine1.trim()) errs.addressLine1 = "Address is required";
      if (!form.city.trim()) errs.city = "City is required";
      if (!form.state) errs.state = "State is required";
      if (!form.postalCode.trim()) errs.postalCode = "ZIP code is required";
      if (form.postalCode && !/^\d{5}(-\d{4})?$/.test(form.postalCode.trim())) {
        errs.postalCode = "Please enter a valid ZIP code";
      }
    }

    // Step 4 = About Them — no validation required (all optional)

    if (s === 5) {
      if (!isLoggedIn) {
        if (!form.email.trim()) errs.email = "Email is required";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
          errs.email = "Please enter a valid email";
        }
        if (!form.fullName.trim()) errs.fullName = "Full name is required";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 5));
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  /* ────────────────────────── Add to Cart ─────────────────────── */

  function handleAddToCart() {
    if (!validateStep(5)) return;
    if (!selectedTier) return;

    addToCart({
      recipientName: form.recipientName,
      relationship: form.relationship,
      occasionType: form.occasionType,
      occasionLabel: form.occasionLabel,
      occasionDate: form.occasionDate,
      years: form.years,
      tier: form.tier as TierId,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      country: form.country,
      recipientAge: form.recipientAge,
      recipientGender: form.recipientGender,
      interests: form.interests.join(", "),
      giftNotes: form.giftNotes,
      cardMessage: "",
      petType: form.petType,
      unitPrice: selectedTier.price,
      totalPrice: totalPrice,
    });

    setAddedToCart(true);
  }

  function handleAddAnother() {
    setForm(initialFormData);
    setStep(0);
    setErrors({});
    setSubmitError("");
    setAddedToCart(false);
  }

  /* ════════════════════════════ Render ═════════════════════════════ */

  /* ────────────────────────── Added to Cart ───────────────────── */

  if (addedToCart) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-forest/10 ring-4 ring-forest/20">
              <svg className="h-10 w-10 text-forest" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">Added to cart!</h2>
            <p className="mt-3 text-warm-gray">
              Gift for <span className="font-semibold text-navy">{form.recipientName}</span> has been added.
              Would you like to add another gift or go to checkout?
            </p>
            <p className="mt-2 text-sm text-warm-gray-light">
              You have <span className="font-semibold text-navy">{cartCount}</span> {cartCount === 1 ? "item" : "items"} in your cart.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleAddAnother}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Add Another Gift
              </button>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-forest-light"
              >
                View Cart ({cartCount})
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        {/* ──────────────── Cart Badge ──────────────── */}
        {cartCount > 0 && (
          <div className="mb-4 flex justify-end">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-lg border border-cream-dark bg-white px-4 py-2 text-sm font-medium text-navy shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-navy">
                <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 14.25h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
              </svg>
              Cart
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
                {cartCount}
              </span>
            </Link>
          </div>
        )}

        {/* ──────────────── Progress Bar ──────────────── */}
        <nav aria-label="Progress" className="mb-10">
          <ol className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const isCompleted = i < step;
              const isCurrent = i === step;
              return (
                <li key={label} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {/* Left connector line */}
                    {i > 0 && (
                      <div
                        className={`h-0.5 flex-1 transition-colors ${
                          i <= step ? "bg-gold" : "bg-cream-dark"
                        }`}
                      />
                    )}

                    {/* Step circle */}
                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        isCompleted
                          ? "bg-gold text-white shadow-md"
                          : isCurrent
                            ? "bg-navy text-cream shadow-md ring-4 ring-navy/20"
                            : "border-2 border-cream-dark bg-white text-warm-gray-light"
                      }`}
                    >
                      {isCompleted ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>

                    {/* Right connector line */}
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 transition-colors ${
                          i < step ? "bg-gold" : "bg-cream-dark"
                        }`}
                      />
                    )}
                  </div>

                  {/* Label — hidden on mobile */}
                  <span
                    className={`mt-2 hidden text-xs font-medium sm:block ${
                      isCurrent
                        ? "text-navy"
                        : isCompleted
                          ? "text-gold-dark"
                          : "text-warm-gray-light"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ──────────────── Step Content ──────────────── */}
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          {step === 0 && <StepRecipient form={form} errors={errors} update={update} />}
          {step === 1 && <StepOccasion form={form} errors={errors} update={update} currentYear={currentYear} />}
          {step === 2 && <StepTier form={form} errors={errors} update={update} totalPrice={totalPrice} />}
          {step === 3 && <StepAddress form={form} errors={errors} update={update} />}
          {step === 4 && <StepAboutThem form={form} update={update} />}
          {step === 5 && (
            <StepReview
              form={form}
              errors={errors}
              update={update}
              selectedTier={selectedTier}
              totalPrice={totalPrice}
              currentYear={currentYear}
              isLoggedIn={isLoggedIn}
              userEmail={userEmail}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={handleAddToCart}
            />
          )}

          {/* ──────────────── Navigation Buttons ──────────────── */}
          <div className="mt-8 flex items-center justify-between border-t border-cream-dark pt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-cream shadow-md transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              /* Submit button is inside StepReview */
              <div />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shared UI Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-600">{message}</p>;
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-navy">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

const selectClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none";

/* ═══════════════════════════════════════════════════════════════════════════
   Step 1 — Recipient
   ═══════════════════════════════════════════════════════════════════════════ */

interface StepProps {
  form: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  update: (field: keyof FormData, value: string | number | string[]) => void;
}

function StepRecipient({ form, errors, update }: StepProps) {
  const isPet = form.relationship === "My Pet / Fur Baby";

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy sm:text-3xl">
        Who&rsquo;s the lucky recipient?
      </h2>
      <p className="mt-2 text-warm-gray">
        Tell us about the {isPet ? "pet" : "person"} you want to surprise with years of thoughtful gifts.
      </p>

      <div className="mt-8 space-y-5">
        {/* Recipient Name */}
        <div>
          <Label htmlFor="recipientName" required>
            {isPet ? "Your pet\u2019s name" : "Recipient\u2019s name"}
          </Label>
          <input
            id="recipientName"
            type="text"
            placeholder={isPet ? "e.g. Buddy" : "e.g. Sarah Johnson"}
            value={form.recipientName}
            onChange={(e) => update("recipientName", e.target.value)}
            className={inputClass}
          />
          <FieldError message={errors.recipientName} />
        </div>

        {/* Relationship */}
        <div>
          <Label htmlFor="relationship" required>Your relationship to them</Label>
          <div className="relative">
            <select
              id="relationship"
              value={form.relationship}
              onChange={(e) => update("relationship", e.target.value)}
              className={selectClass}
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDownIcon />
          </div>
          <FieldError message={errors.relationship} />
        </div>

        {/* Pet Type (shown when relationship is pet) */}
        {isPet && (
          <div>
            <Label htmlFor="petType" required>What type of pet?</Label>
            <div className="relative">
              <select
                id="petType"
                value={form.petType}
                onChange={(e) => update("petType", e.target.value)}
                className={selectClass}
              >
                <option value="">Select pet type...</option>
                {PET_TYPE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
          </div>
        )}

        {/* Occasion Type */}
        <div>
          <Label htmlFor="occasionType" required>Occasion type</Label>
          <div className="relative">
            <select
              id="occasionType"
              value={form.occasionType}
              onChange={(e) => update("occasionType", e.target.value)}
              className={selectClass}
            >
              <option value="">Select occasion...</option>
              {OCCASION_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDownIcon />
          </div>
          <FieldError message={errors.occasionType} />
        </div>

        {/* Custom Occasion Label */}
        {form.occasionType === "custom" && (
          <div>
            <Label htmlFor="occasionLabel" required>Custom occasion name</Label>
            <input
              id="occasionLabel"
              type="text"
              placeholder="e.g. First Day of School"
              value={form.occasionLabel}
              onChange={(e) => update("occasionLabel", e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.occasionLabel} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 2 — Occasion Date & Years
   ═══════════════════════════════════════════════════════════════════════════ */

function StepOccasion({
  form,
  errors,
  update,
  currentYear,
}: StepProps & { currentYear: number }) {
  const isBirthday = form.occasionType === "birthday";
  const [untilEighteen, setUntilEighteen] = useState(false);

  function handleUntilEighteenToggle(checked: boolean) {
    setUntilEighteen(checked);
    if (checked && form.occasionDate) {
      // Calculate years until they turn 18 based on the occasion date year
      // We assume the occasion date year indicates the child's birth year or current year
      // Since we only have month/day, calculate from the current year
      const yearsUntil18 = 18;
      update("years", Math.min(Math.max(yearsUntil18, 1), 25));
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy sm:text-3xl">
        When is the occasion?
      </h2>
      <p className="mt-2 text-warm-gray">
        Pick the date and how many years of gifts you&rsquo;d like to send.
      </p>

      <div className="mt-8 space-y-6">
        {/* Date Picker */}
        <div>
          <Label htmlFor="occasionDate" required>Occasion date</Label>
          <input
            id="occasionDate"
            type="date"
            value={form.occasionDate}
            onChange={(e) => update("occasionDate", e.target.value)}
            className={inputClass}
          />
          <FieldError message={errors.occasionDate} />

          {/* 2-week warning */}
          {form.occasionDate && (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const occasion = new Date(form.occasionDate + "T00:00:00");
            const diffDays = Math.ceil((occasion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 14) {
              return (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-navy">
                  <span className="font-medium">⚠️ Heads up!</span> This occasion is less than 2 weeks away. We will do our best to get your gift there in time, but delivery cannot be guaranteed for orders placed this close to the occasion date.
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Years Range Slider */}
        <div>
          <Label htmlFor="years" required>How many years of gifts?</Label>

          <div className="mt-3 text-center">
            <span className="inline-block rounded-xl bg-navy px-6 py-3 text-3xl font-extrabold text-cream tabular-nums">
              {form.years}
            </span>
            <span className="ml-2 text-lg font-medium text-warm-gray">
              {form.years === 1 ? "year" : "years"}
            </span>
          </div>

          <input
            id="years"
            type="range"
            min={1}
            max={25}
            value={form.years}
            onChange={(e) => {
              update("years", parseInt(e.target.value, 10));
              setUntilEighteen(false);
            }}
            className="mt-4 w-full cursor-pointer accent-gold"
          />
          <div className="mt-1 flex justify-between text-xs text-warm-gray-light">
            <span>1 year</span>
            <span>25 years</span>
          </div>

          <FieldError message={errors.years} />
        </div>

        {/* Until 18 toggle (birthday only) */}
        {isBirthday && (
          <div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-cream-dark bg-cream/50 p-4 transition hover:border-gold/50">
              <input
                type="checkbox"
                checked={untilEighteen}
                onChange={(e) => handleUntilEighteenToggle(e.target.checked)}
                className="h-5 w-5 rounded border-cream-dark accent-gold"
              />
              <span className="text-sm font-medium text-navy">
                Until they turn 18
              </span>
            </label>
            {untilEighteen && (
              <p className="mt-2 text-xs text-warm-gray-light">
                Plans are currently limited to up to 25 years.
              </p>
            )}
          </div>
        )}

        {/* Summary note */}
        <div className="rounded-lg bg-cream/80 p-4 text-center">
          <p className="text-sm text-warm-gray">
            That&rsquo;s{" "}
            <span className="font-bold text-navy">{form.years} {form.years === 1 ? "year" : "years"}</span>{" "}
            of joy, from{" "}
            <span className="font-bold text-navy">{currentYear}</span> to{" "}
            <span className="font-bold text-navy">{currentYear + form.years - 1}</span>!
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 3 — Gift Tier
   ═══════════════════════════════════════════════════════════════════════════ */

function StepTier({
  form,
  errors,
  update,
  totalPrice,
}: StepProps & { totalPrice: number }) {
  const selectedTier = TIERS.find((t) => t.id === form.tier);

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy sm:text-3xl">
        Choose your gift tier
      </h2>
      <p className="mt-2 text-warm-gray">
        Each tier is thoughtfully curated to delight your recipient year after year.
      </p>

      <FieldError message={errors.tier} />

      {/* Tier Grid */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const isSelected = form.tier === tier.id;
          const isPopular = "popular" in tier && tier.popular;

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => update("tier", tier.id)}
              className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
                isSelected
                  ? "border-gold bg-white shadow-lg ring-2 ring-gold/30"
                  : "border-cream-dark bg-white hover:border-gold/40 hover:shadow-md"
              }`}
            >
              {/* Popular badge */}
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                  Most Popular
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <h3 className="text-base font-bold text-navy sm:text-lg">{tier.name}</h3>

              <p className="mt-1">
                <span className="text-2xl font-extrabold text-navy sm:text-3xl">${tier.price}</span>
                <span className="text-xs text-warm-gray">/yr</span>
              </p>

              <p className="mt-2 text-xs leading-relaxed text-warm-gray sm:text-sm">
                {tier.description}
              </p>

              <ul className="mt-3 flex-1 space-y-1.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-xs text-warm-gray">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3 w-3 shrink-0 text-forest">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Total calculation */}
      {selectedTier && (
        <div className="mt-6 rounded-lg bg-navy/5 p-4 text-center">
          <p className="text-sm text-warm-gray">
            <span className="font-bold text-navy">${selectedTier.price}/yr</span>
            {" "}&times;{" "}
            <span className="font-bold text-navy">{form.years} {form.years === 1 ? "year" : "years"}</span>
            {" "}={" "}
            <span className="text-lg font-extrabold text-forest">${totalPrice.toLocaleString()} total</span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 5 — About Them (Recipient Profile)
   ═══════════════════════════════════════════════════════════════════════════ */

const INTEREST_OPTIONS = [
  { emoji: "\uD83C\uDFAE", label: "Gaming" },
  { emoji: "\uD83D\uDCDA", label: "Reading" },
  { emoji: "\uD83C\uDFB5", label: "Music" },
  { emoji: "\uD83C\uDF73", label: "Cooking" },
  { emoji: "\uD83C\uDFC3", label: "Sports" },
  { emoji: "\uD83C\uDFA8", label: "Art & Crafts" },
  { emoji: "\uD83C\uDF3F", label: "Outdoors" },
  { emoji: "\u2708\uFE0F", label: "Travel" },
  { emoji: "\uD83D\uDC85", label: "Fashion" },
  { emoji: "\uD83D\uDC3E", label: "Animals/Pets" },
  { emoji: "\uD83D\uDD27", label: "Tech" },
  { emoji: "\uD83E\uDDD8", label: "Wellness" },
] as const;

const GENDER_OPTIONS = ["Female", "Male", "Non-binary"] as const;

function StepAboutThem({
  form,
  update,
}: {
  form: FormData;
  update: (field: keyof FormData, value: string | number | string[]) => void;
}) {
  function toggleInterest(interest: string) {
    const current = form.interests;
    const next = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    update("interests", next);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy sm:text-3xl">
        Help us pick the perfect gift
      </h2>
      <p className="mt-2 text-warm-gray">
        The more you tell us, the more personal the gift.
      </p>

      <div className="mt-8 space-y-6">
        {/* Age */}
        <div>
          <label htmlFor="recipientAge" className="mb-1.5 block text-sm font-medium text-navy">
            How old will they be? <span className="text-warm-gray-light font-normal">Optional</span>
          </label>
          <input
            id="recipientAge"
            type="text"
            placeholder="e.g. 30"
            value={form.recipientAge}
            onChange={(e) => update("recipientAge", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Gender */}
        <div>
          <p className="mb-2 text-sm font-medium text-navy">
            Gender <span className="text-warm-gray-light font-normal">Optional</span>
          </p>
          <div className="flex gap-3">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => update("recipientGender", form.recipientGender === g ? "" : g)}
                className={`rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition ${
                  form.recipientGender === g
                    ? "border-gold bg-gold/10 text-navy shadow-sm"
                    : "border-cream-dark bg-white text-warm-gray hover:border-gold/40"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <p className="mb-2 text-sm font-medium text-navy">
            Interests <span className="text-warm-gray-light font-normal">Optional — select all that apply</span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INTEREST_OPTIONS.map(({ emoji, label }) => {
              const selected = form.interests.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleInterest(label)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition ${
                    selected
                      ? "border-gold bg-gold/10 text-navy shadow-sm"
                      : "border-cream-dark bg-white text-warm-gray hover:border-gold/40"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gift notes */}
        <div>
          <label htmlFor="giftNotes" className="mb-1.5 block text-sm font-medium text-navy">
            Anything else we should know? <span className="text-warm-gray-light font-normal">Optional</span>
          </label>
          <textarea
            id="giftNotes"
            rows={3}
            placeholder="e.g. She loves purple. He is allergic to nuts. They prefer eco-friendly products."
            value={form.giftNotes}
            onChange={(e) => update("giftNotes", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 4 — Delivery Address
   ═══════════════════════════════════════════════════════════════════════════ */

function StepAddress({ form, errors, update }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy sm:text-3xl">
        Where should we send the gifts?
      </h2>
      <p className="mt-2 text-warm-gray">
        We&rsquo;ll deliver to this address every year. You can update it anytime from your dashboard.
      </p>

      <div className="mt-8 space-y-5">
        {/* Address Line 1 */}
        <div>
          <Label htmlFor="addressLine1" required>Address Line 1</Label>
          <input
            id="addressLine1"
            type="text"
            placeholder="123 Main Street"
            value={form.addressLine1}
            onChange={(e) => update("addressLine1", e.target.value)}
            className={inputClass}
          />
          <FieldError message={errors.addressLine1} />
        </div>

        {/* Address Line 2 */}
        <div>
          <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
          <input
            id="addressLine2"
            type="text"
            placeholder="Apt 4B, Suite 200, etc."
            value={form.addressLine2}
            onChange={(e) => update("addressLine2", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* City & State */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="city" required>City</Label>
            <input
              id="city"
              type="text"
              placeholder="New York"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.city} />
          </div>

          <div>
            <Label htmlFor="state" required>State</Label>
            <div className="relative">
              <select
                id="state"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className={selectClass}
              >
                <option value="">Select state...</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{US_STATE_NAMES[s]}</option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
            <FieldError message={errors.state} />
          </div>
        </div>

        {/* ZIP & Country */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="postalCode" required>ZIP Code</Label>
            <input
              id="postalCode"
              type="text"
              placeholder="10001"
              value={form.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              className={inputClass}
              maxLength={10}
            />
            <FieldError message={errors.postalCode} />
          </div>

          <div>
            <Label htmlFor="country" required>Country</Label>
            <div className="relative">
              <select
                id="country"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className={selectClass}
              >
                <option value="US">United States</option>
              </select>
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        <p className="mt-5 rounded-lg bg-cream/80 px-4 py-3 text-xs leading-relaxed text-warm-gray">
          📦 We currently deliver to the continental United States only. Alaska, Hawaii, and international addresses are not supported at this time.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 5 — Review & Checkout
   ═══════════════════════════════════════════════════════════════════════════ */

function StepReview({
  form,
  errors,
  update,
  selectedTier,
  totalPrice,
  currentYear,
  isLoggedIn,
  userEmail,
  isSubmitting,
  submitError,
  onSubmit,
}: StepProps & {
  selectedTier: (typeof TIERS)[number] | undefined;
  totalPrice: number;
  currentYear: number;
  isLoggedIn: boolean;
  userEmail: string | null;
  isSubmitting: boolean;
  submitError: string;
  onSubmit: () => void;
}) {
  const occasionLabel =
    form.occasionType === "custom"
      ? form.occasionLabel
      : OCCASION_TYPES.find((o) => o.value === form.occasionType)?.label ?? "";

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy sm:text-3xl">
        Review your gift plan
      </h2>
      <p className="mt-2 text-warm-gray">
        Everything look good? Let&rsquo;s make it happen.
      </p>

      {/* Summary card */}
      <div className="mt-8 space-y-4 rounded-xl border border-cream-dark bg-cream/50 p-5 sm:p-6">
        <SummaryRow label="Recipient" value={form.recipientName} />
        <SummaryRow label="Relationship" value={form.relationship} />
        <SummaryRow label="Occasion" value={occasionLabel} />
        <SummaryRow label="Date" value={form.occasionDate ? new Date(form.occasionDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : ""} />
        <SummaryRow label="Gift tier" value={selectedTier?.name ?? ""} />
        <SummaryRow
          label="Duration"
          value={`${form.years} ${form.years === 1 ? "year" : "years"} (${currentYear}\u2013${currentYear + form.years - 1})`}
        />
        <SummaryRow
          label="Delivery address"
          value={`${form.addressLine1}${form.addressLine2 ? ", " + form.addressLine2 : ""}, ${form.city}, ${form.state} ${form.postalCode}`}
        />

        <div className="border-t border-cream-dark pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-warm-gray">Total</span>
            <span className="text-2xl font-extrabold text-forest">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
          <p className="mt-0.5 text-right text-xs text-warm-gray-light">
            ${selectedTier?.price}/yr &times; {form.years} {form.years === 1 ? "year" : "years"}
          </p>
        </div>
      </div>

      {/* Your info section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-navy">Your info</h3>

        {isLoggedIn ? (
          <p className="mt-2 text-sm text-warm-gray">
            Logged in as <span className="font-medium text-navy">{userEmail}</span>
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="text-sm text-warm-gray">
              We&rsquo;ll create an account for you so you can manage your gift plans.
            </p>

            <div>
              <Label htmlFor="fullName" required>Full name</Label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className={inputClass}
              />
              <FieldError message={errors.fullName} />
            </div>

            <div>
              <Label htmlFor="email" required>Email address</Label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
              <FieldError message={errors.email} />
            </div>
          </div>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Pre-delivery check-in info */}
      <div className="mt-6 rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-navy">
        📬 Before each delivery, we will contact you to confirm everything looks good. Update your address or preferences anytime.
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-4 w-full rounded-lg bg-forest py-4 text-center text-lg font-bold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          `Send This Gift \uD83C\uDF81 \u2014 $${totalPrice.toLocaleString()}`
        )}
      </button>

      {/* Trust badges */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-warm-gray-light">
        <span className="inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
          Secure payment via Stripe
        </span>
        <span className="inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
          Cancel anytime
        </span>
        <span className="inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.564 2 12.163 2 7c0-.54.035-1.07.104-1.59a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.749ZM14.13 7.691a.75.75 0 0 0-1.04-1.08L9.25 10.233 7.91 8.827a.75.75 0 1 0-1.1 1.02l1.9 2.05a.75.75 0 0 0 1.07.03l4.35-4.236Z" clipRule="evenodd" />
          </svg>
          100% satisfaction guarantee
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Small Reusable Pieces
   ═══════════════════════════════════════════════════════════════════════════ */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-warm-gray">{label}</span>
      <span className="text-right text-sm font-medium text-navy">{value}</span>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray-light"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
