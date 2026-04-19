"use client";

import { useState } from "react";

interface RequestModalProps {
  itemLabel: string;
  itemType: string;
  itemId: string;
  onClose: () => void;
}

export default function RequestModal({ itemLabel, itemType, itemId, onClose }: RequestModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    if (!recipientEmail.trim()) {
      setError("Email is required.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/message-uses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_type: "request",
          item_type: itemType,
          item_id: itemId,
          recipient_email: recipientEmail.trim(),
          content_text: prompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send request");
      } else {
        setLink(data.link);
      }
    } catch {
      setError("Something went wrong.");
    }
    setSending(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-cream-dark px-6 py-4">
          <h3 className="text-lg font-semibold text-navy">Request a Message</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-navy">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {link ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
                <span className="text-3xl">📨</span>
              </div>
              <h4 className="text-lg font-bold text-navy">Request sent!</h4>
              <p className="mt-2 text-sm text-warm-gray">
                We emailed <span className="font-medium text-navy">{recipientEmail}</span> with a link to record their message. You can also share the link directly.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-cream-dark bg-cream/50 p-3">
                <input type="text" readOnly value={link} className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none" />
                <button onClick={handleCopy} className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-gold-light">
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button onClick={onClose} className="mt-5 w-full rounded-lg border-2 border-navy px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream">
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-warm-gray">
                Ask someone to record/write a message for <span className="font-semibold text-navy">{itemLabel}</span>.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="their@email.com"
                    className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">
                    What should they record? <span className="text-warm-gray-light">(optional)</span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
                    placeholder="e.g. Share your favorite memory with Dad..."
                    rows={3}
                    className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                  />
                  <p className="mt-1 text-right text-xs text-warm-gray-light">{prompt.length}/300</p>
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={sending}
                className="mt-5 w-full rounded-lg bg-gold px-4 py-3 text-sm font-bold text-navy shadow-sm transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Request"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
