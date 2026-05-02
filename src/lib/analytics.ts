// Client-side analytics helpers. Wraps gtag() so callers don't need to know
// about consent, env-var fallbacks, or per-event payload shape.
//
// Architecture (v1, 2026-05-02):
//   - GA4 + Google Ads pixel are loaded by CookieConsent.tsx after the user
//     accepts cookies (Consent Mode v2 default = denied).
//   - Conversion events fire from page-level useEffects via the helpers
//     below. Each helper is idempotent within a browser session via a
//     sessionStorage dedup key, so refreshing a success page won't double-
//     count.
//   - If consent was rejected (or never given), helpers no-op silently.
//   - Env vars (NEXT_PUBLIC_*) supply the conversion labels Google Ads
//     assigns when you create a conversion action. Until those are set,
//     events still fire to GA4 but the Ads-specific conversion fire is
//     skipped (would otherwise misroute).

const CONSENT_KEY = "sfg_cookie_consent_v1";

const ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-17462992858";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GtagFn = (...args: any[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return typeof w.gtag === "function" ? (w.gtag as GtagFn) : null;
}

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function dedupeOnce(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(key) === "1") return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    // Storage unavailable — let the event fire. Worst case: re-fires on a
    // refresh, which Google Ads will dedupe via transaction_id if provided.
    return true;
  }
}

/**
 * Fire a generic GA4 event. No-op if consent not granted or gtag not loaded.
 */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {}
): void {
  if (!hasConsent()) return;
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", eventName, params);
}

/**
 * Fire a Google Ads conversion. Requires the conversion label (the suffix
 * after the slash in `AW-XXXXX/YYYYY`). Caller passes the label name
 * (e.g. "purchase") and we look up the env var.
 */
export function trackAdsConversion(
  labelEnvVar:
    | "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE"
    | "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_SIGNUP"
    | "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_VAULT_CREATED",
  params: { value?: number; currency?: string; transaction_id?: string } = {}
): void {
  if (!hasConsent()) return;
  const gtag = getGtag();
  if (!gtag) return;
  const label = process.env[labelEnvVar];
  if (!label) {
    // No label configured yet — don't fire (would misroute to no-op tag).
    // Dev-only console hint so we know why nothing's showing up.
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[analytics] Skipped Ads conversion: ${labelEnvVar} not set`
      );
    }
    return;
  }
  gtag("event", "conversion", {
    send_to: `${ADS_ID}/${label}`,
    ...params,
  });
}

/**
 * Conversion: a brand-new user has signed up. Fires once per browser session
 * keyed on user_id.
 */
export function trackSignup(userId: string): void {
  if (!userId) return;
  if (!dedupeOnce(`sfg_track_signup_${userId}`)) return;
  trackEvent("sign_up", { method: "supabase" });
  trackAdsConversion("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_SIGNUP", {
    transaction_id: userId,
  });
}

/**
 * Conversion: user created a vault. Fires once per browser session keyed on
 * the vault's unique_code.
 */
export function trackVaultCreated(uniqueCode: string): void {
  if (!uniqueCode) return;
  if (!dedupeOnce(`sfg_track_vault_${uniqueCode}`)) return;
  trackEvent("vault_created", { unique_code: uniqueCode });
  trackAdsConversion("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_VAULT_CREATED", {
    transaction_id: uniqueCode,
  });
}

/**
 * Conversion: a purchase completed. `transactionId` should be unique per
 * order (Stripe session id, or a synthetic value-based key as a fallback).
 * Fires once per browser session keyed on transactionId.
 */
export function trackPurchase(opts: {
  transactionId: string;
  valueUsd: number;
  itemCategory?: string;
}): void {
  if (!opts.transactionId) return;
  if (!dedupeOnce(`sfg_track_purchase_${opts.transactionId}`)) return;
  trackEvent("purchase", {
    transaction_id: opts.transactionId,
    value: opts.valueUsd,
    currency: "USD",
    items: opts.itemCategory
      ? [{ item_category: opts.itemCategory, price: opts.valueUsd, quantity: 1 }]
      : undefined,
  });
  trackAdsConversion("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE", {
    value: opts.valueUsd,
    currency: "USD",
    transaction_id: opts.transactionId,
  });
}
