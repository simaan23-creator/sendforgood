"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import VoiceRecorder, { type MediaFormat } from "@/components/VoiceRecorder";
import { addVoiceMessageToCart } from "@/lib/cart";

interface FormData {
  recipientName: string;
  relationship: string;
  messageType: "annual" | "milestone";
  title: string;
  recipientEmail: string;
  years: number;
}

const AUDIO_PRICE_CENTS = 500;  // $5/yr
const VIDEO_PRICE_CENTS = 1000; // $10/yr

export default function RecordVoiceMessagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType =
    searchParams.get("type") === "milestone" ? "milestone" : "annual";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    recipientName: "",
    relationship: "",
    messageType: initialType,
    title: "",
    recipientEmail: "",
    years: 5,
  });

  const [messageFormat, setMessageFormat] = useState<MediaFormat>("audio");

  const [milestoneQuantity, setMilestoneQuantity] = useState<
    "single" | "bundle5" | "bundle10"
  >("single");

  const mediaBlobRef = useRef<Blob | null>(null);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);

  function update(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const unitPriceCents = messageFormat === "video" ? VIDEO_PRICE_CENTS : AUDIO_PRICE_CENTS;

  function getPrice(): number {
    if (form.messageType === "annual") {
      return (unitPriceCents / 100) * form.years;
    }
    if (milestoneQuantity === "bundle5") return (unitPriceCents / 100) * 5;
    if (milestoneQuantity === "bundle10") return (unitPriceCents / 100) * 10;
    return unitPriceCents / 100;
  }

  function getPriceCents(): number {
    if (form.messageType === "annual") {
      return unitPriceCents * form.years;
    }
    if (milestoneQuantity === "bundle5") return unitPriceCents * 5;
    if (milestoneQuantity === "bundle10") return unitPriceCents * 10;
    return unitPriceCents;
  }

  function getQuantityLabel(): string {
    if (form.messageType === "annual") {
      return `${form.years} year${form.years > 1 ? "s" : ""} ($${unitPriceCents / 100}/yr)`;
    }
    if (milestoneQuantity === "bundle5") return "5 Milestone Messages";
    if (milestoneQuantity === "bundle10") return "10 Milestone Messages";
    return "1 Milestone Message";
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return (
          form.recipientName.trim().length > 0 &&
          form.relationship.trim().length > 0
        );
      case 2:
        return hasRecording && form.title.trim().length > 0;
      case 3:
        return (
          form.recipientEmail.trim().length > 0 &&
          form.recipientEmail.includes("@")
        );
      case 4:
        return true;
      default:
        return true;
    }
  }

  function handleRecordingComplete(blob: Blob, durationSeconds: number) {
    mediaBlobRef.current = blob;
    setMediaDuration(durationSeconds);
    setHasRecording(true);
  }

  function handleAddToCart() {
    const quantity =
      form.messageType === "annual"
        ? form.years
        : milestoneQuantity === "bundle10"
          ? 10
          : milestoneQuantity === "bundle5"
            ? 5
            : 1;

    addVoiceMessageToCart({
      itemType: "voice-message",
      recipientName: form.recipientName,
      recipientEmail: form.recipientEmail,
      messageType: form.messageType,
      messageFormat,
      title: form.title,
      quantity,
      durationSeconds: mediaDuration,
      unitPrice: unitPriceCents,
      totalPrice: getPriceCents(),
    });

    router.push("/cart");
  }

  const totalSteps = 4;
  const progressPercent = (step / totalSteps) * 100;
  const priceLabel = `$${unitPriceCents / 100}`;

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
            Record Your {messageFormat === "video" ? "Video" : "Voice"} Message
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

        {/* Step 1: Recipient */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Who is this message for?
            </h2>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Recipient&apos;s Name
              </label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Your Relationship
              </label>
              <input
                type="text"
                value={form.relationship}
                onChange={(e) => update("relationship", e.target.value)}
                placeholder="e.g. Daughter, Son, Grandchild, Friend"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Message Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update("messageType", "annual")}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    form.messageType === "annual"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <p className="font-semibold text-navy">Annual Message</p>
                  <p className="mt-1 text-xs text-warm-gray">
                    Delivered every year on their date
                  </p>
                  <p className="mt-2 text-sm font-bold text-gold">From $5/yr</p>
                </button>
                <button
                  type="button"
                  onClick={() => update("messageType", "milestone")}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    form.messageType === "milestone"
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/50"
                  }`}
                >
                  <p className="font-semibold text-navy">Milestone Message</p>
                  <p className="mt-1 text-xs text-warm-gray">
                    One-time delivery for a special moment
                  </p>
                  <p className="mt-2 text-sm font-bold text-gold">From $5</p>
                </button>
              </div>
            </div>

            {/* Quantity selection */}
            {form.messageType === "annual" ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  How many years?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={form.years}
                    onChange={(e) => update("years", parseInt(e.target.value))}
                    className="flex-1 accent-gold"
                  />
                  <span className="w-16 text-center text-lg font-bold text-navy">
                    {form.years} yr{form.years > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-warm-gray">
                  Total:{" "}
                  <span className="font-semibold text-navy">${getPrice()}</span>{" "}
                  ({priceLabel}/yr &times; {form.years} years)
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Pricing
                </label>
                <div className="space-y-2">
                  {(
                    [
                      {
                        id: "single" as const,
                        label: "1 Milestone Message",
                        price: `$${unitPriceCents / 100}`,
                      },
                      {
                        id: "bundle5" as const,
                        label: "5 Milestone Messages",
                        price: `$${(unitPriceCents / 100) * 5}`,
                      },
                      {
                        id: "bundle10" as const,
                        label: "10 Milestone Messages",
                        price: `$${(unitPriceCents / 100) * 10}`,
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMilestoneQuantity(opt.id)}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        milestoneQuantity === opt.id
                          ? "border-gold bg-gold/5"
                          : "border-cream-dark bg-white hover:border-gold/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-navy">
                          {opt.label}
                        </span>
                        <span className="font-bold text-navy">{opt.price}</span>
                      </div>
                      {opt.id === "bundle5" && (
                        <span className="mt-1 inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                          5-pack
                        </span>
                      )}
                      {opt.id === "bundle10" && (
                        <span className="mt-1 inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                          Best value
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Record */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Record your message for {form.recipientName}
            </h2>
            <p className="text-sm text-warm-gray">
              Speak from the heart. You can re-record as many times as you like.
              Up to 5 minutes.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Message Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={`e.g. Happy Birthday ${form.recipientName}`}
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onFormatChange={(f) => setMessageFormat(f)}
              defaultFormat={messageFormat}
            />

            {/* Pricing note based on format */}
            <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-center">
              <p className="text-sm text-navy">
                {messageFormat === "video" ? (
                  <>Video Message: <span className="font-bold">$10/year</span> &mdash; the most powerful message you can leave behind</>
                ) : (
                  <>Audio Message: <span className="font-bold">$5/year</span> &mdash; switch to Video for $10/year</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Delivery Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">
              Where should we email {form.recipientName}&apos;s message?
            </h2>
            <p className="text-sm text-warm-gray">
              We&apos;ll send a secure {messageFormat === "video" ? "viewing" : "listening"} link to this email on the
              scheduled date.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => update("recipientEmail", e.target.value)}
                placeholder="recipient@example.com"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 4: Review & Pay */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Review & Add to Cart</h2>

            <div className="rounded-xl border border-cream-dark bg-white p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Recipient</span>
                <span className="text-sm font-medium text-navy">
                  {form.recipientName} ({form.relationship})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Message Type</span>
                <span className="text-sm font-medium text-navy capitalize">
                  {form.messageType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Format</span>
                <span className="text-sm font-medium text-navy">
                  {messageFormat === "video" ? "Video Message" : "Audio Message"} &mdash; {priceLabel}/yr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Delivery</span>
                <span className="text-sm font-medium text-navy">
                  Digital (Email)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Quantity</span>
                <span className="text-sm font-medium text-navy">
                  {getQuantityLabel()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Title</span>
                <span className="text-sm font-medium text-navy">
                  {form.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Recording</span>
                <span className="text-sm font-medium text-navy">
                  {Math.floor(mediaDuration / 60)}:{(mediaDuration % 60)
                    .toString()
                    .padStart(2, "0")}{" "}
                  recorded
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-gray">Recipient Email</span>
                <span className="text-sm font-medium text-navy">
                  {form.recipientEmail}
                </span>
              </div>

              <div className="border-t border-cream-dark pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-navy">Total</span>
                  <span className="text-2xl font-extrabold text-navy">
                    ${getPrice()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full rounded-lg bg-forest px-6 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart &mdash; ${getPrice()}
            </button>

            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
              <p className="text-sm text-navy">
                After purchase, you&apos;ll configure delivery dates, re-record
                if needed, and set up your executor from your dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="rounded-lg border border-cream-dark px-6 py-3 text-sm font-medium text-warm-gray transition hover:bg-cream-dark disabled:invisible"
            >
              Back
            </button>
            <button
              onClick={() => setStep(Math.min(totalSteps, step + 1))}
              disabled={!canAdvance()}
              className="rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
