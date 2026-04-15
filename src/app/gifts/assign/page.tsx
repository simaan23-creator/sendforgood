"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/constants";

/* ─────────────────────────── Constants ─────────────────────────── */

const RELATIONSHIP_OPTIONS = [
  "Parent", "Child", "Grandchild", "Sibling",
  "Partner/Spouse", "Friend", "My Pet / Fur Baby", "Other",
];

const PET_TYPE_OPTIONS = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Other"];

const OCCASION_OPTIONS = [
  { value: "birthday", label: "Birthday" },
  { value: "graduation", label: "Graduation" },
  { value: "holiday", label: "Holiday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "pet_birthday", label: "Pet Birthday" },
  { value: "just_because", label: "Just Because" },
  { value: "custom", label: "Custom" },
];

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
];

const GENDER_OPTIONS = ["Female", "Male", "Non-binary"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const inputClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

const selectClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none";

/* ─────────────────────────── Component ─────────────────────────── */

export default function GiftAssignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creditId = searchParams.get("creditId");
  const tier = searchParams.get("tier") || "";

  const supabase = createClient();

  // Credit info
  const [creditAvailable, setCreditAvailable] = useState(0);
  const [loadingCredit, setLoadingCredit] = useState(true);

  // Step tracking
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Recipient
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPet, setIsPet] = useState(false);
  const [petType, setPetType] = useState("");

  // Step 2: Occasion
  const [occasionType, setOccasionType] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [years, setYears] = useState(1);

  // Step 3: Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Step 4: About them
  const [isProfessional, setIsProfessional] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [giftNotes, setGiftNotes] = useState("");
  const [recipientIndustry, setRecipientIndustry] = useState("");

  const tierInfo = TIERS.find((t) => t.id === tier);
  const tierName = tierInfo?.name || tier;

  // Load credit availability
  useEffect(() => {
    async function loadCredit() {
      if (!creditId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data } = await supabase
        .from("gift_credits")
        .select("quantity, quantity_used")
        .eq("id", creditId)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setCreditAvailable(data.quantity - data.quantity_used);
      } else {
        setError("Credit not found. Please go back to your dashboard.");
      }
      setLoadingCredit(false);
    }
    loadCredit();
  }, [creditId, supabase, router]);

  // Auto-detect pet from relationship
  useEffect(() => {
    if (relationship === "My Pet / Fur Baby") {
      setIsPet(true);
    }
  }, [relationship]);

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return recipientName.trim().length > 0;
      case 2:
        return occasionType.length > 0 && occasionDate.length > 0 && years >= 1 && years <= creditAvailable;
      case 3:
        return true; // address is recommended but not strictly required
      case 4:
        return true; // all optional
      default:
        return false;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/gift-credits/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditId,
          years,
          recipientName: recipientName.trim(),
          relationship: relationship || null,
          isPet,
          petType: isPet ? petType : null,
          occasionType,
          occasionDate,
          addressLine1: addressLine1.trim() || null,
          addressLine2: addressLine2.trim() || null,
          city: city.trim() || null,
          state: state || null,
          postalCode: postalCode.trim() || null,
          isProfessional,
          age: age || null,
          gender: gender || null,
          interests: interests.length > 0 ? interests.join(", ") : null,
          giftNotes: giftNotes.trim() || null,
          recipientIndustry: isProfessional ? recipientIndustry.trim() || null : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      // Success — redirect to dashboard with message
      router.push("/dashboard?assigned=true");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  // ─────────────────────── Loading / Error states ───────────────────────

  if (!creditId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-gray mb-4">No gift selected.</p>
          <Link href="/dashboard" className="text-navy underline hover:text-gold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loadingCredit) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="h-8 w-48 animate-pulse rounded bg-cream-dark" />
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-cream-dark" />
        </div>
      </div>
    );
  }

  if (creditAvailable === 0 && !error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-gray mb-4">No available gifts for this purchase.</p>
          <Link href="/dashboard" className="text-navy underline hover:text-gold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────── Step indicators ───────────────────────

  const steps = [
    { num: 1, label: "Recipient" },
    { num: 2, label: "Occasion" },
    { num: 3, label: "Address" },
    { num: 4, label: "About Them" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm text-warm-gray hover:text-navy"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-navy">Assign Gift</h1>
          <p className="mt-1 text-warm-gray">
            {tierName} tier &middot; {creditAvailable} credit{creditAvailable !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Step progress */}
        <div className="mb-8 flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <button
                type="button"
                onClick={() => { if (s.num < step) setStep(s.num); }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  s.num === step
                    ? "bg-navy text-cream"
                    : s.num < step
                      ? "bg-forest text-cream cursor-pointer"
                      : "bg-cream-dark text-warm-gray"
                }`}
              >
                {s.num < step ? "\u2713" : s.num}
              </button>
              <span className={`ml-2 hidden text-sm font-medium sm:inline ${
                s.num === step ? "text-navy" : "text-warm-gray"
              }`}>
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={`mx-3 h-0.5 w-8 sm:w-12 ${
                  s.num < step ? "bg-forest" : "bg-cream-dark"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="rounded-2xl border border-cream-dark bg-white p-6 sm:p-8">
          {/* ───────── STEP 1: Recipient ───────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-navy">Who is this gift for?</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah, Grandma, Buddy"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Your Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select...</option>
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Pet toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPet(!isPet)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isPet ? "bg-forest" : "bg-cream-dark"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isPet ? "translate-x-5" : ""
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-navy">Is this for a pet?</span>
              </div>

              {isPet && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Pet Type
                  </label>
                  <select
                    value={petType}
                    onChange={(e) => setPetType(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    {PET_TYPE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ───────── STEP 2: Occasion ───────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-navy">When and what occasion?</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Occasion Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={occasionType}
                  onChange={(e) => setOccasionType(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select...</option>
                  {OCCASION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Occasion Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={occasionDate}
                  onChange={(e) => setOccasionDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  How many years? <span className="text-red-500">*</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={Math.min(25, creditAvailable)}
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value))}
                  className="w-full accent-navy"
                />
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-navy">{years} year{years !== 1 ? "s" : ""}</span>
                  <span className="text-warm-gray">
                    Uses {years} of {creditAvailable} credits
                  </span>
                </div>
                <p className="mt-1 text-xs text-warm-gray-light">
                  Each year uses one gift credit from your balance
                </p>
              </div>
            </div>
          )}

          {/* ───────── STEP 3: Address ───────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-navy">Delivery Address</h2>
              <p className="text-sm text-warm-gray">
                Continental US shipping only. We&apos;ll ship directly to them.
              </p>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street address"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt, suite, etc."
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1.5 block text-sm font-medium text-navy">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">-</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">ZIP</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10001"
                    className={inputClass}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ───────── STEP 4: About Them ───────── */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-navy">About Them</h2>
              <p className="text-sm text-warm-gray">
                Optional — skip if you prefer our AI to decide the perfect gift.
              </p>

              {/* Personal / Professional toggle */}
              <div className="flex rounded-lg border border-cream-dark overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsProfessional(false)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                    !isProfessional
                      ? "bg-navy text-cream"
                      : "bg-cream/50 text-warm-gray hover:bg-cream-dark"
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfessional(true)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isProfessional
                      ? "bg-navy text-cream"
                      : "bg-cream/50 text-warm-gray hover:bg-cream-dark"
                  }`}
                >
                  Professional
                </button>
              </div>

              {!isProfessional ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-navy">Age</label>
                      <input
                        type="text"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 35"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-navy">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Prefer not to say</option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Interest tags */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-navy">
                      Interests
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map(({ emoji, label }) => {
                        const active = interests.includes(label);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleInterest(label)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              active
                                ? "border-navy bg-navy/10 font-medium text-navy"
                                : "border-cream-dark bg-cream/50 text-warm-gray hover:border-gold/50"
                            }`}
                          >
                            {emoji} {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      Gift Notes
                    </label>
                    <textarea
                      value={giftNotes}
                      onChange={(e) => setGiftNotes(e.target.value)}
                      placeholder="Anything else we should know? Favorite colors, allergies, etc."
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={recipientIndustry}
                      onChange={(e) => setRecipientIndustry(e.target.value)}
                      placeholder="e.g. Tech, Finance, Healthcare"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy">
                      Gift Notes
                    </label>
                    <textarea
                      value={giftNotes}
                      onChange={(e) => setGiftNotes(e.target.value)}
                      placeholder="Any context — their role, what they like, dietary restrictions, etc."
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ───────── Navigation buttons ───────── */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-lg border border-cream-dark px-5 py-2.5 text-sm font-medium text-warm-gray transition-colors hover:bg-cream-dark"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Assigning..." : `Assign ${years} Credit${years !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
