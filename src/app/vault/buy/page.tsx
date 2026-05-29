"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ExistingVault = {
  id: string;
  title: string;
  occasion: string | null;
};

const STARTER_BUNDLE = {
  vaultFees: 1,
  videoQty: 50,
  photoQty: 200,
  audioQty: 0,
  priceCents: 9995,
  label: "Starter Package",
};

export default function VaultBuyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bundleParam = searchParams.get("bundle");
  const isStarter = bundleParam === "starter";
  const supabase = createClient();

  const [vaultFeeQty, setVaultFeeQty] = useState(isStarter ? STARTER_BUNDLE.vaultFees : 1);
  // Audio purchase UI hidden 2026-05-29 — vault is video + photo only for now.
  // Backend / memory_credits.audio_credits column kept intact so any legacy
  // audio credits remain valid and re-enabling is a UI-only change.
  const audioQty = 0;
  const [videoQty, setVideoQty] = useState(isStarter ? STARTER_BUNDLE.videoQty : 10);
  const [photoQty, setPhotoQty] = useState(isStarter ? STARTER_BUNDLE.photoQty : 0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingVaults, setExistingVaults] = useState<ExistingVault[]>([]);
  const [targetVaultId, setTargetVaultId] = useState<string>("NEW");

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/vault/buy");
        return;
      }
      // Fetch existing vaults so user can top up credits on one they already own
      // (skipped entirely for bundle mode — the bundle always creates a fresh vault).
      if (!isStarter) {
        try {
          const res = await fetch("/api/memory-requests");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const mapped: ExistingVault[] = data.map((v: { id: string; title: string; occasion: string | null }) => ({
                id: v.id,
                title: v.title,
                occasion: v.occasion,
              }));
              setExistingVaults(mapped);
              // Default to most recently created vault (API returns newest first)
              setTargetVaultId(mapped[0].id);
              setVaultFeeQty(0);
            }
          }
        } catch {
          // Non-fatal — picker just won't appear
        }
      }
      setLoading(false);
    }
    init();
  }, [supabase, router, isStarter]);

  const targetingExisting = !isStarter && targetVaultId !== "NEW";

  // When targeting an existing vault, no vault fee is charged
  const effectiveVaultFeeQty = targetingExisting ? 0 : vaultFeeQty;
  const slotTotal = audioQty * 25 + videoQty * 100 + photoQty * 25;
  const feeTotal = effectiveVaultFeeQty * 1000;
  const alaCarteTotal = feeTotal + slotTotal;
  const total = isStarter ? STARTER_BUNDLE.priceCents : alaCarteTotal;
  const hasItems = audioQty > 0 || videoQty > 0 || photoQty > 0;
  const targetVaultName = targetingExisting
    ? existingVaults.find((v) => v.id === targetVaultId)?.title ?? "your vault"
    : null;

  function handleTargetVaultChange(value: string) {
    setTargetVaultId(value);
    if (value === "NEW") {
      // User chose to create a new vault — restore vault fee
      if (vaultFeeQty < 1) setVaultFeeQty(1);
    } else {
      setVaultFeeQty(0);
    }
  }

  async function handleCheckout() {
    if (!hasItems) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vault/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isStarter
            ? { bundle: "starter" }
            : {
                audioCredits: audioQty,
                videoCredits: videoQty,
                photoCredits: photoQty,
                vaultFeeQty: effectiveVaultFeeQty,
                targetVaultId: targetingExisting ? targetVaultId : null,
              }
        ),
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

  function formatPrice(cents: number) {
    return cents >= 100
      ? `$${(cents / 100).toFixed(0)}`
      : `$${(cents / 100).toFixed(2)}`;
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
            {isStarter ? "Starter Package" : "Buy vault credits"}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-warm-gray">
            {isStarter
              ? "Everything a typical 100–150 person wedding needs, bundled at $99.95."
              : "Each credit lets one person record a message or upload a photo to your vault. Unused credits never expire."}
          </p>
        </div>

        {/* Starter bundle summary card (read-only) */}
        {isStarter && (
          <div className="mb-6 rounded-2xl border-2 border-gold bg-white p-6 shadow-md">
            <div className="flex items-baseline justify-between">
              <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-dark">
                Bundle
              </span>
              <div className="text-right">
                <div className="text-xs text-warm-gray line-through">$110 a la carte</div>
                <div className="text-3xl font-extrabold tracking-tight text-navy">
                  $99<span className="text-xl">.95</span>
                </div>
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-navy">
              <li className="flex items-start gap-2">
                <span className="text-forest">✓</span>
                <span><strong>1 Memory Vault</strong> ($10 value)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest">✓</span>
                <span><strong>50 video recording slots</strong> ($50 value)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest">✓</span>
                <span><strong>200 photo upload slots</strong> ($50 value)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest">✓</span>
                <span>Printable Wedding Kit + unused slots never expire</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-warm-gray">
              Want different quantities?{" "}
              <Link href="/vault/buy" className="font-semibold text-navy underline hover:text-gold">
                Build your own &rarr;
              </Link>
            </p>
          </div>
        )}

        {/* Vault picker — only when user already has at least one vault */}
        {!isStarter && existingVaults.length > 0 && (
          <div className="mb-4 rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <label htmlFor="targetVault" className="block text-sm font-semibold text-navy">
              Adding credits to
            </label>
            <select
              id="targetVault"
              value={targetVaultId}
              onChange={(e) => handleTargetVaultChange(e.target.value)}
              className="mt-2 w-full rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-base text-navy outline-none focus:border-gold"
            >
              {existingVaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                  {v.occasion ? ` — ${v.occasion}` : ""}
                </option>
              ))}
              <option value="NEW">+ Create a new vault ($10 fee)</option>
            </select>
            {targetingExisting && (
              <p className="mt-2 text-xs text-warm-gray">
                New credits will be added to <span className="font-semibold text-navy">{targetVaultName}</span>. No vault creation fee.
              </p>
            )}
          </div>
        )}

        {/* Credit selectors (hidden in bundle mode) */}
        {!isStarter && (
        <div className="space-y-4">
          {/* Vault fee — hidden when topping up an existing vault */}
          {!targetingExisting && (
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{"\uD83D\uDD12"}</span>
                  <h3 className="text-lg font-bold text-navy">
                    Vault Credits
                  </h3>
                </div>
                <p className="mt-1 text-sm text-warm-gray">
                  Each vault credit lets you create one Memory Vault
                </p>
              </div>
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-xl font-bold text-navy">$10</span>
                <span className="text-sm font-normal text-warm-gray">/each</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setVaultFeeQty(Math.max(1, vaultFeeQty - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={vaultFeeQty}
                onChange={(e) =>
                  setVaultFeeQty(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-20 rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-center text-lg font-bold text-navy outline-none focus:border-gold"
              />
              <button
                onClick={() => setVaultFeeQty(vaultFeeQty + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark text-lg font-bold text-navy transition hover:bg-cream-dark"
              >
                +
              </button>
              <span className="ml-auto text-sm font-semibold text-navy">
                {formatPrice(vaultFeeQty * 1000)}
              </span>
            </div>
          </div>
          )}

          {/* Video — recommended */}
          <div className="rounded-2xl border-2 border-gold bg-white p-6 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-xl font-bold text-navy">$1</span>
                <span className="text-sm font-normal text-warm-gray">/each</span>
              </div>
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
                  {formatPrice(videoQty * 100)}
                </span>
              )}
            </div>
          </div>

          {/* Audio card removed 2026-05-29 — see audioQty comment above. */}

          {/* Photo */}
          <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-xl font-bold text-navy">$0.25</span>
                <span className="text-sm font-normal text-warm-gray">/each</span>
              </div>
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
                  {formatPrice(photoQty * 25)}
                </span>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Suggestion */}
        {!isStarter && (
          <p className="mt-4 text-center text-xs text-warm-gray italic">
            Most couples buy 30-50 video slots for their wedding.
          </p>
        )}

        {/* Total & checkout */}
        <div className="mt-8 rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
          <div className="space-y-2 text-sm text-warm-gray">
            {!isStarter && !targetingExisting && (
              <div className="flex justify-between">
                <span>Vault credit{vaultFeeQty > 1 ? `s (x${vaultFeeQty})` : ""}</span>
                <span className="font-medium text-navy">{formatPrice(feeTotal)}</span>
              </div>
            )}
            {!isStarter && hasItems && (
              <div className="flex justify-between">
                <span>Recording slots</span>
                <span className="font-medium text-navy">
                  {formatPrice(slotTotal)}
                </span>
              </div>
            )}
            {isStarter && (
              <>
                <div className="flex justify-between">
                  <span>{STARTER_BUNDLE.label}</span>
                  <span className="font-medium text-navy line-through">$110.00</span>
                </div>
                <div className="flex justify-between text-forest">
                  <span>Bundle discount</span>
                  <span className="font-medium">-$10.05</span>
                </div>
              </>
            )}
            <div className="border-t border-cream-dark pt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-navy">Total</span>
                <span className="text-3xl font-bold text-navy">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
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
            {submitting
              ? "Redirecting to checkout..."
              : isStarter
                ? "Checkout — Starter Package $99.95"
                : "Checkout"}
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
