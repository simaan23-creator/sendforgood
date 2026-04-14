"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const OCCASIONS = [
  "My Birthday",
  "Anniversary",
  "Wedding",
  "Graduation",
  "Retirement",
  "Going Away",
  "Just Because",
  "Other",
];

interface CreditBalance {
  audioCredits: number;
  videoCredits: number;
  audioUsed: number;
  videoUsed: number;
}

export default function CreateMemoryRequestPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("My Birthday");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [noteToRecorder, setNoteToRecorder] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sealed vault fields
  const [sealedUntil, setSealedUntil] = useState("");
  const [maxAudioRecordings, setMaxAudioRecordings] = useState(0);
  const [maxVideoRecordings, setMaxVideoRecordings] = useState(0);
  const [copied, setCopied] = useState(false);

  // Credit balance
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

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

      // Fetch credit balance
      try {
        const res = await fetch("/api/vault/credits");
        if (res.ok) {
          const data = await res.json();
          setCredits(data);
        }
      } catch {
        // silently fail
      }
      setLoadingCredits(false);
    }
    checkAuth();
  }, [supabase, router]);

  const availableAudio = credits
    ? credits.audioCredits - credits.audioUsed
    : 0;
  const availableVideo = credits
    ? credits.videoCredits - credits.videoUsed
    : 0;
  const hasCredits = availableAudio > 0 || availableVideo > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasCredits) {
      setError("You need credits to create a vault. Buy credits first.");
      return;
    }

    // Validate sealed_until is at least 1 day in the future
    if (sealedUntil) {
      const sealDate = new Date(sealedUntil + "T00:00:00");
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const oneDayFromNow = new Date(now);
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      if (sealDate < oneDayFromNow) {
        setError("Seal date must be at least 1 day in the future.");
        return;
      }
    }

    // Require a delivery date when vault is not sealed
    if (!sealedUntil && !deliveryDate) {
      setError("Please select a delivery date.");
      return;
    }

    if (maxAudioRecordings <= 0 && maxVideoRecordings <= 0) {
      setError(
        "Please allocate at least one audio or video credit to this vault."
      );
      return;
    }

    if (maxAudioRecordings > availableAudio) {
      setError(
        `You only have ${availableAudio} audio credits available.`
      );
      return;
    }

    if (maxVideoRecordings > availableVideo) {
      setError(
        `You only have ${availableVideo} video credits available.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/memory-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          occasion,
          delivery_date: sealedUntil ? sealedUntil : deliveryDate,
          note_to_recorder: noteToRecorder || null,
          sealed_until: sealedUntil || null,
          max_audio_recordings: maxAudioRecordings,
          max_video_recordings: maxVideoRecordings,
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
              Your vault is ready!
            </h1>
            <p className="mt-3 text-warm-gray">
              Share this link with anyone you want to record a message for you.
            </p>

            {sealedUntil && (
              <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-3">
                <p className="text-sm text-navy">
                  &#x1F512; Sealed until{" "}
                  {new Date(sealedUntil + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </p>
              </div>
            )}

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
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-cream transition ${copied ? "bg-forest" : "bg-navy hover:bg-navy-light"}`}
                >
                  {copied ? "✓ Copied!" : "Copy"}
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
                href="/vault/my"
                className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition hover:bg-cream-dark"
              >
                View My Vaults
              </Link>
              <Link
                href="/request/create"
                onClick={() => {
                  setCreatedRequest(null);
                  setTitle("");
                  setOccasion("My Birthday");
                  setDeliveryDate("");
                  setNoteToRecorder("");
                  setSealedUntil("");
                  setMaxAudioRecordings(0);
                  setMaxVideoRecordings(0);
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
            Create a Memory Vault
          </h1>
          <p className="mt-2 text-warm-gray">
            Create a link that anyone can use to record a voice or video message
            for you.
          </p>
        </div>

        {/* Credit check */}
        {!loadingCredits && !hasCredits && (
          <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-6 text-center">
            <p className="text-navy font-medium">
              You need credits to create a vault.
            </p>
            <p className="mt-1 text-sm text-warm-gray">
              Buy audio or video credits first, then come back to create your
              vault.
            </p>
            <Link
              href="/vault/buy"
              className="mt-4 inline-flex items-center rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              Buy Credits
            </Link>
          </div>
        )}

        {/* Credit balance */}
        {!loadingCredits && hasCredits && (
          <div className="mb-6 rounded-xl border border-cream-dark bg-white p-5">
            <p className="text-sm font-medium text-navy">Available credits</p>
            <div className="mt-2 flex gap-4">
              <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-sm font-medium text-navy">
                {"\uD83C\uDFA4"} {availableAudio} audio
              </span>
              <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-sm font-medium text-navy">
                {"\uD83C\uDFA5"} {availableVideo} video
              </span>
            </div>
            <Link
              href="/vault/buy"
              className="mt-2 inline-block text-xs font-medium text-navy underline hover:text-gold"
            >
              Buy more credits
            </Link>
          </div>
        )}

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

          {/* Sealed until date */}
          <div>
            <label
              htmlFor="sealed_until"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              Seal your vault until a specific date?{" "}
              <span className="font-normal text-warm-gray">(optional)</span>
            </label>
            <input
              id="sealed_until"
              type="date"
              min={minDate}
              value={sealedUntil}
              onChange={(e) => setSealedUntil(e.target.value)}
              className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            {sealedUntil && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-gold/30 bg-gold/5 p-3">
                <p className="text-sm text-navy">
                  &#x1F512; Recordings will be delivered when your vault opens on{" "}
                  <strong>
                    {new Date(sealedUntil + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}
                  </strong>
                  . You won&#39;t be able to access them until then.
                </p>
                <button
                  type="button"
                  onClick={() => setSealedUntil("")}
                  className="ml-3 shrink-0 text-xs font-medium text-warm-gray hover:text-navy"
                >
                  Clear
                </button>
              </div>
            )}
            <p className="mt-1.5 text-xs text-warm-gray-light italic">
              Set it for your anniversary, a milestone birthday, or any day that
              matters.
            </p>
          </div>

          {/* Delivery date — only shown when vault is NOT sealed */}
          {!sealedUntil && (
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
          )}

          {/* Credit allocation */}
          {hasCredits && (
            <div className="rounded-lg border border-cream-dark bg-cream/30 p-4">
              <p className="mb-3 text-sm font-medium text-navy">
                Allocate credits for this vault
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {availableAudio > 0 && (
                  <div>
                    <label
                      htmlFor="max_audio"
                      className="mb-1 block text-xs font-medium text-warm-gray"
                    >
                      Max audio recordings
                    </label>
                    <input
                      id="max_audio"
                      type="number"
                      min={0}
                      max={availableAudio}
                      value={maxAudioRecordings}
                      onChange={(e) =>
                        setMaxAudioRecordings(
                          Math.min(
                            availableAudio,
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-2 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                    <p className="mt-1 text-xs text-warm-gray">
                      {availableAudio} available
                    </p>
                  </div>
                )}

                {availableVideo > 0 && (
                  <div>
                    <label
                      htmlFor="max_video"
                      className="mb-1 block text-xs font-medium text-warm-gray"
                    >
                      Max video recordings
                    </label>
                    <input
                      id="max_video"
                      type="number"
                      min={0}
                      max={availableVideo}
                      value={maxVideoRecordings}
                      onChange={(e) =>
                        setMaxVideoRecordings(
                          Math.min(
                            availableVideo,
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                      className="w-full rounded-lg border border-cream-dark bg-white px-4 py-2 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                    <p className="mt-1 text-xs text-warm-gray">
                      {availableVideo} available
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

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
            disabled={submitting || !hasCredits}
            className="w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Vault"}
          </button>
        </form>
      </div>
    </main>
  );
}
