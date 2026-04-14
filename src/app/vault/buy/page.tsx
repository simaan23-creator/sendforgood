"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function BuyCreditsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [audioCredits, setAudioCredits] = useState(5);
  const [videoCredits, setVideoCredits] = useState(5);
  const [error, setError] = useState<string | null>(null);

  // Existing balance
  const [existingAudio, setExistingAudio] = useState(0);
  const [existingVideo, setExistingVideo] = useState(0);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/vault/buy");
        return;
      }

      // Fetch current credit balance in background
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000));
        const res = await Promise.race([fetch("/api/vault/credits"), timeout]) as Response;
        if (res.ok) {
          const data = await res.json();
          setExistingAudio(data.audioCredits - data.audioUsed);
          setExistingVideo(data.videoCredits - data.videoUsed);
        }
      } catch {
        // silently fail
      }
    }
    init();
  }, [supabase, router]);

  const audioTotal = audioCredits * 5;
  const videoTotal = videoCredits * 10;
  const grandTotal = audioTotal + videoTotal;

  async function handleBuy() {
    if (audioCredits <= 0 && videoCredits <= 0) {
      setError("Please select at least one credit to purchase.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/vault/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioCredits: audioCredits > 0 ? audioCredits : 0,
          videoCredits: videoCredits > 0 ? videoCredits : 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-navy">Buy Memory Credits</h1>
          <p className="mt-2 text-warm-gray">
            Credits are used when someone records a message for your vault.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Audio Credits */}
          <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-md">
            <div className="text-center">
              <span className="text-5xl">{"\uD83C\uDFA4"}</span>
              <h2 className="mt-3 text-xl font-bold text-navy">
                Audio Credits
              </h2>
              <p className="mt-1 text-2xl font-bold text-gold">$5 each</p>
              <p className="mt-2 text-sm text-warm-gray">
                Each credit allows one person to record a voice message for you
              </p>
            </div>

            <div className="mt-6">
              <label
                htmlFor="audio-qty"
                className="mb-1.5 block text-sm font-medium text-navy"
              >
                How many audio credits?
              </label>
              <input
                id="audio-qty"
                type="number"
                min={0}
                value={audioCredits}
                onChange={(e) =>
                  setAudioCredits(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy text-center text-lg font-semibold transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <p className="mt-2 text-center text-lg font-semibold text-navy">
                ${audioTotal}
              </p>
            </div>
          </div>

          {/* Video Credits */}
          <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-md">
            <div className="text-center">
              <span className="text-5xl">{"\uD83C\uDFA5"}</span>
              <h2 className="mt-3 text-xl font-bold text-navy">
                Video Credits
              </h2>
              <p className="mt-1 text-2xl font-bold text-gold">$10 each</p>
              <p className="mt-2 text-sm text-warm-gray">
                Each credit allows one person to record a video message for you
              </p>
            </div>

            <div className="mt-6">
              <label
                htmlFor="video-qty"
                className="mb-1.5 block text-sm font-medium text-navy"
              >
                How many video credits?
              </label>
              <input
                id="video-qty"
                type="number"
                min={0}
                value={videoCredits}
                onChange={(e) =>
                  setVideoCredits(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy text-center text-lg font-semibold transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <p className="mt-2 text-center text-lg font-semibold text-navy">
                ${videoTotal}
              </p>
            </div>
          </div>
        </div>

        {/* Existing balance */}
        {(existingAudio > 0 || existingVideo > 0) && (
          <div className="mt-6 rounded-xl border border-cream-dark bg-white p-5">
            <p className="text-sm font-medium text-navy">
              Your current balance
            </p>
            <div className="mt-2 flex gap-4">
              <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-sm font-medium text-navy">
                {"\uD83C\uDFA4"} {existingAudio} audio
              </span>
              <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-sm font-medium text-navy">
                {"\uD83C\uDFA5"} {existingVideo} video
              </span>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="mt-8 rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-navy">Total</span>
            <span className="text-3xl font-bold text-navy">${grandTotal}</span>
          </div>

          <button
            onClick={handleBuy}
            disabled={submitting || grandTotal === 0}
            className="mt-6 w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Redirecting to checkout..." : "Buy Credits"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-warm-gray">
          Already have credits?{" "}
          <Link
            href="/request/create"
            className="font-medium text-navy underline hover:text-gold"
          >
            Create a vault now
          </Link>
        </p>
      </div>
    </main>
  );
}
