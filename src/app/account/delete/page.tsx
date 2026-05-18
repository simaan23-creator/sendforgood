"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = confirmText === "DELETE" && !submitting;

  async function handleDelete() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }
      router.push("/?deleted=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gray-900 mb-2">Delete account</h1>
      <p className="text-gray-600 mb-8">
        This permanently removes your SealTheDay account, including all
        gifts, letters, voice messages, vaults, and credits. This cannot be
        undone.
      </p>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-red-900 mb-2">What gets deleted</h2>
        <ul className="text-sm text-red-900 space-y-1 list-disc pl-5">
          <li>Your account and login</li>
          <li>All recipients, occasions, and orders you&rsquo;ve created</li>
          <li>Letters, voice messages, and memory vaults</li>
          <li>Gift credits and gift assignments</li>
          <li>Vault fees you&rsquo;ve paid (no refunds will be issued)</li>
        </ul>
        <h2 className="font-semibold text-red-900 mt-4 mb-2">What is kept</h2>
        <ul className="text-sm text-red-900 space-y-1 list-disc pl-5">
          <li>
            Anonymized payment records held by Stripe (required for accounting
            and tax compliance).
          </li>
          <li>
            Email logs held by our delivery providers for up to 30 days.
          </li>
        </ul>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        Type <span className="font-mono">DELETE</span> to confirm
      </label>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-red-200 mb-4"
        autoFocus
      />

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={!canSubmit}
          className="rounded-md bg-red-600 text-white px-6 py-3 text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Deleting..." : "Permanently delete my account"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-gray-300 text-gray-700 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
