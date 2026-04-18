"use client";

import { useState } from "react";

interface GiftItemModalProps {
  itemType: "letter" | "voice_message" | "gift_credit";
  itemId: string;
  itemLabel: string; // e.g. "Classic Gift Credit" or "Letter to Mom"
  onClose: () => void;
}

export default function GiftItemModal({
  itemType,
  itemId,
  itemLabel,
  onClose,
}: GiftItemModalProps) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [claimUrl, setClaimUrl] = useState("");

  async function handleSend() {
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/gifts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          itemId,
          recipientName: recipientName.trim() || undefined,
          recipientEmail: recipientEmail.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create gift link");
        setSending(false);
        return;
      }

      setClaimUrl(data.claimUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setSending(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(claimUrl);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cream-dark px-6 py-4">
          <h3 className="text-lg font-semibold text-navy">
            Send as Gift
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-navy"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {claimUrl ? (
            /* Success state */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-8 w-8 text-forest"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-navy">
                Your gift link is ready!
              </h4>
              <p className="mt-2 text-sm text-warm-gray">
                {recipientEmail
                  ? `We sent an email to ${recipientEmail} with the claim link.`
                  : "Share this link with your recipient."}
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-cream-dark bg-cream/50 p-3">
                <input
                  type="text"
                  readOnly
                  value={claimUrl}
                  className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-gold-light"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-lg border-2 border-navy px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
              >
                Done
              </button>
            </div>
          ) : (
            /* Form state */
            <>
              <p className="mb-4 text-sm text-warm-gray">
                Gift <span className="font-semibold text-navy">{itemLabel}</span> to
                someone special.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">
                    Recipient Name{" "}
                    <span className="text-warm-gray-light">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Their name"
                    className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">
                    Recipient Email{" "}
                    <span className="text-warm-gray-light">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="their@email.com"
                    className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <p className="mt-1 text-xs text-warm-gray-light">
                    If provided, we&apos;ll email them the claim link.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">
                    Personal Message{" "}
                    <span className="text-warm-gray-light">(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value.slice(0, 200))
                    }
                    placeholder="Add a personal note..."
                    rows={3}
                    className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                  />
                  <p className="mt-1 text-right text-xs text-warm-gray-light">
                    {message.length}/200
                  </p>
                </div>
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleSend}
                disabled={sending}
                className="mt-5 w-full rounded-lg bg-gold px-4 py-3 text-sm font-bold text-navy shadow-sm transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Creating Gift Link..." : "Send Gift Link"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
