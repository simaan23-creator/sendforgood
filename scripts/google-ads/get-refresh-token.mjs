#!/usr/bin/env node
/**
 * One-time OAuth refresh-token grabber for Google Ads API.
 *
 * Usage:
 *   node scripts/google-ads/get-refresh-token.mjs
 *
 * Reads google-ads-oauth.json (downloaded from GCP Console).
 * Opens browser -> user signs in with simaan23@gmail.com -> grants Ads scope.
 * Captures the code on http://localhost:<port>/ and exchanges for a refresh token.
 * Writes refresh token to google-ads-token.json (gitignored).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { exec } from "node:child_process";
import { resolve } from "node:path";
import { URL } from "node:url";

const ROOT = resolve(process.cwd());
const OAUTH_FILE = resolve(ROOT, "google-ads-oauth.json");
const TOKEN_FILE = resolve(ROOT, "google-ads-token.json");
const SCOPE = "https://www.googleapis.com/auth/adwords";
const PORT = 53682; // arbitrary high port

const oauth = JSON.parse(readFileSync(OAUTH_FILE, "utf8")).installed;
const REDIRECT_URI = `http://localhost:${PORT}`;

const authUrl = new URL(oauth.auth_uri);
authUrl.searchParams.set("client_id", oauth.client_id);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT_URI);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");

  if (err) {
    res.end(`OAuth error: ${err}. You can close this tab.`);
    console.error("OAuth error:", err);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.end("Waiting for OAuth callback...");
    return;
  }

  try {
    const tokenRes = await fetch(oauth.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: oauth.client_id,
        client_secret: oauth.client_secret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const body = await tokenRes.json();
    if (!tokenRes.ok || !body.refresh_token) {
      throw new Error(JSON.stringify(body));
    }
    writeFileSync(
      TOKEN_FILE,
      JSON.stringify(
        {
          refresh_token: body.refresh_token,
          obtained_at: new Date().toISOString(),
          scope: body.scope,
        },
        null,
        2
      )
    );
    res.end(
      "Refresh token captured. You can close this tab and return to the terminal."
    );
    console.log(`\n[ok] Refresh token written to ${TOKEN_FILE}`);
    server.close();
    process.exit(0);
  } catch (e) {
    res.end(`Token exchange failed: ${e.message}`);
    console.error("[fail]", e);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on ${REDIRECT_URI}`);
  console.log("Opening browser for Google consent...");
  const url = authUrl.toString();
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) {
      console.log(
        `\nCould not auto-open browser. Visit this URL manually:\n\n${url}\n`
      );
    }
  });
});
