import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Minimal Etsy Open API v3 client.
 *
 * Auth model: a single OAuth token pair for the shop owner lives in the
 * etsy_tokens table (row id=1), seeded once by scripts/etsy/get-oauth-token.mjs.
 * Etsy rotates the refresh token on every refresh, so both tokens are
 * persisted back after each refresh.
 *
 * Env: ETSY_API_KEY (the app "keystring"), ETSY_SHOP_ID (numeric shop id).
 */

const TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";
const API_BASE = "https://openapi.etsy.com/v3/application";

interface EtsyTokenRow {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

async function getAccessToken(): Promise<string> {
  const { data: row, error } = await supabaseAdmin
    .from("etsy_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("id", 1)
    .maybeSingle<EtsyTokenRow>();

  if (error) throw new Error(`etsy_tokens read failed: ${error.message}`);
  if (!row) {
    throw new Error(
      "No Etsy OAuth token found — run scripts/etsy/get-oauth-token.mjs once to connect the shop."
    );
  }

  // Reuse while >2 min of life left; the cron runs every 15 min so a single
  // runner refreshes at most once per invocation (no concurrent-rotation risk).
  if (new Date(row.expires_at).getTime() - Date.now() > 120_000) {
    return row.access_token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.ETSY_API_KEY,
      refresh_token: row.refresh_token,
    }),
  });
  if (!res.ok) {
    throw new Error(`Etsy token refresh failed (${res.status}): ${await res.text()}`);
  }
  const tok = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  };

  const { error: upErr } = await supabaseAdmin
    .from("etsy_tokens")
    .update({
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (upErr) {
    // Tokens rotated on Etsy's side but we failed to persist — surface loudly,
    // because the stored refresh token is now stale.
    throw new Error(`Etsy token persist failed after refresh: ${upErr.message}`);
  }

  return tok.access_token;
}

export async function etsyFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey) throw new Error("ETSY_API_KEY is not set");
  const token = await getAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Etsy API ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface EtsyTransaction {
  transaction_id: number;
  listing_id: number;
  quantity: number;
  title?: string;
}

export interface EtsyReceipt {
  receipt_id: number;
  buyer_email: string | null;
  name: string | null;
  message_from_buyer: string | null;
  created_timestamp: number;
  is_paid: boolean;
  transactions: EtsyTransaction[];
}

export async function getUnshippedPaidReceipts(shopId: string): Promise<EtsyReceipt[]> {
  const data = await etsyFetch<{ count: number; results: EtsyReceipt[] }>(
    `/shops/${shopId}/receipts?was_paid=true&was_shipped=false&limit=25`
  );
  return data.results ?? [];
}

export async function markReceiptShipped(shopId: string, receiptId: number): Promise<void> {
  await etsyFetch(`/shops/${shopId}/receipts/${receiptId}`, {
    method: "PUT",
    body: JSON.stringify({ was_shipped: true }),
  });
}
