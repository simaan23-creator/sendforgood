"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TIERS, OCCASION_TYPES } from "@/lib/constants";
import type { TierId } from "@/lib/constants";

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

const RELATIONSHIP_OPTIONS = [
  "Client",
  "Employee",
  "Partner",
  "Vendor",
  "Other",
];

const INDUSTRY_OPTIONS = [
  { value: "realtor", label: "Real Estate" },
  { value: "financial", label: "Financial Services" },
  { value: "healthcare", label: "Healthcare" },
  { value: "hr", label: "HR / Corporate" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
] as const;

/* ──────────────────────────── Types ───────────────────────────── */

interface AccountForm {
  fullName: string;
  email: string;
  companyName: string;
  industry: string;
  companyWebsite: string;
}

interface RecipientEntry {
  id: string;
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
  cardMessage: string;
  giftNotes: string;
}

const STEP_LABELS = ["Account", "Recipients", "Review & Pay"];

function emptyRecipient(): RecipientEntry {
  return {
    id: crypto.randomUUID(),
    recipientName: "",
    relationship: "",
    occasionType: "",
    occasionLabel: "",
    occasionDate: "",
    years: 3,
    tier: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    cardMessage: "",
    giftNotes: "",
  };
}

/* ════════════════════════════ CSV Parsing ═════════════════════════════ */

const TIER_MAP: Record<string, TierId> = {
  starter: "starter",
  classic: "classic",
  premium: "premium",
  deluxe: "deluxe",
  legacy: "legacy",
};

const OCCASION_MAP: Record<string, string> = {
  birthday: "birthday",
  graduation: "graduation",
  holiday: "holiday",
  anniversary: "anniversary",
  just_because: "just_because",
  "just because": "just_because",
  custom: "custom",
};

function parseCSV(text: string): RecipientEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Skip header
  const rows = lines.slice(1);
  return rows.map((row) => {
    // Handle quoted fields
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of row) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cols.push(current.trim());

    const [
      name = "",
      relationship = "",
      occasionType = "",
      occasionDate = "",
      years = "3",
      tier = "",
      address1 = "",
      address2 = "",
      city = "",
      state = "",
      zip = "",
      cardMessage = "",
      giftNotes = "",
    ] = cols;

    return {
      id: crypto.randomUUID(),
      recipientName: name,
      relationship,
      occasionType: OCCASION_MAP[occasionType.toLowerCase()] || occasionType,
      occasionLabel: "",
      occasionDate,
      years: Math.max(1, Math.min(25, parseInt(years) || 3)),
      tier: (TIER_MAP[tier.toLowerCase()] || "") as TierId | "",
      addressLine1: address1,
      addressLine2: address2,
      city,
      state: state.toUpperCase(),
      postalCode: zip,
      cardMessage,
      giftNotes,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function BusinessSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [account, setAccount] = useState<AccountForm>({
    fullName: "",
    email: "",
    companyName: "",
    industry: "",
    companyWebsite: "",
  });
  const [accountErrors, setAccountErrors] = useState<Partial<Record<keyof AccountForm, string>>>({});

  const [recipients, setRecipients] = useState<RecipientEntry[]>([emptyRecipient()]);
  const [recipientErrors, setRecipientErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const [csvPreview, setCsvPreview] = useState<RecipientEntry[] | null>(null);
  const [csvError, setCsvError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        setAccount((prev) => ({
          ...prev,
          email: data.user!.email ?? "",
          fullName: data.user!.user_metadata?.full_name ?? "",
        }));
      }
    });
  }, []);

  /* ────────────── Helpers ────────────── */

  const updateAccount = (field: keyof AccountForm, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }));
    setAccountErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateRecipient = (id: string, field: keyof RecipientEntry, value: string | number) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    setRecipientErrors((prev) => {
      const next = { ...prev };
      delete next[`${id}.${field}`];
      return next;
    });
  };

  const addRecipient = () => {
    setRecipients((prev) => [...prev, emptyRecipient()]);
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  /* ────────────── Validation ────────────── */

  function validateAccount(): boolean {
    const errs: Partial<Record<keyof AccountForm, string>> = {};
    if (!account.fullName.trim()) errs.fullName = "Full name is required";
    if (!account.email.trim()) errs.email = "Email is required";
    if (account.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) {
      errs.email = "Please enter a valid email";
    }
    if (!account.companyName.trim()) errs.companyName = "Company name is required";
    if (!account.industry) errs.industry = "Please select an industry";
    setAccountErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateRecipients(): boolean {
    const errs: Record<string, string> = {};
    if (recipients.length === 0) {
      errs.general = "Add at least one recipient";
      setRecipientErrors(errs);
      return false;
    }

    recipients.forEach((r) => {
      if (!r.recipientName.trim()) errs[`${r.id}.recipientName`] = "Name is required";
      if (!r.occasionType) errs[`${r.id}.occasionType`] = "Occasion is required";
      if (!r.occasionDate) errs[`${r.id}.occasionDate`] = "Date is required";
      if (!r.tier) errs[`${r.id}.tier`] = "Tier is required";
      if (!r.addressLine1.trim()) errs[`${r.id}.addressLine1`] = "Address is required";
      if (!r.city.trim()) errs[`${r.id}.city`] = "City is required";
      if (!r.state) errs[`${r.id}.state`] = "State is required";
      if (!r.postalCode.trim()) errs[`${r.id}.postalCode`] = "ZIP is required";
      if (r.postalCode && !/^\d{5}(-\d{4})?$/.test(r.postalCode.trim())) {
        errs[`${r.id}.postalCode`] = "Invalid ZIP";
      }
    });

    setRecipientErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 0 && validateAccount()) setStep(1);
    if (step === 1 && validateRecipients()) setStep(2);
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  /* ────────────── CSV Handling ────────────── */

  const handleCsvFile = useCallback((file: File) => {
    setCsvError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setCsvError("No valid recipients found in CSV. Check the format and try again.");
        return;
      }
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  }, []);

  const confirmCsvImport = () => {
    if (csvPreview) {
      setRecipients(csvPreview);
      setCsvPreview(null);
      setActiveTab("manual");
    }
  };

  /* ────────────── Calculate Total ────────────── */

  const totalAmount = recipients.reduce((sum, r) => {
    const tier = TIERS.find((t) => t.id === r.tier);
    return sum + (tier ? tier.price * r.years : 0);
  }, 0);

  const tierBreakdown = TIERS.reduce(
    (acc, tier) => {
      const count = recipients.filter((r) => r.tier === tier.id).length;
      if (count > 0) acc.push({ tier, count });
      return acc;
    },
    [] as { tier: (typeof TIERS)[number]; count: number }[]
  );

  /* ────────────── Checkout ────────────── */

  async function handleSubmit() {
    if (!validateRecipients()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/business/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          recipients: recipients.map((r) => ({
            recipientName: r.recipientName,
            relationship: r.relationship,
            occasionType: r.occasionType,
            occasionLabel: r.occasionLabel,
            occasionDate: r.occasionDate,
            years: r.years,
            tier: r.tier,
            addressLine1: r.addressLine1,
            addressLine2: r.addressLine2,
            city: r.city,
            state: r.state,
            postalCode: r.postalCode,
            cardMessage: r.cardMessage,
            giftNotes: r.giftNotes,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ════════════════════════════ Render ═════════════════════════════ */

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* ──────────────── Progress Bar ──────────────── */}
        <nav aria-label="Progress" className="mb-10">
          <ol className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const isCompleted = i < step;
              const isCurrent = i === step;
              return (
                <li key={label} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <div
                        className={`h-0.5 flex-1 transition-colors ${
                          i <= step ? "bg-gold" : "bg-cream-dark"
                        }`}
                      />
                    )}
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 transition-colors ${
                          i < step ? "bg-gold" : "bg-cream-dark"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
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
          {/* Step 0: Account Details */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-navy sm:text-3xl">
                Set up your business account
              </h2>
              <p className="mt-2 text-warm-gray">
                Tell us about your company. We&rsquo;ll personalize every gift with your brand.
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="fullName" required>Full name</Label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    value={account.fullName}
                    onChange={(e) => updateAccount("fullName", e.target.value)}
                    className={inputClass}
                  />
                  <FieldError message={accountErrors.fullName} />
                </div>

                <div>
                  <Label htmlFor="email" required>Email address</Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="jane@company.com"
                    value={account.email}
                    onChange={(e) => updateAccount("email", e.target.value)}
                    className={inputClass}
                    disabled={isLoggedIn}
                  />
                  <FieldError message={accountErrors.email} />
                </div>

                <div>
                  <Label htmlFor="companyName" required>Company name</Label>
                  <input
                    id="companyName"
                    type="text"
                    placeholder="Acme Real Estate"
                    value={account.companyName}
                    onChange={(e) => updateAccount("companyName", e.target.value)}
                    className={inputClass}
                  />
                  <FieldError message={accountErrors.companyName} />
                </div>

                <div>
                  <Label htmlFor="industry" required>Industry</Label>
                  <div className="relative">
                    <select
                      id="industry"
                      value={account.industry}
                      onChange={(e) => updateAccount("industry", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                  <FieldError message={accountErrors.industry} />
                </div>

                <div>
                  <Label htmlFor="companyWebsite">Company website (optional)</Label>
                  <input
                    id="companyWebsite"
                    type="url"
                    placeholder="https://company.com"
                    value={account.companyWebsite}
                    onChange={(e) => updateAccount("companyWebsite", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Recipients */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-navy sm:text-3xl">
                Add your recipients
              </h2>
              <p className="mt-2 text-warm-gray">
                Add them one by one or upload a CSV file.
              </p>

              {/* Tabs */}
              <div className="mt-6 flex rounded-lg border border-cream-dark overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === "manual"
                      ? "bg-navy text-cream"
                      : "bg-white text-navy hover:bg-cream-dark/50"
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("csv")}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === "csv"
                      ? "bg-navy text-cream"
                      : "bg-white text-navy hover:bg-cream-dark/50"
                  }`}
                >
                  CSV Upload
                </button>
              </div>

              {recipientErrors.general && (
                <p className="mt-3 text-sm text-red-600">{recipientErrors.general}</p>
              )}

              {/* Manual Entry Tab */}
              {activeTab === "manual" && (
                <div className="mt-6 space-y-6">
                  {recipients.map((r, idx) => (
                    <RecipientForm
                      key={r.id}
                      recipient={r}
                      index={idx}
                      errors={recipientErrors}
                      update={updateRecipient}
                      canRemove={recipients.length > 1}
                      onRemove={() => removeRecipient(r.id)}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={addRecipient}
                    className="w-full rounded-lg border-2 border-dashed border-cream-dark py-3 text-sm font-semibold text-navy hover:border-gold hover:bg-gold/5 transition"
                  >
                    + Add Another Recipient
                  </button>
                </div>
              )}

              {/* CSV Upload Tab */}
              {activeTab === "csv" && (
                <div className="mt-6">
                  <div
                    className="rounded-xl border-2 border-dashed border-cream-dark bg-cream/30 p-8 text-center hover:border-gold/50 transition cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file && file.name.endsWith(".csv")) handleCsvFile(file);
                      else setCsvError("Please upload a .csv file");
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".csv";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleCsvFile(file);
                      };
                      input.click();
                    }}
                  >
                    <svg className="mx-auto h-12 w-12 text-warm-gray-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="mt-3 text-sm font-medium text-navy">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <p className="mt-1 text-xs text-warm-gray-light">
                      .csv files only
                    </p>
                  </div>

                  <a
                    href="/business-recipients-template.csv"
                    download
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-dark underline underline-offset-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download CSV template
                  </a>

                  <div className="mt-4 rounded-lg bg-cream/50 p-4">
                    <p className="text-xs font-semibold text-navy mb-2">Expected CSV columns:</p>
                    <p className="text-xs text-warm-gray font-mono">
                      Name, Relationship, OccasionType, OccasionDate, Years, Tier, Address1, Address2, City, State, ZIP, CardMessage, GiftNotes
                    </p>
                  </div>

                  {csvError && (
                    <p className="mt-3 text-sm text-red-600">{csvError}</p>
                  )}

                  {/* CSV Preview */}
                  {csvPreview && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-navy mb-3">
                        Preview ({csvPreview.length} recipients found)
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-cream-dark">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-cream-dark/30">
                              <th className="px-3 py-2 text-left font-medium text-navy">Name</th>
                              <th className="px-3 py-2 text-left font-medium text-navy">Occasion</th>
                              <th className="px-3 py-2 text-left font-medium text-navy">Date</th>
                              <th className="px-3 py-2 text-left font-medium text-navy">Tier</th>
                              <th className="px-3 py-2 text-left font-medium text-navy">Years</th>
                              <th className="px-3 py-2 text-left font-medium text-navy">City, State</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((r) => (
                              <tr key={r.id} className="border-t border-cream-dark">
                                <td className="px-3 py-2 text-navy">{r.recipientName}</td>
                                <td className="px-3 py-2 text-warm-gray">{r.occasionType}</td>
                                <td className="px-3 py-2 text-warm-gray">{r.occasionDate}</td>
                                <td className="px-3 py-2 text-warm-gray capitalize">{r.tier}</td>
                                <td className="px-3 py-2 text-warm-gray">{r.years}</td>
                                <td className="px-3 py-2 text-warm-gray">{r.city}, {r.state}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={confirmCsvImport}
                          className="rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-cream shadow-sm hover:bg-forest-light transition"
                        >
                          Confirm & Import
                        </button>
                        <button
                          type="button"
                          onClick={() => setCsvPreview(null)}
                          className="rounded-lg border-2 border-navy/20 px-6 py-2.5 text-sm font-semibold text-navy hover:border-navy transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review & Pay */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-navy sm:text-3xl">
                Review your business order
              </h2>
              <p className="mt-2 text-warm-gray">
                Everything look good? We&rsquo;ll handle the rest from here.
              </p>

              {/* Company summary */}
              <div className="mt-8 rounded-xl border border-cream-dark bg-cream/50 p-5 sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4">
                  Company
                </h3>
                <SummaryRow label="Company" value={account.companyName} />
                <SummaryRow label="Contact" value={account.fullName} />
                <SummaryRow label="Email" value={account.email} />
                <SummaryRow
                  label="Industry"
                  value={INDUSTRY_OPTIONS.find((o) => o.value === account.industry)?.label ?? ""}
                />
              </div>

              {/* Recipients summary */}
              <div className="mt-6 rounded-xl border border-cream-dark bg-cream/50 p-5 sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4">
                  {recipients.length} Recipient{recipients.length !== 1 ? "s" : ""}
                </h3>
                <div className="space-y-3">
                  {recipients.map((r) => {
                    const tier = TIERS.find((t) => t.id === r.tier);
                    return (
                      <div key={r.id} className="flex items-center justify-between text-sm border-b border-cream-dark pb-3 last:border-0 last:pb-0">
                        <div>
                          <span className="font-medium text-navy">{r.recipientName}</span>
                          <span className="text-warm-gray ml-2">
                            {r.occasionType} &middot; {tier?.name ?? ""}
                          </span>
                        </div>
                        <span className="text-navy font-medium">
                          ${tier ? (tier.price * r.years).toLocaleString() : 0}
                          <span className="text-warm-gray-light text-xs ml-1">
                            ({r.years}yr)
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tier breakdown */}
              {tierBreakdown.length > 0 && (
                <div className="mt-6 rounded-xl border border-cream-dark bg-cream/50 p-5 sm:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4">
                    Cost Breakdown
                  </h3>
                  {tierBreakdown.map(({ tier, count }) => (
                    <div key={tier.id} className="flex justify-between text-sm mb-2">
                      <span className="text-warm-gray">
                        {tier.name} &times; {count} recipient{count !== 1 ? "s" : ""}
                      </span>
                      <span className="font-medium text-navy">${tier.price}/yr each</span>
                    </div>
                  ))}
                  <div className="border-t border-cream-dark pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-navy">Total</span>
                      <span className="text-2xl font-extrabold text-forest">
                        ${totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-6 w-full rounded-lg bg-forest py-4 text-center text-lg font-bold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
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
                  `Place Order \u2014 $${totalAmount.toLocaleString()}`
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
                  One invoice for all recipients
                </span>
              </div>
            </div>
          )}

          {/* ──────────────── Navigation Buttons ──────────────── */}
          {step < 2 && (
            <div className="mt-8 flex items-center justify-between border-t border-cream-dark pt-6">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                  </svg>
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-cream shadow-md transition hover:bg-forest-light"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 flex items-center justify-between border-t border-cream-dark pt-6">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              <div />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Recipient Form Component
   ═══════════════════════════════════════════════════════════════════════════ */

function RecipientForm({
  recipient,
  index,
  errors,
  update,
  canRemove,
  onRemove,
}: {
  recipient: RecipientEntry;
  index: number;
  errors: Record<string, string>;
  update: (id: string, field: keyof RecipientEntry, value: string | number) => void;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const r = recipient;
  const e = (field: string) => errors[`${r.id}.${field}`];
  const selectedTier = TIERS.find((t) => t.id === r.tier);

  return (
    <div className="rounded-xl border border-cream-dark bg-cream/30 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-navy">
          Recipient {index + 1}
          {r.recipientName && (
            <span className="text-warm-gray font-normal ml-2">&mdash; {r.recipientName}</span>
          )}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Row 1: Name, Relationship */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`name-${r.id}`} required>Recipient name</Label>
            <input
              id={`name-${r.id}`}
              type="text"
              placeholder="Jane Smith"
              value={r.recipientName}
              onChange={(ev) => update(r.id, "recipientName", ev.target.value)}
              className={inputClass}
            />
            <FieldError message={e("recipientName")} />
          </div>
          <div>
            <Label htmlFor={`rel-${r.id}`}>Relationship</Label>
            <div className="relative">
              <select
                id={`rel-${r.id}`}
                value={r.relationship}
                onChange={(ev) => update(r.id, "relationship", ev.target.value)}
                className={selectClass}
              >
                <option value="">Select...</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {/* Row 2: Occasion, Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`occ-${r.id}`} required>Occasion type</Label>
            <div className="relative">
              <select
                id={`occ-${r.id}`}
                value={r.occasionType}
                onChange={(ev) => update(r.id, "occasionType", ev.target.value)}
                className={selectClass}
              >
                <option value="">Select...</option>
                {OCCASION_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
            <FieldError message={e("occasionType")} />
          </div>
          <div>
            <Label htmlFor={`date-${r.id}`} required>Occasion date</Label>
            <input
              id={`date-${r.id}`}
              type="date"
              value={r.occasionDate}
              onChange={(ev) => update(r.id, "occasionDate", ev.target.value)}
              className={inputClass}
            />
            <FieldError message={e("occasionDate")} />
          </div>
        </div>

        {/* Custom occasion label */}
        {r.occasionType === "custom" && (
          <div>
            <Label htmlFor={`occLabel-${r.id}`} required>Custom occasion name</Label>
            <input
              id={`occLabel-${r.id}`}
              type="text"
              placeholder="e.g. Work Anniversary"
              value={r.occasionLabel}
              onChange={(ev) => update(r.id, "occasionLabel", ev.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {/* Row 3: Tier, Years */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`tier-${r.id}`} required>Gift tier</Label>
            <div className="relative">
              <select
                id={`tier-${r.id}`}
                value={r.tier}
                onChange={(ev) => update(r.id, "tier", ev.target.value)}
                className={selectClass}
              >
                <option value="">Select tier...</option>
                {TIERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — ${t.price}/yr
                  </option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
            <FieldError message={e("tier")} />
          </div>
          <div>
            <Label htmlFor={`years-${r.id}`} required>
              Years ({r.years})
            </Label>
            <input
              id={`years-${r.id}`}
              type="range"
              min={1}
              max={25}
              value={r.years}
              onChange={(ev) => update(r.id, "years", parseInt(ev.target.value))}
              className="w-full cursor-pointer accent-gold mt-2"
            />
            <div className="flex justify-between text-xs text-warm-gray-light">
              <span>1 yr</span>
              <span>25 yrs</span>
            </div>
          </div>
        </div>

        {/* Cost preview */}
        {selectedTier && (
          <div className="rounded-lg bg-navy/5 px-3 py-2 text-center text-sm">
            <span className="text-warm-gray">
              ${selectedTier.price}/yr &times; {r.years} yr ={" "}
            </span>
            <span className="font-bold text-forest">
              ${(selectedTier.price * r.years).toLocaleString()}
            </span>
          </div>
        )}

        {/* Address */}
        <div>
          <Label htmlFor={`addr1-${r.id}`} required>Address</Label>
          <input
            id={`addr1-${r.id}`}
            type="text"
            placeholder="123 Main St"
            value={r.addressLine1}
            onChange={(ev) => update(r.id, "addressLine1", ev.target.value)}
            className={inputClass}
          />
          <FieldError message={e("addressLine1")} />
        </div>
        <div>
          <Label htmlFor={`addr2-${r.id}`}>Address line 2 (optional)</Label>
          <input
            id={`addr2-${r.id}`}
            type="text"
            placeholder="Suite 200"
            value={r.addressLine2}
            onChange={(ev) => update(r.id, "addressLine2", ev.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor={`city-${r.id}`} required>City</Label>
            <input
              id={`city-${r.id}`}
              type="text"
              placeholder="Austin"
              value={r.city}
              onChange={(ev) => update(r.id, "city", ev.target.value)}
              className={inputClass}
            />
            <FieldError message={e("city")} />
          </div>
          <div>
            <Label htmlFor={`state-${r.id}`} required>State</Label>
            <div className="relative">
              <select
                id={`state-${r.id}`}
                value={r.state}
                onChange={(ev) => update(r.id, "state", ev.target.value)}
                className={selectClass}
              >
                <option value="">...</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
            <FieldError message={e("state")} />
          </div>
          <div>
            <Label htmlFor={`zip-${r.id}`} required>ZIP</Label>
            <input
              id={`zip-${r.id}`}
              type="text"
              placeholder="78701"
              value={r.postalCode}
              onChange={(ev) => update(r.id, "postalCode", ev.target.value)}
              className={inputClass}
              maxLength={10}
            />
            <FieldError message={e("postalCode")} />
          </div>
        </div>

        {/* Card message + gift notes */}
        <div>
          <Label htmlFor={`card-${r.id}`}>Card message (optional)</Label>
          <textarea
            id={`card-${r.id}`}
            rows={2}
            placeholder="Happy Birthday from our team!"
            value={r.cardMessage}
            onChange={(ev) => update(r.id, "cardMessage", ev.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor={`notes-${r.id}`}>Gift notes (optional)</Label>
          <textarea
            id={`notes-${r.id}`}
            rows={2}
            placeholder="Loves coffee and books"
            value={r.giftNotes}
            onChange={(ev) => update(r.id, "giftNotes", ev.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-2">
      <span className="shrink-0 text-sm text-warm-gray">{label}</span>
      <span className="text-right text-sm font-medium text-navy">{value}</span>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

const selectClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none";

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
