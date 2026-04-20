"use client";

import { useState } from "react";

const MILESTONE_OPTIONS = [
  "Wedding Day",
  "Graduation",
  "First Child",
  "Retirement",
  "18th Birthday",
  "21st Birthday",
  "30th Birthday",
  "50th Birthday",
  "Other",
];

interface RequestModalProps {
  itemLabel: string;
  itemType: string;
  itemId: string;
  itemFormat?: string;
  onClose: () => void;
}

export default function RequestModal({ itemLabel, itemType, itemId, itemFormat, onClose }: RequestModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"open" | "date" | "milestone">("open");
  const [sealedUntil, setSealedUntil] = useState("");
  const [milestoneLabel, setMilestoneLabel] = useState("");
  const [customMilestone, setCustomMilestone] = useState("");

  async function handleSubmit() {
    if (deliveryMode === "date" && !sealedUntil) {
      setError("Please choose a date.");
      return;
    }
    if (deliveryMode === "milestone" && !milestoneLabel) {
      setError("Please choose a milestone.");
      return;
    }
    if (deliveryMode === "milestone" && milestoneLabel === "Other" && !customMilestone.trim()) {
      setError("Please enter a custom milestone name.");
      return;
    }

    setSending(true);
    setError("");

    const finalMilestone = milestoneLabel === "Other" ? customMilestone.trim() : milestoneLabel;

    // For milestones without a specific date, use a far-future sentinel
    // so the sealed logic works — user unlocks manually when the milestone arrives
    const effectiveSealedUntil =
      deliveryMode === "date" ? sealedUntil :
      deliveryMode === "milestone" ? "9999-12-31" :
      undefined;

    try {
      const res = await fetch("/api/message-uses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_type: "request",
          format: itemFormat || "letter",
          item_type: itemType,
          item_id: itemId,
          recipient_email: recipientEmail.trim() || undefined,
          content_text: prompt.trim() || undefined,
          sealed_until: effectiveSealedUntil,
          milestone_label: deliveryMode === "milestone" ? finalMilestone : undefined,
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
              <h4 className="text-lg font-bold text-navy">
                {recipientEmail.trim() ? "Request sent!" : "Link generated!"}
              </h4>
              <p className="mt-2 text-sm text-warm-gray">
                {recipientEmail.trim() ? (
                  <>We emailed <span className="font-medium text-navy">{recipientEmail}</span> with a link to record their message. You can also share the link directly.</>
                ) : (
                  <>Copy the link below and send it to whoever you want to record a message.</>
                )}
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
                  <label className="mb-1 block text-sm font-medium text-navy">
                    Recipient Email <span className="text-warm-gray-light">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="their@email.com"
                    className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <p className="mt-1 text-xs text-warm-gray-light">
                    Leave blank to just generate a shareable link.
                  </p>
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

                {/* Delivery Mode */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-navy">
                    When can you view this?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "open", label: "Open Anytime" },
                      { value: "date", label: "Locked Until Date" },
                      { value: "milestone", label: "Milestone" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDeliveryMode(opt.value)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          deliveryMode === opt.value
                            ? "border-gold bg-gold/10 text-navy"
                            : "border-cream-dark text-warm-gray hover:bg-cream-dark"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {deliveryMode === "date" && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-navy">Locked until</label>
                        <input
                          type="date"
                          value={sealedUntil}
                          onChange={(e) => setSealedUntil(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                        />
                      </div>
                      <p className="text-xs text-warm-gray-light">
                        The recording will be sealed and cannot be viewed until this date.
                      </p>
                    </div>
                  )}

                  {deliveryMode === "milestone" && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-navy">Milestone</label>
                        <select
                          value={milestoneLabel}
                          onChange={(e) => setMilestoneLabel(e.target.value)}
                          className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-sm text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                        >
                          <option value="">Select a milestone...</option>
                          {MILESTONE_OPTIONS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        {milestoneLabel === "Other" && (
                          <input
                            type="text"
                            value={customMilestone}
                            onChange={(e) => setCustomMilestone(e.target.value)}
                            placeholder="e.g. Moving Abroad"
                            className="mt-2 w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-sm text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                          />
                        )}
                      </div>
                      <p className="text-xs text-warm-gray-light">
                        The recording will stay sealed until you manually unlock it when the milestone arrives.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={sending}
                className="mt-5 w-full rounded-lg bg-gold px-4 py-3 text-sm font-bold text-navy shadow-sm transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Generating..." : recipientEmail.trim() ? "Send Request" : "Generate Link"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
