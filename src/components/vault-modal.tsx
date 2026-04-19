"use client";

import { useState } from "react";

interface VaultModalProps {
  itemLabel: string;
  itemType: string;
  itemId: string;
  onClose: () => void;
}

export default function VaultModal({ itemLabel, itemType, itemId, onClose }: VaultModalProps) {
  const [sealedUntil, setSealedUntil] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    if (!sealedUntil) {
      setError("Please choose a date.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/message-uses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_type: "vault",
          item_type: itemType,
          item_id: itemId,
          sealed_until: sealedUntil,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create vault link");
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
          <h3 className="text-lg font-semibold text-navy">Add to Vault</h3>
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
                <span className="text-3xl">🔐</span>
              </div>
              <h4 className="text-lg font-bold text-navy">Vault link ready!</h4>
              <p className="mt-2 text-sm text-warm-gray">
                Share this link so others can record/write for you. Content stays sealed until {new Date(sealedUntil + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
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
                Create a vault link for <span className="font-semibold text-navy">{itemLabel}</span>. Others can contribute messages sealed until the date you choose.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Sealed Until</label>
                <input
                  type="date"
                  value={sealedUntil}
                  onChange={(e) => setSealedUntil(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={sending}
                className="mt-5 w-full rounded-lg bg-gold px-4 py-3 text-sm font-bold text-navy shadow-sm transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Creating..." : "Create Vault Link"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
