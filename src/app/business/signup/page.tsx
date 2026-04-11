"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const INDUSTRY_OPTIONS = [
  { value: "realtor", label: "Real Estate" },
  { value: "financial", label: "Financial Services" },
  { value: "healthcare", label: "Healthcare" },
  { value: "hr", label: "HR / Corporate" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
] as const;

interface SignupForm {
  companyName: string;
  industry: string;
  email: string;
  fullName: string;
  companyWebsite: string;
}

export default function BusinessSignupPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/business/dashboard");
    });
  }, [router]);

  const [form, setForm] = useState<SignupForm>({
    companyName: "",
    industry: "",
    email: "",
    fullName: "",
    companyWebsite: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (field: keyof SignupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  function validate(): boolean {
    const errs: Partial<Record<keyof SignupForm, string>> = {};
    if (!form.companyName.trim()) errs.companyName = "Company name is required";
    if (!form.industry) errs.industry = "Please select an industry";
    if (!form.email.trim()) errs.email = "Email is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email";
    }
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const supabase = createClient();

      // Send magic link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: form.email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/business/dashboard`,
          data: {
            full_name: form.fullName.trim(),
            company_name: form.companyName.trim(),
            industry: form.industry,
            company_website: form.companyWebsite.trim(),
            account_type: "business",
          },
        },
      });

      if (authError) throw authError;

      setSuccess(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ════════════════════════════ Success State ═════════════════════════════ */

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14 flex items-center justify-center">
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-2xl bg-white p-8 shadow-lg sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
              <svg className="h-8 w-8 text-forest" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-navy">Check your email</h2>
            <p className="mt-3 text-warm-gray leading-relaxed">
              We sent a magic link to{" "}
              <span className="font-semibold text-navy">{form.email}</span>.
              Click it to access your business dashboard.
            </p>
            <div className="mt-6 rounded-lg bg-cream/50 border border-cream-dark p-4">
              <p className="text-sm text-warm-gray">
                Don&rsquo;t see it? Check your spam folder, or{" "}
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="text-gold font-medium hover:text-gold-dark underline underline-offset-2"
                >
                  try again
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ════════════════════════════ Form ═════════════════════════════ */

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Create your business account
          </h1>
          <p className="mt-2 text-warm-gray">
            Get set up in seconds. Add recipients and place orders from your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-navy">
                Company name <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                placeholder="Acme Real Estate"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className={inputClass}
              />
              {errors.companyName && <p className="mt-1.5 text-sm text-red-600">{errors.companyName}</p>}
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-navy">
                Industry <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="industry"
                  value={form.industry}
                  onChange={(e) => update("industry", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray-light"
                >
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </div>
              {errors.industry && <p className="mt-1.5 text-sm text-red-600">{errors.industry}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="jane@company.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-navy">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className={inputClass}
              />
              {errors.fullName && <p className="mt-1.5 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Company Website */}
            <div>
              <label htmlFor="companyWebsite" className="mb-1.5 block text-sm font-medium text-navy">
                Company website <span className="text-warm-gray-light text-xs">(optional)</span>
              </label>
              <input
                id="companyWebsite"
                type="text"
                placeholder="https://company.com"
                value={form.companyWebsite}
                onChange={(e) => update("companyWebsite", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-navy py-3 text-center text-base font-bold text-cream shadow-lg transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending magic link...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-warm-gray">
            Already have an account?{" "}
            <Link href="/auth" className="font-medium text-gold hover:text-gold-dark underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

const selectClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none";
