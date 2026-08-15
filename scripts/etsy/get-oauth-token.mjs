#!/usr/bin/env node
/**
 * One-time Etsy OAuth connect for the SealTheDay shop.
 *
 * Prereqs:
 *   1. Create an app at https://www.etsy.com/developers/your-apps
 *   2. Add callback URL exactly:  http://localhost:3999/callback
 *   3. Put the app keystring in .env.local as ETSY_API_KEY=...
 *
 * Usage: node scripts/etsy/get-oauth-token.mjs
 *   - prints an authorize URL; open it, click "Allow access"
 *   - captures the callback, exchanges the code (PKCE), stores the token
 *     pair in the etsy_tokens table, and prints your ETSY_SHOP_ID.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "node:http";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const API_KEY = env.ETSY_API_KEY;
if (!API_KEY) {
  console.error("ETSY_API_KEY missing from .env.local — create the app first (see header).");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const REDIRECT_URI = "http://localhost:3999/callback";
const SCOPES = "transactions_r transactions_w email_r";

const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const verifier = b64url(crypto.randomBytes(32));
const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
const state = b64url(crypto.randomBytes(16));

const authUrl =
  `https://www.etsy.com/oauth/connect?response_type=code` +
  `&client_id=${API_KEY}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&state=${state}` +
  `&code_challenge=${challenge}` +
  `&code_challenge_method=S256`;

console.log("\n1. Open this URL in your browser (signed in to the SealTheDay Etsy account):\n");
console.log(authUrl);
console.log("\n2. Click 'Allow access'. Waiting for the callback on :3999 ...\n");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3999");
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  const gotState = url.searchParams.get("state");
  if (!code || gotState !== state) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end("Bad callback (state mismatch)");
    return;
  }

  try {
    const tokRes = await fetch("https://api.etsy.com/v3/public/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: API_KEY,
        redirect_uri: REDIRECT_URI,
        code,
        code_verifier: verifier,
      }),
    });
    if (!tokRes.ok) throw new Error(`token exchange ${tokRes.status}: ${await tokRes.text()}`);
    const tok = await tokRes.json();

    const me = await (
      await fetch("https://openapi.etsy.com/v3/application/users/me", {
        headers: { "x-api-key": API_KEY, Authorization: `Bearer ${tok.access_token}` },
      })
    ).json();

    const { error } = await supabase.from("etsy_tokens").upsert({
      id: 1,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`etsy_tokens upsert failed: ${error.message}`);

    res.writeHead(200, { "Content-Type": "text/plain" }).end("Connected! You can close this tab.");
    console.log("✓ Token pair stored in etsy_tokens.");
    console.log(`✓ user_id: ${me.user_id}`);
    console.log(`✓ shop_id: ${me.shop_id}`);
    console.log(`\nAdd to .env.local AND Vercel production env:\n  ETSY_SHOP_ID=${me.shop_id}`);
  } catch (err) {
    console.error("FAILED:", err.message);
    res.writeHead(500, { "Content-Type": "text/plain" }).end("Failed — see terminal.");
  } finally {
    server.close();
  }
});

server.listen(3999);
