"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * First-visit attribution prompt rendered at the top of /dashboard.
 *
 * Renders nothing until the profile row loads. Hides itself permanently
 * (in this component instance) after submit or dismiss — the server side
 * also stamps the row so we won't re-prompt on later visits.
 *
 * Options match the PRESET_SOURCES set in /api/profile/heard-about-us.
 * "vendor", "friend", and "other" reveal a small free-text detail field
 * so we can capture *which* vendor or friend, which is the actually
 * useful signal.
 */

type Option = {
  key: "google" | "pinterest" | "social" | "etsy" | "friend" | "vendor" | "other";
  label: string;
  detailLabel?: string;
  detailPlaceholder?: string;
};

const OPTIONS: Option[] = [
  { key: "google", label: "Google search" },
  { key: "pinterest", label: "Pinterest" },
  { key: "social", label: "Instagram / TikTok / social" },
  { key: "etsy", label: "Etsy" },
  {
    key: "vendor",
    label: "A wedding vendor told me",
    detailLabel: "Which vendor? (optional)",
    detailPlaceholder: "Photographer, planner, officiant…",
  },
  {
    key: "friend",
    label: "A friend recommended it",
    detailLabel: "Who? (optional)",
    detailPlaceholder: "First name is fine",
  },
  {
    key: "other",
    label: "Other",
    detailLabel: "Tell us more (optional)",
    detailPlaceholder: "How'd you find us?",
  },
];

export default function HeardAboutUsPrompt() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Option["key"] | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setReady(true);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("heard_about_us, heard_about_us_dismissed_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const shouldShow =
        !!data && !data.heard_about_us && !data.heard_about_us_dismissed_at;
      setVisible(shouldShow);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(opt: Option) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/profile/heard-about-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: opt.key, sourceDetail: detail }),
      });
      setThanks(true);
      setTimeout(() => setVisible(false), 1800);
    } finally {
      setSubmitting(false);
    }
  }

  async function dismiss() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/profile/heard-about-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
      setVisible(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || !visible) return null;

  const selectedOpt = selected
    ? OPTIONS.find((o) => o.key === selected) || null
    : null;

  if (thanks) {
    return (
      <div className="mb-6 rounded-xl border border-forest/30 bg-forest/5 px-5 py-4 text-sm text-forest">
        Thanks &mdash; that really helps us figure out what&apos;s working.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-cream-dark bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-warm-gray">
            One quick question
          </p>
          <p className="mt-1 text-sm font-semibold text-navy">
            How did you hear about SealTheDay?
          </p>
          <p className="mt-1 text-xs text-warm-gray">
            We&apos;re a tiny team and your answer genuinely helps us figure out what&apos;s working.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {OPTIONS.map((opt) => {
              const isSel = selected === opt.key;
              const needsDetail = !!opt.detailLabel;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (needsDetail) {
                      setSelected(opt.key);
                    } else {
                      setSelected(opt.key);
                      submit(opt);
                    }
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isSel
                      ? "border-navy bg-navy text-white"
                      : "border-cream-dark bg-cream text-navy hover:border-navy"
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {selectedOpt?.detailLabel && (
            <div className="mt-3">
              <label className="block text-xs text-warm-gray">
                {selectedOpt.detailLabel}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={detail}
                  maxLength={120}
                  placeholder={selectedOpt.detailPlaceholder}
                  onChange={(e) => setDetail(e.target.value)}
                  className="flex-1 rounded-md border border-cream-dark px-3 py-1.5 text-sm outline-none focus:border-navy"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => submit(selectedOpt)}
                  className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          disabled={submitting}
          className="shrink-0 text-xs text-warm-gray hover:text-navy hover:underline"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
