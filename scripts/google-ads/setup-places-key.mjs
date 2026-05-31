#!/usr/bin/env node
/**
 * Fully automated Google Places API key setup.
 *
 * What this script does:
 *   1. Reuses google-ads-oauth.json (existing desktop OAuth client in
 *      project "sealtheday-ads") and requests a fresh refresh token with
 *      the cloud-platform scope — needed to manage GCP resources via API.
 *   2. Enables the Places API (New) on the project via Service Usage API.
 *   3. Creates a new API key via API Keys API, restricted to
 *      places-backend.googleapis.com so it can only be used for Places.
 *   4. Writes the resulting key to .env.local as GOOGLE_PLACES_API_KEY
 *      (idempotent: replaces an existing line, doesn't duplicate).
 *
 * What you do:
 *   - Run this script.
 *   - Click "Allow" once in the browser tab that opens.
 *   - That's it.
 *
 * Output: the API key is in .env.local and ready for places-search.mjs.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { exec } from "node:child_process";
import { resolve } from "node:path";
import { URL } from "node:url";

const ROOT = resolve(process.cwd());
const OAUTH_FILE = resolve(ROOT, "google-ads-oauth.json");
const TOKEN_CACHE = resolve(ROOT, "google-cloud-token.json"); // separate from ads token
const ENV_FILE = resolve(ROOT, ".env.local");
const PORT = 53683; // different from get-refresh-token.mjs to avoid collisions
// APIs we need enabled on the project before we can do anything else.
const REQUIRED_SERVICES = [
  "serviceusage.googleapis.com",   // for everything else (usually pre-enabled)
  "apikeys.googleapis.com",        // to create the API key
  "places.googleapis.com",         // the actual key target
];

const oauth = JSON.parse(readFileSync(OAUTH_FILE, "utf8")).installed;
const PROJECT_ID = JSON.parse(readFileSync(OAUTH_FILE, "utf8")).installed.project_id;
const REDIRECT_URI = `http://localhost:${PORT}`;

// Cloud-platform is the umbrella scope that grants Service Usage +
// API Keys management. The narrower service.management scope doesn't
// cover API Keys, so we use the umbrella.
const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"].join(" ");

// ---------- helpers ----------
function appendOrReplaceEnv(key, value) {
  let body = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(body)) {
    body = body.replace(re, `${key}=${value}`);
  } else {
    if (body.length > 0 && !body.endsWith("\n")) body += "\n";
    body += `${key}=${value}\n`;
  }
  writeFileSync(ENV_FILE, body);
}

async function exchangeCodeForToken(code) {
  const res = await fetch(oauth.token_uri, {
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
  const body = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(body)}`);
  return body;
}

async function enableService(accessToken, service) {
  // POST /v1/projects/{project}/services/{service}:enable
  const url = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/${service}:enable`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Enable ${service} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function getAccessTokenFromRefresh(refreshToken) {
  const res = await fetch(oauth.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauth.client_id,
      client_secret: oauth.client_secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Refresh failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function runSetup(accessToken) {
  for (const svc of REQUIRED_SERVICES) {
    console.log(`  enabling ${svc}...`);
    await enableService(accessToken, svc);
  }

  // Newly-enabled APIs sometimes take a few seconds to propagate.
  console.log("  waiting 5s for service activation to propagate...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("  creating restricted API key...");
  const key = await createRestrictedKey(accessToken);
  if (!key || !key.name) {
    throw new Error(`Unexpected create-key response: ${JSON.stringify(key)}`);
  }
  const keyString = await getKeyString(accessToken, key.name);

  console.log("  writing GOOGLE_PLACES_API_KEY to .env.local...");
  appendOrReplaceEnv("GOOGLE_PLACES_API_KEY", keyString);

  console.log(
    `\n[ok] Done. Key: ${keyString.slice(0, 8)}...${keyString.slice(-4)}`
  );
  console.log(
    `     Restricted to places.googleapis.com.\n` +
      `     Run: node scripts/leads/places-search.mjs\n`
  );
}

async function createRestrictedKey(accessToken) {
  // API Keys API: create + restrict in a single POST.
  // POST /v2/projects/{project}/locations/global/keys
  const url = `https://apikeys.googleapis.com/v2/projects/${PROJECT_ID}/locations/global/keys`;
  const payload = {
    displayName: "SealTheDay — Places API (auto-created)",
    restrictions: {
      // Lock the key to only the Places API service so a leak is bounded.
      api_targets: [{ service: "places.googleapis.com" }],
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Create key failed: ${JSON.stringify(body)}`);
  }
  // Long-running operation. Poll until done.
  if (body.name && body.done !== true) {
    return await pollOperation(accessToken, body.name);
  }
  return body.response || body;
}

async function pollOperation(accessToken, opName) {
  // apikeys operations are at https://apikeys.googleapis.com/v2/{name}
  const url = `https://apikeys.googleapis.com/v2/${opName}`;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.json();
    if (body.done) {
      if (body.error) throw new Error(`Operation failed: ${JSON.stringify(body.error)}`);
      return body.response;
    }
  }
  throw new Error(`Timed out waiting for operation ${opName}`);
}

async function getKeyString(accessToken, keyResourceName) {
  // The createKey response includes the resource name but the actual key
  // string requires a separate getKeyString call.
  // GET /v2/{name}/keyString
  const url = `https://apikeys.googleapis.com/v2/${keyResourceName}/keyString`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Get keyString failed: ${JSON.stringify(body)}`);
  return body.keyString;
}

// ---------- main ----------
// Reuse a cached refresh token if we already got cloud-platform consent
// in a prior run. Saves a browser click on retries (which happen because
// newly-enabled APIs take a few seconds to propagate).
if (existsSync(TOKEN_CACHE)) {
  console.log("Using cached cloud-platform refresh token. Skipping browser OAuth.");
  const cache = JSON.parse(readFileSync(TOKEN_CACHE, "utf8"));
  try {
    const accessToken = await getAccessTokenFromRefresh(cache.refresh_token);
    await runSetup(accessToken);
    process.exit(0);
  } catch (e) {
    console.error("\n[fail]", e.message);
    console.error("Cached token may be invalid — delete google-cloud-token.json and re-run.");
    process.exit(1);
  }
}

// ---------- OAuth flow (first run only) ----------
const authUrl = new URL(oauth.auth_uri);
authUrl.searchParams.set("client_id", oauth.client_id);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPES);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT_URI);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");

  if (err) {
    res.end(`OAuth error: ${err}. You can close this tab.`);
    console.error("\nOAuth error:", err);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.end("Waiting for OAuth callback...");
    return;
  }

  res.end(
    "Authorization received. Setting up the Places API key — return to the terminal."
  );

  try {
    console.log("\nExchanging code for tokens...");
    const tokens = await exchangeCodeForToken(code);
    if (tokens.refresh_token) {
      writeFileSync(
        TOKEN_CACHE,
        JSON.stringify(
          {
            refresh_token: tokens.refresh_token,
            scope: tokens.scope,
            obtained_at: new Date().toISOString(),
          },
          null,
          2
        )
      );
    }
    await runSetup(tokens.access_token);
    server.close();
    process.exit(0);
  } catch (e) {
    console.error("\n[fail]", e.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on ${REDIRECT_URI}`);
  console.log("Opening browser for Google consent...");
  console.log("(If a 'Google hasn't verified this app' warning appears, click");
  console.log(" Advanced -> Go to sealtheday-ads -- you're the app owner.)\n");
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
