"use client";

import { useState } from "react";
import Link from "next/link";
import { addVoiceToCart } from "@/lib/cart";

const AUDIO_PRICE_CENTS = 500;
const VIDEO_PRICE_CENTS = 1000;

export default function BuyCreditsPage() {
  const [audioQty, setAudioQty] = useState(0);
  const [videoQty, setVideoQty] = useState(0);
  const [added, setAdded] = useState(false);

  const audioSubtotal = audioQty * AUDIO_PRICE_CENTS;
  const videoSubtotal = videoQty * VIDEO_PRICE_CENTS;
  const total = audioSubtotal + videoSubtotal;
  const canAdd = audioQty > 0 || videoQty > 0;

  function handleAddToCart() {
    addVoiceToCart({
      itemType: "voice",
      audioQuantity: audioQty,
      videoQuantity: videoQty,
      unitPriceAudio: AUDIO_PRICE_CENTS,
      unitPriceVideo: VIDEO_PRICE_CENTS,
      totalPrice: total,
    });
    setAdded(true);
  }

  function handleAddMore() {
    setAudioQty(0);
    setVideoQty(0);
    setAdded(false);
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Buy Audio &amp; Video Credits
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-warm-gray">
            Use credits to record messages for someone, or create a vault to
            collect messages from others. All credits are shared &mdash;{" "}
            <strong className="text-navy">$5 for audio</strong>,{" "}
            <strong className="text-navy">$10 for video</strong>.
          </p>
        </div>

        {/* Success state */}
        {added ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl border border-forest/30 bg-forest/5 p-8">
              <span className="text-4xl">&#10003;</span>
              <h2 className="mt-3 text-xl font-bold text-navy">
                Added to Cart!
              </h2>
              <p className="mt-2 text-warm-gray">
                Your audio &amp; video credits have been added to your cart.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light"
              >
                View Cart
              </Link>
              <button
                type="button"
                onClick={handleAddMore}
                className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-8 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
              >
                Add More
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Audio section */}
            <div className="rounded-xl border border-cream-dark bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    Audio Credits &mdash; $5 each
                  </h2>
                  <p className="mt-1 text-sm text-warm-gray">
                    Record a voice message OR let others record for you in a
                    vault
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  value={audioQty}
                  onChange={(e) =>
                    setAudioQty(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-20 rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-center text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              {audioQty > 0 && (
                <div className="mt-3 text-right text-sm font-medium text-navy">
                  Subtotal: ${(audioSubtotal / 100).toFixed(0)}
                </div>
              )}
            </div>

            {/* Video section */}
            <div className="rounded-xl border border-cream-dark bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    Video Credits &mdash; $10 each
                  </h2>
                  <p className="mt-1 text-sm text-warm-gray">
                    Record a video message OR let others record video for you in
                    a vault
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  value={videoQty}
                  onChange={(e) =>
                    setVideoQty(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-20 rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-center text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              {videoQty > 0 && (
                <div className="mt-3 text-right text-sm font-medium text-navy">
                  Subtotal: ${(videoSubtotal / 100).toFixed(0)}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
              <p className="text-sm text-warm-gray">Total</p>
              <p className="text-2xl font-extrabold text-navy">
                ${(total / 100).toFixed(0)}
              </p>
            </div>

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAdd}
              className="w-full rounded-lg bg-navy px-6 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart
            </button>
          </div>
        )}

        {/* Note */}
        <p className="mt-8 text-center text-sm text-warm-gray">
          From your dashboard, use credits to record messages for someone OR
          create a vault for others to record for you. Credits never expire.
        </p>
      </div>
    </div>
  );
}
