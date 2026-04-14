"use client";

import { useState } from "react";
import Link from "next/link";
import { addLetterToCart } from "@/lib/cart";
import { DELIVERY_TYPE_PRICES } from "@/lib/stripe";

type DeliveryType = "digital" | "physical" | "physical_photo";

const LETTER_TYPES: {
  id: DeliveryType;
  name: string;
  description: string;
  icon: string;
  popular?: boolean;
}[] = [
  {
    id: "digital",
    name: "Digital Letter",
    description: "Delivered by email on the scheduled date. Fully automated.",
    icon: "\u2709\uFE0F",
  },
  {
    id: "physical",
    name: "Physical Letter",
    description: "Printed and mailed to the recipient.",
    icon: "\uD83D\uDCEC",
  },
  {
    id: "physical_photo",
    name: "Physical Letter + Photo",
    description: "Printed letter + a wallet-sized photo mailed together.",
    icon: "\uD83D\uDCF7",
    popular: true,
  },
];

export default function BuyLetterCreditsPage() {
  const [quantities, setQuantities] = useState<Record<DeliveryType, number>>({
    digital: 0,
    physical: 0,
    physical_photo: 0,
  });
  const [added, setAdded] = useState(false);

  function setQty(type: DeliveryType, value: number) {
    setQuantities((prev) => ({ ...prev, [type]: Math.max(0, value) }));
  }

  function getTotalCents(): number {
    return LETTER_TYPES.reduce(
      (sum, t) => sum + quantities[t.id] * DELIVERY_TYPE_PRICES[t.id].price,
      0,
    );
  }

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  function handleAddToCart() {
    for (const type of LETTER_TYPES) {
      const qty = quantities[type.id];
      if (qty > 0) {
        addLetterToCart({
          itemType: "letter",
          deliveryType: type.id,
          deliveryLabel: type.name,
          quantity: qty,
          unitPrice: DELIVERY_TYPE_PRICES[type.id].price,
          totalPrice: DELIVERY_TYPE_PRICES[type.id].price * qty,
        });
      }
    }
    setAdded(true);
  }

  function handleReset() {
    setQuantities({ digital: 0, physical: 0, physical_photo: 0 });
    setAdded(false);
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link
            href="/letters"
            className="text-sm font-medium text-warm-gray hover:text-navy transition-colors"
          >
            &larr; Back to Legacy Letters
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-navy sm:text-4xl">
            Buy Letter Credits
          </h1>
          <p className="mt-2 text-warm-gray">
            Choose the type and quantity of letters you need. Configure
            recipients and delivery dates from your dashboard after purchase.
          </p>
        </div>

        {added ? (
          /* ── Success State ── */
          <div className="rounded-2xl border border-forest/30 bg-forest/5 p-10 text-center">
            <div className="text-5xl mb-4">&#10003;</div>
            <h2 className="text-2xl font-bold text-navy">Added to Cart!</h2>
            <p className="mt-2 text-warm-gray">
              Your letter credits have been added. You can continue shopping or
              head to checkout.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light"
              >
                View Cart
              </Link>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-8 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
              >
                Add More
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Letter Type Cards ── */}
            <div className="space-y-5">
              {LETTER_TYPES.map((type) => {
                const priceDollars = DELIVERY_TYPE_PRICES[type.id].price / 100;
                const qty = quantities[type.id];
                return (
                  <div
                    key={type.id}
                    className={`relative rounded-2xl border-2 bg-white p-6 transition ${
                      qty > 0
                        ? "border-gold shadow-md"
                        : "border-cream-dark hover:border-gold/50"
                    }`}
                  >
                    {type.popular && (
                      <span className="absolute -top-3 right-4 rounded-full bg-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Popular
                      </span>
                    )}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{type.icon}</span>
                          <h3 className="text-lg font-bold text-navy">
                            {type.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-warm-gray">
                          {type.description}
                        </p>
                        <p className="mt-2">
                          <span className="text-2xl font-extrabold text-navy">
                            ${priceDollars}
                          </span>
                          <span className="text-sm text-warm-gray">/letter</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQty(type.id, qty - 1)}
                          disabled={qty === 0}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark bg-white text-lg font-bold text-navy transition hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          &minus;
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={(e) =>
                            setQty(type.id, parseInt(e.target.value) || 0)
                          }
                          className="w-16 rounded-lg border border-cream-dark bg-white px-2 py-2 text-center text-lg font-bold text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                        />
                        <button
                          type="button"
                          onClick={() => setQty(type.id, qty + 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark bg-white text-lg font-bold text-navy transition hover:bg-cream-dark"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {qty > 0 && (
                      <p className="mt-3 text-right text-sm font-semibold text-navy">
                        Subtotal: ${((DELIVERY_TYPE_PRICES[type.id].price * qty) / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Total + Add to Cart ── */}
            <div className="mt-8 rounded-xl border border-cream-dark bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-navy">Total</span>
                <span className="text-2xl font-extrabold text-navy">
                  ${(getTotalCents() / 100).toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={totalItems === 0}
                className="mt-4 w-full rounded-lg bg-forest px-6 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>

            {/* ── Note ── */}
            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
              <p className="text-sm text-navy">
                After purchase, write your letters and set delivery dates from
                your dashboard. No rush.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
