"use client";

import { useState } from "react";
import Link from "next/link";
import { addLetterToCart, addVoiceToCart } from "@/lib/cart";
import { DELIVERY_TYPE_PRICES } from "@/lib/prices";

const AUDIO_PRICE_CENTS = 500;
const VIDEO_PRICE_CENTS = 1000;

type DeliveryType = "digital" | "physical" | "physical_photo";

const CREDIT_TYPES = [
  {
    section: "Written Letters",
    items: [
      {
        id: "digital" as DeliveryType,
        name: "Digital Letter",
        price: DELIVERY_TYPE_PRICES.digital.price,
        description: "Delivered by email",
      },
      {
        id: "physical" as DeliveryType,
        name: "Physical Letter",
        price: DELIVERY_TYPE_PRICES.physical.price,
        description: "Printed and mailed",
      },
      {
        id: "physical_photo" as DeliveryType,
        name: "Physical + Photo",
        price: DELIVERY_TYPE_PRICES.physical_photo.price,
        description: "Letter + wallet photo mailed together",
      },
    ],
  },
  {
    section: "Audio & Video",
    items: [
      {
        id: "audio" as const,
        name: "Audio Message",
        price: AUDIO_PRICE_CENTS,
        description: "Your voice, delivered by email",
      },
      {
        id: "video" as const,
        name: "Video Message",
        price: VIDEO_PRICE_CENTS,
        description: "Your face and voice, delivered by email",
      },
    ],
  },
];

type CreditId = DeliveryType | "audio" | "video";

export default function BuyCreditsPage() {
  const [quantities, setQuantities] = useState<Record<CreditId, number>>({
    digital: 0,
    physical: 0,
    physical_photo: 0,
    audio: 0,
    video: 0,
  });
  const [added, setAdded] = useState(false);

  function setQty(id: CreditId, value: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  }

  function getPrice(id: CreditId): number {
    if (id === "audio") return AUDIO_PRICE_CENTS;
    if (id === "video") return VIDEO_PRICE_CENTS;
    return DELIVERY_TYPE_PRICES[id].price;
  }

  const total = Object.entries(quantities).reduce(
    (sum, [id, qty]) => sum + qty * getPrice(id as CreditId),
    0,
  );

  const canAdd = Object.values(quantities).some((q) => q > 0);

  function handleAddToCart() {
    // Add letter credits
    const letterTypes: DeliveryType[] = ["digital", "physical", "physical_photo"];
    for (const type of letterTypes) {
      const qty = quantities[type];
      if (qty > 0) {
        addLetterToCart({
          itemType: "letter",
          deliveryType: type,
          deliveryLabel: DELIVERY_TYPE_PRICES[type].label,
          quantity: qty,
          unitPrice: DELIVERY_TYPE_PRICES[type].price,
          totalPrice: DELIVERY_TYPE_PRICES[type].price * qty,
        });
      }
    }

    // Add audio/video credits
    const audioQty = quantities.audio;
    const videoQty = quantities.video;
    if (audioQty > 0 || videoQty > 0) {
      addVoiceToCart({
        itemType: "voice",
        audioQuantity: audioQty,
        videoQuantity: videoQty,
        unitPriceAudio: AUDIO_PRICE_CENTS,
        unitPriceVideo: VIDEO_PRICE_CENTS,
        totalPrice: audioQty * AUDIO_PRICE_CENTS + videoQty * VIDEO_PRICE_CENTS,
      });
    }

    setAdded(true);
  }

  function handleReset() {
    setQuantities({
      digital: 0,
      physical: 0,
      physical_photo: 0,
      audio: 0,
      video: 0,
    });
    setAdded(false);
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Buy Message Credits
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-warm-gray">
            Send your words in any format. Written letters, voice messages, or
            video messages. All delivered automatically on your schedule.
          </p>
        </div>

        {added ? (
          /* Success State */
          <div className="rounded-2xl border border-forest/30 bg-forest/5 p-10 text-center">
            <div className="text-5xl mb-4">&#10003;</div>
            <h2 className="text-2xl font-bold text-navy">Added to Cart!</h2>
            <p className="mt-2 text-warm-gray">
              Your message credits have been added. You can continue shopping or
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
            {/* Credit Type Sections */}
            <div className="space-y-8">
              {CREDIT_TYPES.map((section) => (
                <div key={section.section}>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-navy/50">
                    {section.section}
                  </h2>
                  <div className="space-y-4">
                    {section.items.map((item) => {
                      const id = item.id as CreditId;
                      const qty = quantities[id];
                      const priceDollars = item.price / 100;
                      return (
                        <div
                          key={id}
                          className={`rounded-2xl border-2 bg-white p-5 transition ${
                            qty > 0
                              ? "border-gold shadow-md"
                              : "border-cream-dark hover:border-gold/50"
                          }`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-navy">
                                {item.name}
                              </h3>
                              <p className="mt-0.5 text-sm text-warm-gray">
                                {item.description}
                              </p>
                              <p className="mt-1">
                                <span className="text-xl font-extrabold text-navy">
                                  ${priceDollars}
                                </span>
                                <span className="text-sm text-warm-gray">
                                  {" "}
                                  each
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setQty(id, qty - 1)}
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
                                  setQty(id, parseInt(e.target.value) || 0)
                                }
                                className="w-16 rounded-lg border border-cream-dark bg-white px-2 py-2 text-center text-lg font-bold text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                              />
                              <button
                                type="button"
                                onClick={() => setQty(id, qty + 1)}
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cream-dark bg-white text-lg font-bold text-navy transition hover:bg-cream-dark"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          {qty > 0 && (
                            <p className="mt-3 text-right text-sm font-semibold text-navy">
                              Subtotal: $
                              {((item.price * qty) / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Add to Cart */}
            <div className="mt-8 rounded-xl border border-cream-dark bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-navy">Total</span>
                <span className="text-2xl font-extrabold text-navy">
                  ${(total / 100).toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!canAdd}
                className="mt-4 w-full rounded-lg bg-navy px-6 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>

            {/* Note */}
            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
              <p className="text-sm text-navy">
                After purchase, write your letters, record your messages, and set
                delivery dates from your dashboard. Credits never expire.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
