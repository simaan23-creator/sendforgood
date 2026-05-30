#!/usr/bin/env node
/**
 * End-to-end conversion setup for SealTheDay:
 *   1. Idempotently creates 3 conversion actions in Ads sub-account 1884911376:
 *        - SealTheDay Purchase (Website)        category=PURCHASE   value=$25 default
 *        - SealTheDay Sign Up                   category=SIGNUP     no value
 *        - SealTheDay Vault Created             category=OTHER      no value
 *   2. Extracts each conversion label from the gtag event snippet
 *   3. PATCHes 3 NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_* env vars into Vercel
 *      for production+preview+development, overwriting if they already exist
 *   4. Triggers a Vercel redeploy of the latest production deployment so the
 *      new labels are picked up by the client bundle
 *
 * Reads creds from .env.local + google-ads-oauth.json + google-ads-token.json.
 * Requires VERCEL_TOKEN in .env.local with project read+write scope.
 *
 * Usage:
 *   node scripts/google-ads/setup-conversions.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAdsApi, enums } from "google-ads-api";

const ROOT = resolve(process.cwd());

// ---------- env loader ----------
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);
const oauth = JSON.parse(
  readFileSync(resolve(ROOT, "google-ads-oauth.json"), "utf8")
).installed;
const token = JSON.parse(
  readFileSync(resolve(ROOT, "google-ads-token.json"), "utf8")
);

if (!env.VERCEL_TOKEN) {
  console.error("ERROR: VERCEL_TOKEN missing from .env.local");
  process.exit(1);
}

// ---------- Google Ads client ----------
const client = new GoogleAdsApi({
  client_id: oauth.client_id,
  client_secret: oauth.client_secret,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  refresh_token: token.refresh_token,
});

// ---------- definitions ----------
const ACTIONS = [
  {
    envKey: "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE",
    name: "SealTheDay Purchase (Website)",
    category: enums.ConversionActionCategory.PURCHASE,
    countingType: enums.ConversionActionCountingType.ONE_PER_CLICK,
    valueSettings: {
      default_value: 25,
      default_currency_code: "USD",
      always_use_default_value: false,
    },
    clickWindow: 30,
    viewWindow: 1,
  },
  {
    envKey: "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_SIGNUP",
    name: "SealTheDay Sign Up",
    category: enums.ConversionActionCategory.SIGNUP,
    countingType: enums.ConversionActionCountingType.ONE_PER_CLICK,
    // no value
    clickWindow: 30,
    viewWindow: 1,
  },
  {
    envKey: "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_VAULT_CREATED",
    name: "SealTheDay Vault Created",
    category: enums.ConversionActionCategory.DEFAULT, // "Other"
    countingType: enums.ConversionActionCountingType.ONE_PER_CLICK,
    clickWindow: 30,
    viewWindow: 1,
  },
];

// ---------- helpers ----------
async function findByName(name) {
  // Escape single quotes in name for GAQL
  const safe = name.replace(/'/g, "\\'");
  const rows = await customer.query(`
    SELECT conversion_action.resource_name, conversion_action.name
    FROM conversion_action
    WHERE conversion_action.name = '${safe}'
  `);
  return rows[0]?.conversion_action?.resource_name || null;
}

async function createAction(def) {
  const payload = {
    name: def.name,
    type: enums.ConversionActionType.WEBPAGE,
    category: def.category,
    status: enums.ConversionActionStatus.ENABLED,
    primary_for_goal: true,
    counting_type: def.countingType,
    click_through_lookback_window_days: def.clickWindow,
    view_through_lookback_window_days: def.viewWindow,
    attribution_model_settings: {
      attribution_model: enums.AttributionModel.GOOGLE_ADS_LAST_CLICK,
    },
  };
  if (def.valueSettings) payload.value_settings = def.valueSettings;
  const r = await customer.conversionActions.create([payload]);
  return r.results[0].resource_name;
}

async function extractLabel(resourceName) {
  const rows = await customer.query(`
    SELECT conversion_action.tag_snippets
    FROM conversion_action
    WHERE conversion_action.resource_name = '${resourceName}'
  `);
  const snippets = rows[0]?.conversion_action?.tag_snippets || [];
  for (const s of snippets) {
    if (!s.event_snippet) continue;
    const m = s.event_snippet.match(/AW-\d+\/([A-Za-z0-9_\-]+)/);
    if (m) return m[1];
  }
  return null;
}

// ---------- Vercel API ----------
const VERCEL_BASE = "https://api.vercel.com";
const VERCEL_HEADERS = {
  Authorization: `Bearer ${env.VERCEL_TOKEN}`,
  "Content-Type": "application/json",
};

async function vercelFetch(path, init = {}) {
  const url = `${VERCEL_BASE}${path}`;
  const res = await fetch(url, { ...init, headers: { ...VERCEL_HEADERS, ...(init.headers || {}) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel ${init.method || "GET"} ${path} -> ${res.status}: ${body}`);
  }
  return res.json();
}

async function findVercelProject() {
  // Pull all projects (could paginate but we'll be small for now)
  const data = await vercelFetch(`/v9/projects?limit=100`);
  // Heuristic: match by .env containing NEXT_PUBLIC_APP_URL host
  const targetHost = (env.NEXT_PUBLIC_APP_URL || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  // First try by name "sendforgood" or "sealtheday"
  const byName = data.projects.find(
    (p) => p.name === "sendforgood" || p.name === "sealtheday"
  );
  if (byName) return byName;
  // Then try by alias containing host
  if (targetHost) {
    const byAlias = data.projects.find((p) =>
      (p.targets?.production?.alias || []).some((a) => a.includes(targetHost.split(".")[0]))
    );
    if (byAlias) return byAlias;
  }
  throw new Error(
    `Could not auto-detect Vercel project. Projects found: ${data.projects.map((p) => p.name).join(", ")}`
  );
}

async function upsertEnvVar(projectId, teamId, key, value) {
  const teamSuffix = teamId ? `?teamId=${teamId}` : "";
  // List existing env vars to see if this key exists
  const existing = await vercelFetch(`/v9/projects/${projectId}/env${teamSuffix}`);
  const match = existing.envs.find((e) => e.key === key);
  if (match) {
    // PATCH existing
    await vercelFetch(
      `/v9/projects/${projectId}/env/${match.id}${teamSuffix}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          value,
          target: ["production", "preview", "development"],
          type: "plain",
        }),
      }
    );
    return "updated";
  } else {
    // POST new
    await vercelFetch(`/v10/projects/${projectId}/env${teamSuffix}`, {
      method: "POST",
      body: JSON.stringify({
        key,
        value,
        target: ["production", "preview", "development"],
        type: "plain",
      }),
    });
    return "created";
  }
}

async function triggerRedeploy(projectId, teamId, projectName) {
  const teamSuffix = teamId ? `?teamId=${teamId}` : "";
  // Find latest production deployment to redeploy
  const deps = await vercelFetch(
    `/v6/deployments?projectId=${projectId}&target=production&limit=1${teamId ? `&teamId=${teamId}` : ""}`
  );
  const latest = deps.deployments?.[0];
  if (!latest) {
    console.log("  No previous production deployment found to redeploy from.");
    return;
  }
  // Create a new deployment from same git ref
  const body = {
    name: projectName,
    target: "production",
    deploymentId: latest.uid,
  };
  // Vercel "redeploy" is POST /v13/deployments with deploymentId
  const r = await vercelFetch(`/v13/deployments${teamSuffix}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log(`  Redeploy queued: https://${r.url}`);
}

// ---------- main ----------
console.log("\n=== Step 1: Create / fetch conversion actions ===\n");
const labels = {};
for (const def of ACTIONS) {
  process.stdout.write(`  ${def.name.padEnd(36)} `);
  let resourceName = await findByName(def.name);
  let action;
  if (resourceName) {
    action = "exists";
  } else {
    resourceName = await createAction(def);
    action = "created";
  }
  const label = await extractLabel(resourceName);
  if (!label) {
    console.log(`[${action}] NO LABEL EXTRACTED`);
    continue;
  }
  labels[def.envKey] = label;
  console.log(`[${action}] label=${label}`);
}

if (Object.keys(labels).length === 0) {
  console.error("\nNo labels extracted. Aborting before Vercel sync.");
  process.exit(1);
}

console.log("\n=== Step 2: Find Vercel project ===\n");
const project = await findVercelProject();
const teamId = project.accountId && project.accountId.startsWith("team_") ? project.accountId : null;
console.log(`  Project: ${project.name}  id=${project.id}  team=${teamId || "personal"}`);

console.log("\n=== Step 3: Push env vars to Vercel ===\n");
for (const [key, value] of Object.entries(labels)) {
  process.stdout.write(`  ${key.padEnd(56)} `);
  const result = await upsertEnvVar(project.id, teamId, key, value);
  console.log(`[${result}]`);
}

console.log("\n=== Step 4: Trigger redeploy ===\n");
await triggerRedeploy(project.id, teamId, project.name);

console.log("\nDone. Once the deploy goes green, conversions will fire to Google Ads.");
console.log("Verify with Tag Assistant: do a $0.25 photo + $10 vault test purchase,");
console.log("then refund yourself in Stripe. Conversions show in Ads UI in 24-48h.\n");
