"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { OCCASION_TYPES, TIERS } from "@/lib/constants";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface GiftItem {
  id: string;
  name: string;
  description: string;
  tier: string;
  price: number;
  occasion_tags: string[];
  image_url: string;
  active: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tier Badge Styling
   ═══════════════════════════════════════════════════════════════════════════ */

const TIER_BADGE_STYLES: Record<string, string> = {
  starter: "bg-warm-gray-light/20 text-warm-gray",
  classic: "bg-forest/10 text-forest",
  premium: "bg-gold/20 text-gold-dark",
  deluxe: "bg-navy/10 text-navy",
  legacy: "bg-gold-dark/20 text-gold-dark",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Helper — Format cents to dollars
   ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gift Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

function GiftCard({ gift }: { gift: GiftItem }) {
  const tierLabel =
    TIERS.find((t) => t.id === gift.tier)?.name ?? gift.tier;
  const badgeStyle =
    TIER_BADGE_STYLES[gift.tier] ?? "bg-warm-gray-light/20 text-warm-gray";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* Placeholder image area */}
      <div className="flex h-48 items-center justify-center bg-cream-dark">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-16 w-16 text-warm-gray-light"
          aria-hidden="true"
        >
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M12 8v13" />
          <path d="M3 13h18" />
          <path d="M8 8c0-2 0-5 4-5" />
          <path d="M16 8c0-2 0-5-4-5" />
        </svg>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Name */}
        <h3 className="text-lg font-bold text-navy">{gift.name}</h3>

        {/* Description — truncated to 2 lines */}
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-warm-gray">
          {gift.description}
        </p>

        {/* Tier badge + price */}
        <div className="mt-4 flex items-center justify-between">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}
          >
            {tierLabel}
          </span>
          <span className="text-lg font-extrabold text-navy">
            {formatPrice(gift.price)}
          </span>
        </div>

        {/* Occasion tags */}
        {gift.occasion_tags && gift.occasion_tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {gift.occasion_tags.map((tag) => {
              const label =
                OCCASION_TYPES.find((o) => o.value === tag)?.label ?? tag;
              return (
                <span
                  key={tag}
                  className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-medium text-warm-gray"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function GiftCatalogPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOccasion, setSelectedOccasion] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");

  /* ────────────────────────── Fetch gifts ────────────────────────── */

  useEffect(() => {
    async function fetchGifts() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("gift_catalog")
          .select("*")
          .eq("active", true)
          .order("price", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setGifts((data as GiftItem[]) ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load gift catalog. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchGifts();
  }, []);

  /* ────────────────────────── Filtered gifts ────────────────────────── */

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const matchesOccasion =
        selectedOccasion === "all" ||
        (gift.occasion_tags && gift.occasion_tags.includes(selectedOccasion));

      const matchesTier =
        selectedTier === "all" || gift.tier === selectedTier;

      return matchesOccasion && matchesTier;
    });
  }, [gifts, selectedOccasion, selectedTier]);

  /* ────────────────────────── Reset filters ────────────────────────── */

  function resetFilters() {
    setSelectedOccasion("all");
    setSelectedTier("all");
  }

  /* ════════════════════════════ Render ═════════════════════════════ */

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-white">
      {/* ─────────────────────────── Page Header ─────────────────────────── */}
      <section className="bg-gradient-to-b from-cream to-cream-dark px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            Gift Catalog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Explore our curated selection of gifts for every occasion and budget.
          </p>
        </div>
      </section>

      {/* ─────────────────────────── Filter Bar ──────────────────────────── */}
      <section className="border-b border-cream-dark bg-white px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-4">
          {/* Occasion filters */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-warm-gray">
              Occasion
            </span>
            <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <button
                type="button"
                onClick={() => setSelectedOccasion("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedOccasion === "all"
                    ? "bg-gold text-navy shadow-sm"
                    : "bg-cream-dark text-warm-gray hover:bg-cream-dark/80"
                }`}
              >
                All
              </button>
              {OCCASION_TYPES.map((occasion) => (
                <button
                  key={occasion.value}
                  type="button"
                  onClick={() => setSelectedOccasion(occasion.value)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedOccasion === occasion.value
                      ? "bg-gold text-navy shadow-sm"
                      : "bg-cream-dark text-warm-gray hover:bg-cream-dark/80"
                  }`}
                >
                  {occasion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tier filters */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-warm-gray">
              Tier
            </span>
            <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <button
                type="button"
                onClick={() => setSelectedTier("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedTier === "all"
                    ? "bg-gold text-navy shadow-sm"
                    : "bg-cream-dark text-warm-gray hover:bg-cream-dark/80"
                }`}
              >
                All Tiers
              </button>
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedTier === tier.id
                      ? "bg-gold text-navy shadow-sm"
                      : "bg-cream-dark text-warm-gray hover:bg-cream-dark/80"
                  }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── Gift Grid ───────────────────────────── */}
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg
                  className="h-8 w-8 animate-spin text-gold"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-sm text-warm-gray">
                  Loading gift catalog...
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex items-center justify-center py-20">
              <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredGifts.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cream-dark">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-10 w-10 text-warm-gray-light"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy">
                  No gifts found
                </h3>
                <p className="mt-2 text-sm text-warm-gray">
                  No gifts found for this combination. Try adjusting your
                  filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex items-center rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Gift cards grid */}
          {!loading && !error && filteredGifts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGifts.map((gift) => (
                <GiftCard key={gift.id} gift={gift} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────── CTA Section ──────────────────────────── */}
      <section className="bg-navy px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Ready to start sending?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cream/80">
            Choose your gift, pick an occasion, and let us handle the rest
            &mdash; year after year.
          </p>
          <div className="mt-8">
            <Link
              href="/send"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-10 py-4 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Start Sending
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
