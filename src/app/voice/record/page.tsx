"use client";

import { useState } from "react";
import Link from "next/link";

type MediaFormat = "audio" | "video";

const AUDIO_PRICE_CENTS = 500;
const VIDEO_PRICE_CENTS = 1000;

export default function RecordVoiceMessagePage() {
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [messageFormat, setMessageFormat] = useState<MediaFormat>("audio");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unitPriceCents =
    messageFormat === "video" ? VIDEO_PRICE_CENTS : AUDIO_PRICE_CENTS;
  const totalCents = unitPriceCents * quantity;
  const totalDollars = totalCents / 100;
  const unitDollars = unitPriceCents / 100;

  const canAdvanceToStep2 =
    recipientName.trim().length > 0 &&
    recipientEmail.trim().length > 0 &&
    recipientEmail.includes("@");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/voice/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          messageFormat,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const totalSteps = 2;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/voice"
            className="text-sm font-medium text-warm-gray hover:text-navy transition-colors"
          >
            &larr; Back to Voice Messages
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-navy">
            Send a {messageFormat === "video" ? "Video" : "Voice"} Message
          </h1>
          <p className="mt-2 text-warm-gray">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-10 h-2 w-full overflow-hidden rounded-full bg-cream-dark">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step 1: Who + Format + Quantity */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Who is this for &amp; how many?
            </h2>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Recipient&apos;s Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Their Email Address
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <p className="mt-1 text-xs text-warm-gray">
                We&apos;ll deliver your message to this email
              </p>
            </div>

            {/* Format selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Message Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMessageFormat("audio")}
                  className={`rounded-lg border-2 p-5 text-center transition ${
                    messageFormat === "audio"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <span className="text-3xl">🎙️</span>
                  <p className="mt-2 font-semibold text-navy">Audio</p>
                  <p className="mt-1 text-lg font-bold text-gold">$5/yr</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMessageFormat("video")}
                  className={`rounded-lg border-2 p-5 text-center transition ${
                    messageFormat === "video"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <span className="text-3xl">🎥</span>
                  <p className="mt-2 font-semibold text-navy">Video</p>
                  <p className="mt-1 text-lg font-bold text-gold">$10/yr</p>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                How many years/messages?
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* Total */}
            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
              <p className="text-sm text-warm-gray">Total</p>
              <p className="text-2xl font-extrabold text-navy">
                ${totalDollars}
              </p>
              <p className="text-xs text-warm-gray">
                ${unitDollars}/yr &times; {quantity} year
                {quantity > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Review & Pay */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Review &amp; Pay</h2>

            <div className="rounded-xl border border-cream-dark bg-white p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Recipient</span>
                <span className="text-sm font-medium text-navy">
                  {recipientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Delivery Email</span>
                <span className="text-sm font-medium text-navy">
                  {recipientEmail}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Format</span>
                <span className="text-sm font-medium text-navy">
                  {messageFormat === "video" ? "Video Message" : "Audio Message"}{" "}
                  &mdash; ${unitDollars}/yr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Quantity</span>
                <span className="text-sm font-medium text-navy">
                  {quantity} year{quantity > 1 ? "s" : ""}
                </span>
              </div>

              <div className="border-t border-cream-dark pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-navy">Total</span>
                  <span className="text-2xl font-extrabold text-navy">
                    ${totalDollars}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
              <p className="text-sm text-navy">
                After purchase, set the delivery date and record your message
                from your dashboard. No rush.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-center">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-lg bg-forest px-6 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Redirecting to payment..." : `Pay $${totalDollars}`}
            </button>
          </div>
        )}

        {/* Navigation */}
        {step === 1 && (
          <div className="mt-10 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canAdvanceToStep2}
              className="rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-10">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-cream-dark px-6 py-3 text-sm font-medium text-warm-gray transition hover:bg-cream-dark"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
