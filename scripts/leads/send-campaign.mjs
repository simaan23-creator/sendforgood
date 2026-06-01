#!/usr/bin/env node
/**
 * Photographer lead scraper — Step 3: cold-email send.
 *
 * Pulls enriched leads from photographer_leads, throttles to a safe daily
 * cap, picks the right sequence step (initial vs follow-up), sends via
 * Resend, logs each send to lead_outreach_events, and bumps lead.status.
 *
 * SAFETY RULES (do not relax without warming a dedicated domain):
 *   - Hard cap 40 new initials + 30 follow-ups per run (Resend allows
 *     thousands but cold outbound from a non-warmed sender will tank your
 *     domain reputation fast).
 *   - Skip anyone in lead_unsubscribes (CAN-SPAM suppression list).
 *   - Follow-ups only sent if initial is older than 4 days AND no reply
 *     manually marked AND lead.status='emailed'.
 *   - One sender address per run — keeps per-sender volume predictable.
 *
 * USAGE:
 *   node scripts/leads/send-campaign.mjs                  # default 40 initials + 30 followups
 *   node scripts/leads/send-campaign.mjs --dry-run        # render but don't actually send
 *   node scripts/leads/send-campaign.mjs --initials=10    # smaller initial batch
 *   node scripts/leads/send-campaign.mjs --followups=0    # only initials
 *   node scripts/leads/send-campaign.mjs --state=TX       # only Texas leads
 *
 * SENDING DOMAIN — read this before first run:
 *   The templates send from simaan@sealtheday.com. You MUST:
 *     1. Have sealtheday.com verified in Resend (already done — that's
 *        how vault confirmations work)
 *     2. Set up simaan@sealtheday.com to forward to Simaan23@gmail.com
 *        in your DNS/email host (Microsoft 365 / Google Workspace / etc).
 *        Otherwise replies are lost forever.
 *   For higher volume (>50/day), set up a dedicated subdomain like
 *   outreach.sealtheday.com so cold sends don't tank transactional rep.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { TEMPLATES, SENDER, unsubHeaders } from "./templates.mjs";

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

// Make NEXT_PUBLIC_SITE_URL available to templates that build unsub links.
process.env.NEXT_PUBLIC_SITE_URL =
  env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";

if (!env.RESEND_API_KEY) {
  console.error("ERROR: RESEND_API_KEY missing from .env.local");
  process.exit(1);
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: Supabase env vars missing.");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const resend = new Resend(env.RESEND_API_KEY);

// ---------- CLI args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  })
);
const DRY_RUN = args["dry-run"] === "true";
const MAX_INITIALS = args.initials !== undefined ? parseInt(args.initials, 10) : 40;
const MAX_FOLLOWUPS = args.followups !== undefined ? parseInt(args.followups, 10) : 30;
const STATE_FILTER = args.state || null;
const FOLLOWUP_DELAY_DAYS = 4;

// ---------- helpers ----------
async function isUnsubscribed(email) {
  const { data } = await supabase
    .from("lead_unsubscribes")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data;
}

async function selectInitials(limit) {
  let q = supabase
    .from("photographer_leads")
    .select("id, business_name, email, city, state")
    .eq("status", "enriched")
    .not("email", "is", null)
    .limit(limit);
  if (STATE_FILTER) q = q.eq("state", STATE_FILTER);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function selectFollowups(limit) {
  // Anyone status='emailed', last touched > FOLLOWUP_DELAY_DAYS ago,
  // and we've only sent them sequence_step=1 so far.
  const cutoff = new Date(
    Date.now() - FOLLOWUP_DELAY_DAYS * 86_400_000
  ).toISOString();

  let q = supabase
    .from("photographer_leads")
    .select("id, business_name, email, city, state, emailed_at")
    .eq("status", "emailed")
    .not("email", "is", null)
    .lt("emailed_at", cutoff)
    .limit(limit * 2); // over-fetch, filter further in JS
  if (STATE_FILTER) q = q.eq("state", STATE_FILTER);
  const { data, error } = await q;
  if (error) throw error;

  // Filter out leads who already have a sequence_step >= 2 event.
  const result = [];
  for (const lead of data || []) {
    const { count } = await supabase
      .from("lead_outreach_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .gte("sequence_step", 2);
    if (!count || count === 0) {
      result.push(lead);
      if (result.length >= limit) break;
    }
  }
  return result;
}

async function sendOne(lead, templateKey) {
  const template = TEMPLATES[templateKey];
  if (!template) throw new Error(`Unknown template: ${templateKey}`);

  if (await isUnsubscribed(lead.email)) {
    return { skipped: true, reason: "unsubscribed" };
  }

  const rendered = template.render(lead);
  const from = `${SENDER.name} <${SENDER.email}>`;

  if (DRY_RUN) {
    console.log(`\n--- DRY RUN: ${lead.business_name} <${lead.email}> ---`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${rendered.subject}`);
    console.log(rendered.text.split("\n").slice(0, 12).join("\n"));
    return { dryRun: true };
  }

  let resendId = null;
  let error = null;
  try {
    const res = await resend.emails.send({
      from,
      to: lead.email,
      replyTo: SENDER.replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: unsubHeaders(lead.email),
    });
    resendId = res.data?.id || null;
    if (res.error) error = res.error.message || String(res.error);
  } catch (err) {
    error = err.message || String(err);
  }

  // Log every attempt, success or fail.
  await supabase.from("lead_outreach_events").insert({
    lead_id: lead.id,
    sequence_step: template.sequenceStep,
    template_key: templateKey,
    subject: rendered.subject,
    from_address: SENDER.email,
    to_address: lead.email,
    resend_message_id: resendId,
    status: error ? "failed" : "sent",
    error: error || null,
  });

  if (!error) {
    await supabase
      .from("photographer_leads")
      .update({
        status: "emailed",
        emailed_at: new Date().toISOString(),
      })
      .eq("id", lead.id);
  }

  return { ok: !error, error };
}

// ---------- main ----------
console.log(`\n=== Cold email campaign send ===`);
console.log(`Mode: ${DRY_RUN ? "DRY RUN (no emails will be sent)" : "LIVE"}`);
console.log(`From: ${SENDER.name} <${SENDER.email}>`);
console.log(`State filter: ${STATE_FILTER || "all"}`);
console.log(`Caps: ${MAX_INITIALS} initial / ${MAX_FOLLOWUPS} follow-up\n`);

// 1. Initials
let initSent = 0;
let initSkipped = 0;
let initFailed = 0;
if (MAX_INITIALS > 0) {
  console.log(`--- Initials ---`);
  const initials = await selectInitials(MAX_INITIALS);
  console.log(`  ${initials.length} candidates queued\n`);
  for (const lead of initials) {
    process.stdout.write(
      `  ${lead.business_name.slice(0, 36).padEnd(38)} ${lead.email.padEnd(36)} `
    );
    const r = await sendOne(lead, "photographer_initial_v1");
    if (r.skipped) {
      console.log(`SKIP (${r.reason})`);
      initSkipped++;
    } else if (r.dryRun) {
      // already logged inline
    } else if (r.ok) {
      console.log("sent");
      initSent++;
    } else {
      console.log(`FAIL: ${r.error}`);
      initFailed++;
    }
    // Throttle to ~1 send / 1.5s = ~40/min. Well under Resend rate limits
    // and looks more human than blasting concurrently.
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 1500));
  }
}

// 2. Follow-ups
let fuSent = 0;
let fuSkipped = 0;
let fuFailed = 0;
if (MAX_FOLLOWUPS > 0) {
  console.log(`\n--- Follow-ups (${FOLLOWUP_DELAY_DAYS}+ days since initial) ---`);
  const followups = await selectFollowups(MAX_FOLLOWUPS);
  console.log(`  ${followups.length} candidates queued\n`);
  for (const lead of followups) {
    process.stdout.write(
      `  ${lead.business_name.slice(0, 36).padEnd(38)} ${lead.email.padEnd(36)} `
    );
    const r = await sendOne(lead, "photographer_followup_v1");
    if (r.skipped) {
      console.log(`SKIP (${r.reason})`);
      fuSkipped++;
    } else if (r.dryRun) {
      // already logged
    } else if (r.ok) {
      console.log("sent");
      fuSent++;
    } else {
      console.log(`FAIL: ${r.error}`);
      fuFailed++;
    }
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 1500));
  }
}

console.log(`\n=== Summary ===`);
console.log(`Initials:    sent=${initSent}  skipped=${initSkipped}  failed=${initFailed}`);
console.log(`Follow-ups:  sent=${fuSent}  skipped=${fuSkipped}  failed=${fuFailed}`);
console.log("");
