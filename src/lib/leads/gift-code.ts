/**
 * Shared claim-code generator for vault gift purchases.
 *
 * Used by both the Stripe webhook (in-app gifts) and the Etsy admin mint
 * endpoint (open-redemption codes). 16 chars from a 55-char alphabet
 * (~91 bits of entropy) is overkill for collision resistance but cheap.
 * Excludes visually ambiguous chars (0/O, 1/I/l) to make verbal/written
 * sharing less error-prone.
 *
 * Callers should retry on `23505` from the unique index on claim_code.
 */
export function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
