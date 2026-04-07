"use client";

import { useState, FormEvent } from "react";

const RELATIONSHIPS = [
  "Spouse/Partner",
  "Adult Child",
  "Parent",
  "Sibling",
  "Friend",
  "Attorney/Legal Representative",
  "Other",
];

export default function ExecutorAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterRelationship: "",
    accountHolderName: "",
    accountHolderEmail: "",
    reason: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.requesterName.trim() ||
      !form.requesterEmail.trim() ||
      !form.requesterRelationship ||
      !form.accountHolderName.trim() ||
      !form.accountHolderEmail.trim() ||
      !form.reason.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/executor-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit request.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-cream min-h-[80vh] px-6 py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-cream-dark bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-forest"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">
            Your request has been submitted
          </h1>
          <p className="mt-4 text-base leading-relaxed text-warm-gray">
            We have notified the account holder and will be in touch with you
            within 2 business days. Please check your email for confirmation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Request Executor Access
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-warm-gray">
            If you are a designated executor for a SendForGood account holder,
            you can request access here. We will contact both you and the
            account holder before granting access.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-2xl border border-cream-dark bg-white p-6 shadow-md sm:p-8"
        >
          <div className="space-y-5">
            {/* Your Full Name */}
            <div>
              <label
                htmlFor="requesterName"
                className="block text-sm font-semibold text-navy"
              >
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="requesterName"
                type="text"
                required
                value={form.requesterName}
                onChange={(e) => update("requesterName", e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>

            {/* Your Email */}
            <div>
              <label
                htmlFor="requesterEmail"
                className="block text-sm font-semibold text-navy"
              >
                Your Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="requesterEmail"
                type="email"
                required
                value={form.requesterEmail}
                onChange={(e) => update("requesterEmail", e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>

            {/* Relationship */}
            <div>
              <label
                htmlFor="requesterRelationship"
                className="block text-sm font-semibold text-navy"
              >
                Your Relationship to the Account Holder{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="requesterRelationship"
                required
                value={form.requesterRelationship}
                onChange={(e) =>
                  update("requesterRelationship", e.target.value)
                }
                className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40"
              >
                <option value="">Select relationship...</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Holder Name */}
            <div>
              <label
                htmlFor="accountHolderName"
                className="block text-sm font-semibold text-navy"
              >
                Account Holder&apos;s Full Name{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="accountHolderName"
                type="text"
                required
                value={form.accountHolderName}
                onChange={(e) => update("accountHolderName", e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>

            {/* Account Holder Email */}
            <div>
              <label
                htmlFor="accountHolderEmail"
                className="block text-sm font-semibold text-navy"
              >
                Account Holder&apos;s Email Address{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="accountHolderEmail"
                type="email"
                required
                value={form.accountHolderEmail}
                onChange={(e) => update("accountHolderEmail", e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40"
              />
              <p className="mt-1 text-xs text-warm-gray-light">
                This is how we find their account.
              </p>
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-semibold text-navy"
              >
                Reason for Access Request{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                required
                rows={5}
                value={form.reason}
                onChange={(e) => update("reason", e.target.value)}
                placeholder="Please explain why you need access and what has happened..."
                className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">What happens next:</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed">
              <li>
                We will immediately email the account holder to notify them of
                this request. If they respond within 7 days to deny it, your
                request will be declined.
              </li>
              <li>
                We will reach out to you within 2 business days to verify your
                identity.
              </li>
              <li>
                If we are unable to contact the account holder within 7 days,
                and your request is verified, access may be granted at our
                discretion.
              </li>
              <li>All requests are reviewed manually by our team.</li>
            </ol>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-navy px-6 py-3.5 text-base font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Access Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
