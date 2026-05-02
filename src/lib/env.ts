/**
 * Environment variable accessors with explicit, eager validation.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const key = env.STRIPE_SECRET_KEY;
 *
 * If a required variable is missing, the first access throws with a clear
 * message naming the variable. Imports that just touch `env` for typing won't
 * trigger validation — the check happens at access time, so build-time
 * imports for type info don't fail.
 *
 * Public (NEXT_PUBLIC_*) vars are also exposed for completeness, though
 * Next.js inlines them at build time so a missing public var is usually
 * caught earlier.
 */

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "ADMIN_PASSWORD",
  "CRON_SECRET",
] as const;

const OPTIONAL = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_GA_ID",
  "NEXT_PUBLIC_GOOGLE_ADS_ID",
  "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE",
  "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_SIGNUP",
  "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_VAULT_CREATED",
] as const;

type RequiredKey = (typeof REQUIRED)[number];
type OptionalKey = (typeof OPTIONAL)[number];

function read(name: RequiredKey): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local for dev or in Vercel project settings for prod. ` +
        `See .env.example for the full list.`
    );
  }
  return value;
}

function readOptional(name: OptionalKey): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() { return read("NEXT_PUBLIC_SUPABASE_URL"); },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return read("NEXT_PUBLIC_SUPABASE_ANON_KEY"); },
  get SUPABASE_SERVICE_ROLE_KEY() { return read("SUPABASE_SERVICE_ROLE_KEY"); },
  get STRIPE_SECRET_KEY() { return read("STRIPE_SECRET_KEY"); },
  get NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY() { return read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"); },
  get STRIPE_WEBHOOK_SECRET() { return read("STRIPE_WEBHOOK_SECRET"); },
  get RESEND_API_KEY() { return read("RESEND_API_KEY"); },
  get ADMIN_PASSWORD() { return read("ADMIN_PASSWORD"); },
  get CRON_SECRET() { return read("CRON_SECRET"); },

  get NEXT_PUBLIC_APP_URL() { return readOptional("NEXT_PUBLIC_APP_URL"); },
  get NEXT_PUBLIC_SITE_URL() { return readOptional("NEXT_PUBLIC_SITE_URL"); },
  get NEXT_PUBLIC_BASE_URL() { return readOptional("NEXT_PUBLIC_BASE_URL"); },
  get NEXT_PUBLIC_GA_ID() { return readOptional("NEXT_PUBLIC_GA_ID"); },
  get NEXT_PUBLIC_GOOGLE_ADS_ID() { return readOptional("NEXT_PUBLIC_GOOGLE_ADS_ID"); },
  get NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE() { return readOptional("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE"); },
  get NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_SIGNUP() { return readOptional("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_SIGNUP"); },
  get NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_VAULT_CREATED() { return readOptional("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_VAULT_CREATED"); },
};

/**
 * Validate every required var at once. Call this from a startup probe (e.g.
 * the health check) to fail loudly when an env var is missing rather than
 * waiting for the first user-facing request that needs it.
 */
export function validateRequiredEnv(): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  for (const name of REQUIRED) {
    const value = process.env[name];
    if (!value || value.length === 0) missing.push(name);
  }
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
