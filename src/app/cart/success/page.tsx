"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCart,
  clearCart,
  getLetterCart,
  clearLetterCart,
  getVoiceCart,
  clearVoiceCart,
  getVaultCart,
  clearVaultCart,
  getGiftCreditCart,
  clearGiftCreditCart,
} from "@/lib/cart";
import { trackPurchase } from "@/lib/analytics";
import { TIERS, OCCASION_TYPES } from "@/lib/constants";
import type {
  CartItem,
  LetterCartItem,
  VoiceCartItem,
  VaultCartItem,
  GiftCreditCartItem,
} from "@/lib/cart";

export default function CartSuccessPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [letterItems, setLetterItems] = useState<LetterCartItem[]>([]);
  const [voiceItems, setVoiceItems] = useState<VoiceCartItem[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultCartItem[]>([]);
  const [giftCreditItems, setGiftCreditItems] = useState<GiftCreditCartItem[]>([]);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Grab items before clearing
    if (!cleared) {
      setItems(getCart());
      setLetterItems(getLetterCart());
      setVoiceItems(getVoiceCart());
      setVaultItems(getVaultCart());
      setGiftCreditItems(getGiftCreditCart());
      clearCart();
      clearLetterCart();
      clearVoiceCart();
      clearVaultCart();
      clearGiftCreditCart();
      setCleared(true);
    }
  }, [cleared]);

  function getOccasionLabel(item: CartItem): string {
    if (item.occasionType === "custom") return item.occasionLabel;
    return OCCASION_TYPES.find((o) => o.value === item.occasionType)?.label ?? item.occasionType;
  }

  function getTierName(tierId: string): string {
    return TIERS.find((t) => t.id === tierId)?.name ?? tierId;
  }

  // Totals — gift items track totalPrice in dollars, everything else in cents.
  const giftTotalDollars = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const letterTotalDollars = letterItems.reduce((sum, l) => sum + l.totalPrice / 100, 0);
  const voiceTotalDollars = voiceItems.reduce((sum, v) => sum + v.totalPrice / 100, 0);
  const vaultTotalDollars = vaultItems.reduce((sum, v) => sum + v.totalPrice / 100, 0);
  const giftCreditTotalDollars = giftCreditItems.reduce((sum, gc) => sum + gc.totalPrice / 100, 0);
  const total =
    giftTotalDollars +
    letterTotalDollars +
    voiceTotalDollars +
    vaultTotalDollars +
    giftCreditTotalDollars;

  const hasAnyItems =
    items.length > 0 ||
    letterItems.length > 0 ||
    voiceItems.length > 0 ||
    vaultItems.length > 0 ||
    giftCreditItems.length > 0;

  // Fire purchase conversion once items have been loaded from cart and
  // total has been computed. Synthetic transaction id derived from the
  // total + hour-bucketed timestamp so a refresh inside the same hour
  // dedupes via sessionStorage; rare cross-hour double-counts are
  // acceptable for the cart flow.
  useEffect(() => {
    if (!cleared || !hasAnyItems || total <= 0) return;
    const hourBucket = Math.floor(Date.now() / (60 * 60 * 1000));
    const transactionId = `cart_${total.toFixed(2)}_${hourBucket}`;
    trackPurchase({
      transactionId,
      valueUsd: total,
      itemCategory: "cart",
    });
  }, [cleared, hasAnyItems, total]);

  return (
    <section className="bg-gradient-to-b from-cream to-cream-dark min-h-[80vh] py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest/10 ring-4 ring-forest/20">
          <svg
            className="h-12 w-12 text-forest"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight">
          Order confirmed! 🎉
        </h1>

        <p className="mt-4 text-lg text-warm-gray max-w-lg mx-auto leading-relaxed">
          Your items are now in your dashboard. Head over to write, record, and
          schedule everything you just bought — we&rsquo;ll take care of delivery
          when the time comes.
        </p>

        {/* Order summary */}
        {hasAnyItems && (
          <div className="mt-10 rounded-xl border border-cream-dark bg-white p-6 sm:p-8 text-left shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-5">
              Order Summary
            </h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-cream-dark pb-3"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-medium text-navy truncate">{item.recipientName}</p>
                    <p className="text-xs text-warm-gray">
                      {getOccasionLabel(item)} &middot; {getTierName(item.tier)} &middot;{" "}
                      {item.years} {item.years === 1 ? "year" : "years"}
                    </p>
                  </div>
                  <span className="font-medium text-navy whitespace-nowrap">
                    ${item.totalPrice.toLocaleString()}
                  </span>
                </div>
              ))}

              {letterItems.map((letter) => (
                <div
                  key={letter.id}
                  className="flex items-center justify-between border-b border-cream-dark pb-3"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-medium text-navy truncate">{letter.deliveryLabel}</p>
                    <p className="text-xs text-warm-gray">
                      {letter.quantity} {letter.quantity === 1 ? "letter" : "letters"}
                    </p>
                  </div>
                  <span className="font-medium text-navy whitespace-nowrap">
                    ${(letter.totalPrice / 100).toFixed(0)}
                  </span>
                </div>
              ))}

              {voiceItems.map((voice) => {
                const parts: string[] = [];
                if (voice.audioQuantity > 0)
                  parts.push(`${voice.audioQuantity} audio`);
                if (voice.videoQuantity > 0)
                  parts.push(`${voice.videoQuantity} video`);
                return (
                  <div
                    key={voice.id}
                    className="flex items-center justify-between border-b border-cream-dark pb-3"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-medium text-navy truncate">Voice / Video Messages</p>
                      <p className="text-xs text-warm-gray">{parts.join(" + ")}</p>
                    </div>
                    <span className="font-medium text-navy whitespace-nowrap">
                      ${(voice.totalPrice / 100).toFixed(0)}
                    </span>
                  </div>
                );
              })}

              {vaultItems.map((vault) => {
                const parts: string[] = [];
                if (vault.audioCredits > 0)
                  parts.push(`${vault.audioCredits} audio`);
                if (vault.videoCredits > 0)
                  parts.push(`${vault.videoCredits} video`);
                return (
                  <div
                    key={vault.id}
                    className="flex items-center justify-between border-b border-cream-dark pb-3"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-medium text-navy truncate">Memory Vault Credits</p>
                      <p className="text-xs text-warm-gray">{parts.join(" + ")}</p>
                    </div>
                    <span className="font-medium text-navy whitespace-nowrap">
                      ${(vault.totalPrice / 100).toFixed(0)}
                    </span>
                  </div>
                );
              })}

              {giftCreditItems.map((gc) => (
                <div
                  key={gc.id}
                  className="flex items-center justify-between border-b border-cream-dark pb-3"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-medium text-navy truncate">{gc.tierName} Gift</p>
                    <p className="text-xs text-warm-gray">
                      {gc.quantity} {gc.quantity === 1 ? "gift" : "gifts"}
                    </p>
                  </div>
                  <span className="font-medium text-navy whitespace-nowrap">
                    ${(gc.totalPrice / 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-cream-dark pt-4 mt-4">
              <span className="font-semibold text-navy">Total Paid</span>
              <span className="font-bold text-navy text-lg">
                ${total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            Go to dashboard
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </Link>
          <Link
            href="/vault/buy"
            className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            Buy More
          </Link>
        </div>

        {/* Reassurance */}
        <p className="mt-10 text-sm text-warm-gray-light">
          A confirmation email has been sent to your inbox. If you have any
          questions, reach out to us at{" "}
          <a
            href="mailto:support@sealtheday.com"
            className="text-gold hover:text-gold-dark underline underline-offset-2"
          >
            support@sealtheday.com
          </a>
        </p>
      </div>
    </section>
  );
}
