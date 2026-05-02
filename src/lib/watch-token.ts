// HMAC-signed tokens for the /watch/[id] public viewer page. Used in
// recipient emails so the link is bound to a specific voice_message id and
// expires after 30 days. Re-uses CRON_SECRET (already provisioned in
// Vercel) so we don't need a new env var.

import crypto from "node:crypto";

const SECRET =
  process.env.CRON_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "fallback-not-secure";

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signWatchToken(
  id: string,
  ttlMs: number = DEFAULT_TTL_MS
): string {
  const exp = Date.now() + ttlMs;
  const payload = `${id}.${exp}`;
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return `${exp}.${sig}`;
}

export function verifyWatchToken(
  id: string,
  token: string | null | undefined
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expStr, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expectedSig = crypto
    .createHmac("sha256", SECRET)
    .update(`${id}.${exp}`)
    .digest("hex");
  if (sig.length !== expectedSig.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return false;
  }
}
