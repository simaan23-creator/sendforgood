"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, clearCart, getLetterCart, clearLetterCart, clearVoiceCart, clearVaultCart, clearGiftCreditCart } from "@/lib/cart";
import { TIERS, OCCASION_TYPES } from "@/lib/constants";
import type { CartItem, LetterCartItem } from "@/lib/cart";

export default function CartSuccessPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [letterItems, setLetterItems] = useState<LetterCartItem[]>([]);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Grab items before clearing
    if (!cleared) {
      const cartItems = getCart();
      const cartLetters = getLetterCart();
      setItems(cartItems);
      setLetterItems(cartLetters);
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

  const giftTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const letterTotal = letterItems.reduce((sum, l) => sum + l.totalPrice / 100, 0);
  const total = giftTotal + letterTotal;

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
          Your order is confirmed! 🎉
        </h1>

        <p className="mt-4 text-lg text-warm-gray max-w-lg mx-auto leading-relaxed">
          Thank you for choosing SendForGood. We&rsquo;ve received your order
          {items.length > 0 && (
            <> for <span className="font-semibold text-navy">{items.length}</span>{" "}{items.length === 1 ? "gift" : "gifts"}</>
          )}
          {items.length > 0 && letterItems.length > 0 && " and"}
          {letterItems.length > 0 && (() => {
            const totalLetterQuantity = letterItems.reduce((sum, l) => sum + (l.quantity || 1), 0);
            return <> <span className="font-semibold text-navy">{totalLetterQuantity}</span>{" "}{totalLetterQuantity === 1 ? "letter" : "letters"}</>;
          })()}
          {" "}and will take care of everything from here.
        </p>

        {/* Order summary */}
        {(items.length > 0 || letterItems.length > 0) && (
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
                  <div>
                    <p className="font-medium text-navy">{item.recipientName}</p>
                    <p className="text-xs text-warm-gray">
                      {getOccasionLabel(item)} &middot; {getTierName(item.tier)} &middot;{" "}
                      {item.years} {item.years === 1 ? "year" : "years"}
                    </p>
                  </div>
                  <span className="font-medium text-navy">
                    ${item.totalPrice.toLocaleString()}
                  </span>
                </div>
              ))}
              {letterItems.map((letter) => (
                <div
                  key={letter.id}
                  className="flex items-center justify-between border-b border-cream-dark pb-3"
                >
                  <div>
                    <p className="font-medium text-navy">{letter.recipientName}</p>
                    <p className="text-xs text-warm-gray">
                      Legacy Letter &middot; {letter.letterType} &middot;{" "}
                      {letter.deliveryType === "digital" ? "Email delivery" : letter.deliveryType === "physical_photo" ? "Physical mail + photo" : "Physical mail"} &middot;{" "}
                      {letter.quantity} {letter.letterType === "annual" ? (letter.quantity === 1 ? "year" : "years") : (letter.quantity === 1 ? "letter" : "letters")}
                    </p>
                  </div>
                  <span className="font-medium text-navy">
                    ${(letter.totalPrice / 100).toFixed(0)}
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
            className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            View Your Dashboard
          </Link>
          <Link
            href="/gifts/buy"
            className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            Buy More Credits
          </Link>
        </div>

        {/* Reassurance */}
        <p className="mt-10 text-sm text-warm-gray-light">
          A confirmation email has been sent to your inbox. If you have any
          questions, reach out to us at{" "}
          <a
            href="mailto:support@sendforgood.com"
            className="text-gold hover:text-gold-dark underline underline-offset-2"
          >
            support@sendforgood.com
          </a>
        </p>
      </div>
    </section>
  );
}
