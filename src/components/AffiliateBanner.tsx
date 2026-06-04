"use client";

import { useEffect, useState } from "react";

// D2: co-branded landing banner. Reads the sfg_affiliate cookie set by
// the middleware on ?ref=CODE, fetches the public lookup endpoint to get
// the photographer's display name, and shows "Recommended by [Name]" at
// the top of the marketing pages.
//
// The banner is dismissible; the dismissal is per-tab (sessionStorage) so
// closing it doesn't permanently hide the attribution from someone who
// returns later via the same link.

const DISMISS_KEY_PREFIX = "sfg_aff_banner_dismissed_";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export function AffiliateBanner() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const refCode = readCookie("sfg_affiliate");
    if (!refCode || !/^[a-z0-9_-]+$/.test(refCode)) return;
    setCode(refCode);

    // Per-tab dismissal: respect the user's previous choice for this code.
    try {
      if (sessionStorage.getItem(DISMISS_KEY_PREFIX + refCode) === "1") {
        setDismissed(true);
        return;
      }
    } catch {
      // sessionStorage can throw in private mode — proceed without it.
    }

    let cancelled = false;
    fetch(`/api/affiliate/lookup?code=${encodeURIComponent(refCode)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || !data.display_name) return;
        setDisplayName(String(data.display_name));
      })
      .catch(() => {
        // Silent: banner just won't render.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleDismiss() {
    setDismissed(true);
    if (code) {
      try {
        sessionStorage.setItem(DISMISS_KEY_PREFIX + code, "1");
      } catch {
        // ignore
      }
    }
  }

  if (!displayName || dismissed) return null;

  return (
    <div className="bg-navy text-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-sm sm:px-6">
        <p className="leading-snug">
          <span className="opacity-70">Recommended by</span>{" "}
          <strong className="font-semibold text-gold">{displayName}</strong>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="rounded-full px-2 py-0.5 text-xs text-cream/70 transition hover:text-cream"
        >
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}
