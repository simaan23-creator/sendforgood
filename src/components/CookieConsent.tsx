"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";

const CONSENT_KEY = "sfg_cookie_consent_v1";
type Consent = "accepted" | "rejected";

const GA_ID = "G-622H0QNK45";
const ADS_ID = "AW-17462992858";

/**
 * Cookie consent banner.
 *
 * Loads Google Analytics + Google Ads tags only after the user accepts.
 * Uses Google Consent Mode v2 defaults (deny everything until consent).
 *
 * Persists choice in localStorage; banner only re-appears if cleared.
 */
export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored === "accepted" || stored === "rejected") {
        setConsent(stored);
      }
    } catch {
      // localStorage may be unavailable (private mode, embedded contexts).
    }
  }, []);

  function record(choice: Consent) {
    setConsent(choice);
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Best-effort; banner will reappear next visit if storage failed.
    }
    // Update Google Consent Mode in real-time so accept-then-browse works
    // without a reload.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (typeof w.gtag === "function") {
      const granted = choice === "accepted" ? "granted" : "denied";
      w.gtag("consent", "update", {
        ad_storage: granted,
        ad_user_data: granted,
        ad_personalization: granted,
        analytics_storage: granted,
      });
    }
  }

  return (
    <>
      {/* Consent Mode v2 defaults — set BEFORE any GA/Ads tag loads. */}
      <Script id="consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500
        });
      `}</Script>

      {/* GA + Ads load only once the user has actively accepted. Tags themselves
          respect Consent Mode and won't drop cookies until 'granted'. */}
      {consent === "accepted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-config" strategy="afterInteractive">{`
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
            gtag('config', '${ADS_ID}');
          `}</Script>
        </>
      )}

      {/* Banner: only renders once hydrated and only if no choice yet. */}
      {hydrated && consent === null && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg"
        >
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              We use cookies for analytics and to measure ad performance. See our{" "}
              <Link href="/privacy" className="underline text-navy">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => record("rejected")}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Reject
              </button>
              <button
                onClick={() => record("accepted")}
                className="px-4 py-2 text-sm rounded-md bg-navy text-white hover:bg-navy-light"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
