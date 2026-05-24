#!/usr/bin/env node
/**
 * Pushes NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE to Vercel Production env
 * and triggers a redeploy.
 *
 * Usage:
 *   node scripts/vercel/push-ads-label.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const TOKEN = env.VERCEL_TOKEN;
if (!TOKEN) throw new Error("VERCEL_TOKEN not set in .env.local");

const KEY = "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE";
const VALUE = "8KHQCL3JsbIcENq_gIdB";
const PROJECT_NAME = "sendforgood"; // legacy project name; sealtheday.com is aliased here

async function v(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Vercel ${path} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// 1) Find project
console.log(`Searching for Vercel project matching "${PROJECT_NAME}"...`);
const { projects } = await v(`/v9/projects?search=${PROJECT_NAME}&limit=20`);
if (!projects?.length) {
  // fall back to listing all and grepping
  const all = await v(`/v9/projects?limit=50`);
  console.log("No match. Available projects:");
  for (const p of all.projects || []) console.log(`  - ${p.name}  (id=${p.id})`);
  process.exit(1);
}
const project = projects.find((p) => p.name === PROJECT_NAME) || projects[0];
console.log(`Using project: ${project.name} (id=${project.id})`);

// 2) Check if env var already exists
const { envs } = await v(`/v9/projects/${project.id}/env?decrypt=false`);
const existing = envs.find(
  (e) => e.key === KEY && e.target?.includes("production")
);

const payload = {
  key: KEY,
  value: VALUE,
  type: "plain",
  target: ["production"],
};

if (existing) {
  console.log(`Env var exists (id=${existing.id}). Updating value...`);
  await v(`/v9/projects/${project.id}/env/${existing.id}`, {
    method: "PATCH",
    body: JSON.stringify({ value: VALUE, target: ["production"], type: "plain" }),
  });
} else {
  console.log(`Creating new env var ${KEY}=${VALUE} (production)...`);
  await v(`/v10/projects/${project.id}/env?upsert=true`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
console.log(`[ok] Env var set.`);

// 3) Trigger redeploy by re-deploying the latest production deployment
console.log(`\nFetching latest production deployment to redeploy...`);
const { deployments } = await v(
  `/v6/deployments?projectId=${project.id}&target=production&limit=1`
);
if (!deployments?.length) {
  console.log(`[warn] No prior production deployment found. Push a commit to deploy.`);
  process.exit(0);
}
const latest = deployments[0];
console.log(`Latest production deploy: ${latest.uid}  (${latest.url})`);

console.log(`\nTriggering redeploy...`);
const redeploy = await v(`/v13/deployments`, {
  method: "POST",
  body: JSON.stringify({
    name: project.name,
    deploymentId: latest.uid,
    target: "production",
    meta: { redeployFrom: latest.uid, reason: "push GOOGLE_ADS_CONVERSION_LABEL_PURCHASE" },
  }),
});
console.log(`[ok] Redeploy queued: https://${redeploy.url}`);
console.log(`     Dashboard: https://vercel.com/${redeploy.meta?.githubUsername || ""}/${project.name}/${redeploy.id}`);
