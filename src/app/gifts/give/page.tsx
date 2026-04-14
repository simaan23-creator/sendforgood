"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addGiftCreditToCart } from "@/lib/cart";
import { TIERS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

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

export default function GiveGiftCreditPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth?redirect=/gifts/give");
      } else {
        setAuthed(true);
      }
      setChecking(false);
    });
  }, [supabase, router]);

  function handleAddToCart() {
    if (!selectedTier || !recipientName.trim()) return;
    const tier = TIERS.find((t) => t.id === selectedTier);
    if (!tier) return;

    const unitPrice = TIER_PRICES[selectedTier];
    addGiftCreditToCart({
      itemType: "gift_credit",
      tier: selectedTier,
      tierName: tier.name,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      isGifted: true,
      giftRecipientName: recipientName.trim(),
      giftRecipientEmail: recipientEmail.trim() || undefined,
      giftMessage: message.trim() || undefined,
    });
    setAdded(true);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (!authed) return null;

  if (added) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-forest">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Gift added to cart!</h1>
          <p className="mt-3 text-warm-gray">
            Your gift credit for <span className="font-semibold text-navy">{recipientName}</span> has been added to your cart.
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
              onClick={() => {
                setAdded(false);
                setRecipientName("");
                setRecipientEmail("");
                setSelectedTier(null);
                setMessage("");
                setQuantity(1);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
            >
              Gift Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  const selectedTierInfo = selectedTier ? TIERS.find((t) => t.id === selectedTier) : null;
  const totalCents = selectedTier ? TIER_PRICES[selectedTier] * quantity : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Give someone a gift credit
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-warm-gray">
            Buy a gift credit and give it to someone you love. They set up their preferences, we deliver a gift every year.
          </p>
        </div>

        <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-sm sm:p-8">
          {/* Recipient Info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="recipientName" className="mb-1.5 block text-sm font-medium text-navy">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                id="recipientName"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Who is this gift for?"
                className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div>
              <label htmlFor="recipientEmail" className="mb-1.5 block text-sm font-medium text-navy">
                Recipient Email <span className="text-warm-gray-light text-xs font-normal">(optional)</span>
              </label>
              <input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="We'll email them the claim link"
                className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
          </div>

          {/* Tier Selection */}
          <div className="mt-8">
            <label className="mb-3 block text-sm font-medium text-navy">
              Gift Tier <span className="text-red-500">*</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TIERS.map((tier) => {
                const priceCents = TIER_PRICES[tier.id];
                const isSelected = selectedTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition ${
                      isSelected
                        ? "border-forest bg-forest/5 ring-2 ring-forest/20"
                        : "border-cream-dark hover:border-gold/50 hover:bg-cream"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-3 top-3">
                        <svg className="h-5 w-5 text-forest" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIER_BADGE_CLASSES[tier.id]}`}>
                      {tier.name}
                    </span>
                    <p className="mt-2 text-xl font-bold text-navy">
                      ${(priceCents / 100).toFixed(0)}
                    </p>
                    <p className="mt-1 text-xs text-warm-gray leading-relaxed">
                      {tier.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-navy">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          {/* Personal Message */}
          <div className="mt-6">
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-navy">
              Personal Message <span className="text-warm-gray-light text-xs font-normal">(optional)</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a note to go with the gift..."
              rows={3}
              className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          {/* Summary + Add to Cart */}
          <div className="mt-8 rounded-xl border border-cream-dark bg-cream/30 p-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                {selectedTierInfo && (
                  <p className="text-sm text-warm-gray">
                    {quantity} {selectedTierInfo.name} credit{quantity !== 1 ? "s" : ""} for {recipientName || "..."}
                  </p>
                )}
                <p className="text-2xl font-bold text-navy">
                  Total: <span className="text-forest">${(totalCents / 100).toFixed(0)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedTier || !recipientName.trim()}
                className="rounded-lg bg-forest px-8 py-3.5 text-sm font-bold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add to Cart
              </button>
            </div>
          </div>

          {/* Note */}
          <p className="mt-4 text-xs text-warm-gray text-center leading-relaxed">
            After purchase, your recipient will receive a link to claim their gift and set up their preferences.
            If no email is provided, you will receive the claim link.
          </p>
        </div>
      </div>
    </main>
  );
}
