"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const OCCASIONS = [
  "My Birthday",
  "Anniversary",
  "Graduation",
  "Retirement",
  "Going Away",
  "Just Because",
  "Other",
];

export default function CreateMemoryRequestPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("My Birthday");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [noteToRecorder, setNoteToRecorder] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [createdRequest, setCreatedRequest] = useState<{
    unique_code: string;
  } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/request/create");
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/memory-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          occasion,
          delivery_date: deliveryDate,
          note_to_recorder: noteToRecorder || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create request");
      }

      const data = await res.json();
      setCreatedRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // Minimum date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  // Success view
  if (createdRequest) {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/record/${createdRequest.unique_code}`
        : "";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-cream-dark bg-white p-8 text-center shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
              <svg
                className="h-8 w-8 text-forest"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-navy">
              Your request is ready!
            </h1>
            <p className="mt-3 text-warm-gray">
              Share this link with anyone you want to record a message for you.
            </p>

            {/* Share link */}
            <div className="mt-6 rounded-lg border border-cream-dark bg-cream p-4">
              <p className="mb-2 text-xs font-medium text-warm-gray">
                Share this link:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm text-navy"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                  }}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-cream transition hover:bg-navy-light"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* QR code */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-warm-gray">
                Or scan this QR code:
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR code for recording link"
                width={200}
                height={200}
                className="mx-auto rounded-lg"
              />
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition hover:bg-cream-dark"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/request/create"
                onClick={() => {
                  setCreatedRequest(null);
                  setTitle("");
                  setOccasion("My Birthday");
                  setDeliveryDate("");
                  setNoteToRecorder("");
                }}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy transition hover:bg-gold-light"
              >
                Create Another
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Form view
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-navy">
            Request a Memory
          </h1>
          <p className="mt-2 text-warm-gray">
            Create a link that anyone can use to record a voice message for
            you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-cream-dark bg-white p-8 shadow-md"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              What should they record?
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A birthday message for me"
              className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          {/* Occasion */}
          <div>
            <label
              htmlFor="occasion"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              Occasion
            </label>
            <select
              id="occasion"
              required
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery date */}
          <div>
            <label
              htmlFor="delivery_date"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              When should we deliver the recordings?
            </label>
            <input
              id="delivery_date"
              type="date"
              required
              min={minDate}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          {/* Note to recorder */}
          <div>
            <label
              htmlFor="note"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              Note to recorder{" "}
              <span className="font-normal text-warm-gray">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={3}
              value={noteToRecorder}
              onChange={(e) => setNoteToRecorder(e.target.value)}
              placeholder="Instructions for whoever records, e.g. Please keep it under 2 minutes"
              className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Request"}
          </button>
        </form>
      </div>
    </main>
  );
}
