/**
 * Lightweight in-memory token-bucket rate limiter.
 *
 * Limitations:
 *  - Per serverless instance only. Cold starts reset state, and traffic
 *    distributed across regions will be limited per-region. This is a
 *    "good enough" stopgap for low-traffic launch; upgrade to Upstash
 *    Redis (or similar) once traffic grows.
 *  - Memory grows linearly with unique keys; we sweep stale entries on
 *    each call to bound usage.
 */

type Bucket = {
  tokens: number;
  lastRefill: number; // epoch ms
};

const buckets = new Map<string, Bucket>();
const SWEEP_AFTER_MS = 60 * 60 * 1000; // 1 hour idle => evict
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 5 * 60 * 1000) return; // sweep at most every 5 min
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > SWEEP_AFTER_MS) buckets.delete(key);
  }
  lastSweep = now;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Consume one token from the bucket identified by `key`.
 *
 * @param key            unique limit key (e.g. `contact:1.2.3.4`)
 * @param capacity       max tokens the bucket holds (burst size)
 * @param refillPerSec   how many tokens regenerate per second
 */
export function rateLimit(
  key: string,
  capacity: number,
  refillPerSec: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSec);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      retryAfterSec: 0,
    };
  }

  const needed = 1 - bucket.tokens;
  const retryAfterSec = Math.ceil(needed / refillPerSec);
  return { allowed: false, remaining: 0, retryAfterSec };
}

/**
 * Best-effort client IP from common Vercel/proxy headers.
 * Falls back to a constant ("unknown") so we still rate-limit globally
 * if no IP is available rather than letting all requests through.
 */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
