"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addGiftCreditToCart } from "@/lib/cart";
import { TIERS } from "@/lib/constants";

const TIER_PRICES: Record<string, number> = {
  starter: 2000,
  classic: 4500,
  premium: 8000,
  deluxe: 12500,
  legacy: 20000,
};

const TIER_BADGE_CLASSES: Record<string, string> = {
  starter: "bg-warm-gray-light/20 text-warm-gray",
  classic: "bg-forest/10 text-forest",
  premium: "bg-gold/20 text-gold-dark",
  deluxe: "bg-navy/10 text-navy",
  legacy: "bg-gold-dark/20 text-gold-dark",
};

export default function BuyGiftCreditsPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(TIERS.map((t) => [t.id, 0]))
  );
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (added) window.scrollTo({ top: 0, behavior: "instant" });
  }, [added]);

  const totalCents = TIERS.reduce(
    (sum, tier) => sum + (quantities[tier.id] || 0) * TIER_PRICES[tier.id],
    0
  );
  const totalCredits = TIERS.reduce(
    (sum, tier) => sum + (quantities[tier.id] || 0),
    0
  );

  function handleQuantityChange(tierId: string, value: string) {
    const num = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [tierId]: num }));
    setAdded(false);
  }

  function handleAddToCart() {
    for (const tier of TIERS) {
      const qty = quantities[tier.id] || 0;
      if (qty > 0) {
        addGiftCreditToCart({
          itemType: "gift_credit",
          tier: tier.id,
          tierName: tier.name,
          quantity: qty,
          unitPrice: TIER_PRICES[tier.id],
          totalPrice: TIER_PRICES[tier.id] * qty,
        });
      }
    }
    setAdded(true);
    // Reset quantities
    setQuantities(Object.fromEntries(TIERS.map((t) => [t.id, 0])));
  }

  if (added) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-forest">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Added to cart!</h1>
          <p className="mt-3 text-warm-gray">
            Your gifts have been added to your cart.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-forest-light"
            >
              View Cart
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setAdded(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
            >
              Buy More
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Send Gifts
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-warm-gray">
            Buy gifts by tier. Assign recipients, dates, and preferences
            from your dashboard whenever you are ready. Never expire.
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TIERS.map((tier) => {
            const priceCents = TIER_PRICES[tier.id];
            const qty = quantities[tier.id] || 0;
            const subtotalCents = priceCents * qty;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md ${
                  tier.id === "premium" ? "border-gold ring-2 ring-gold/30" : "border-cream-dark"
                }`}
              >
                {tier.id === "premium" && (
                  <span className="absolute -top-3 right-4 inline-block rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}

                {/* Badge + Price */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TIER_BADGE_CLASSES[tier.id]}`}
                  >
                    {tier.name}
                  </span>
                  <p className="mt-2 text-2xl font-bold text-navy">
                    ${(priceCents / 100).toFixed(0)}
                    <span className="text-sm font-normal text-warm-gray">/gift</span>
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-warm-gray leading-relaxed mb-4">
                  {tier.description}
                </p>

                {/* Features */}
                <ul className="mb-5 space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy/80">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Quantity Input */}
                <div className="mt-auto">
                  <label
                    htmlFor={`qty-${tier.id}`}
                    className="mb-1.5 block text-xs font-medium text-navy"
                  >
                    Quantity
                  </label>
                  <input
                    id={`qty-${tier.id}`}
                    type="number"
                    min={0}
                    value={qty}
                    onChange={(e) => handleQuantityChange(tier.id, e.target.value)}
                    className="w-full rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-sm text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  {qty > 0 && (
                    <p className="mt-1.5 text-sm font-medium text-forest">
                      Subtotal: ${(subtotalCents / 100).toFixed(0)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total + Add to Cart */}
        <div className="mt-10 rounded-xl border border-cream-dark bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-sm text-warm-gray">
                {totalCredits} gift{totalCredits !== 1 ? "s" : ""} selected
              </p>
              <p className="text-2xl font-bold text-navy">
                Total: <span className="text-forest">${(totalCents / 100).toFixed(0)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={totalCredits === 0}
              className="rounded-lg bg-forest px-8 py-3.5 text-sm font-bold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-warm-gray">
          <span className="inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            Gifts never expire
          </span>
          <span className="inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            Assign recipients later
          </span>
          <span className="inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
            </svg>
            Secure payment
          </span>
        </div>
      </div>
    </main>
  );
}
