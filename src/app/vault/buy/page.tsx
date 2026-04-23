"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VaultBuyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [audioQty, setAudioQty] = useState(0);
  const [videoQty, setVideoQty] = useState(10);
  const [photoQty, setPhotoQty] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/vault/buy");
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [supabase, router]);

  const total = audioQty * 5 + videoQty * 10 + photoQty * 2;
  const hasItems = audioQty > 0 || videoQty > 0 || photoQty > 0;

  async function handleCheckout() {
    if (!hasItems) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vault/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioCredits: audioQty,
          videoCredits: videoQty,
          photoCredits: photoQty,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checkout");
      }

      const data = await res.json();
      window.location.href = data.url;
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
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Memory Vault
          </p>
          <h1 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
            Buy vault credits
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-warm-gray">
            Each credit lets one person record a message or upload a photo to
            your vault. Unused credits never expire.
          </p>
        </div>

        {/* Credit selectors */}
        <div className="space-y-4">
          {/* Video — recommended */}
          <div className="rounded-2xl border-2 border-gold bg-white p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{"\uD83C\uDFA5"}</span>
                  <h3 className="text-lg font-bold text-navy">
                    Video Credits
                  </h3>
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold-dark">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-sm text-warm-gray">
                  Guests record a video message from their phone
                </p>
              </div>
              <p className="text-xl font-bold text-navy">
                $10
                <span className="text-sm font-normal text-warm-gray">
                  {" "}
                  each
                </span>
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setVideoQty(Math.max(0, videoQty - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                value={videoQty}
                onChange={(e) =>
                  setVideoQty(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-20 rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-center text-lg font-bold text-navy outline-none focus:border-gold"
              />
              <button
                onClick={() => setVideoQty(videoQty + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                +
              </button>
              {videoQty > 0 && (
                <span className="ml-auto text-sm font-semibold text-navy">
                  ${videoQty * 10}
                </span>
              )}
            </div>
          </div>

          {/* Audio */}
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{"\uD83C\uDFA4"}</span>
                  <h3 className="text-lg font-bold text-navy">
                    Audio Credits
                  </h3>
                </div>
                <p className="mt-1 text-sm text-warm-gray">
                  Guests record a voice message
                </p>
              </div>
              <p className="text-xl font-bold text-navy">
                $5
                <span className="text-sm font-normal text-warm-gray">
                  {" "}
                  each
                </span>
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setAudioQty(Math.max(0, audioQty - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                value={audioQty}
                onChange={(e) =>
                  setAudioQty(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-20 rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-center text-lg font-bold text-navy outline-none focus:border-gold"
              />
              <button
                onClick={() => setAudioQty(audioQty + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                +
              </button>
              {audioQty > 0 && (
                <span className="ml-auto text-sm font-semibold text-navy">
                  ${audioQty * 5}
                </span>
              )}
            </div>
          </div>

          {/* Photo */}
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{"\uD83D\uDCF7"}</span>
                  <h3 className="text-lg font-bold text-navy">
                    Photo Credits
                  </h3>
                </div>
                <p className="mt-1 text-sm text-warm-gray">
                  Guests upload a photo to your vault
                </p>
              </div>
              <p className="text-xl font-bold text-navy">
                $2
                <span className="text-sm font-normal text-warm-gray">
                  {" "}
                  each
                </span>
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setPhotoQty(Math.max(0, photoQty - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                value={photoQty}
                onChange={(e) =>
                  setPhotoQty(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-20 rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-center text-lg font-bold text-navy outline-none focus:border-gold"
              />
              <button
                onClick={() => setPhotoQty(photoQty + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                +
              </button>
              {photoQty > 0 && (
                <span className="ml-auto text-sm font-semibold text-navy">
                  ${photoQty * 2}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Suggestion */}
        <p className="mt-4 text-center text-xs text-warm-gray italic">
          Most couples buy 30-50 video slots for their wedding.
        </p>

        {/* Total & checkout */}
        <div className="mt-8 rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-navy">Total</span>
            <span className="text-3xl font-bold text-navy">${total}</span>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={!hasItems || submitting}
            className="mt-4 w-full rounded-lg bg-gold px-6 py-4 text-lg font-bold text-navy shadow-md transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Redirecting to checkout..." : "Checkout"}
          </button>

          <p className="mt-3 text-center text-xs text-warm-gray">
            Secure payment via Stripe. Credits are added instantly.
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/vault/my"
            className="text-sm font-medium text-navy underline hover:text-gold"
          >
            Back to my vaults
          </Link>
        </div>
      </div>
    </main>
  );
}
