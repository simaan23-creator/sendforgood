import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import {
  TEMPLATES,
  SENDER,
  unsubHeaders,
  type Lead,
  type TemplateKey,
} from "@/lib/leads/templates";

/**
 * Cron: daily photographer cold-email send.
 *
 * Mirrors scripts/leads/send-campaign.mjs but runs unattended on Vercel.
 *
 * Schedule (vercel.json): weekdays at 16:00 UTC (~10am Central, ~11am ET).
 *   - Weekdays only — weekend B2B sends look spammy and get worse open
 *     rates anyway.
 *   - Mid-morning ET — best window for owner-operator photographer inboxes.
 *
 * Auth: standard CRON_SECRET bearer header (Vercel injects this automatically
 * for scheduled crons; manual runs need `Authorization: Bearer <secret>`).
 *
 * Volume caps (intentional, see send-campaign.mjs notes):
 *   - 40 initials/day
 *   - 30 follow-ups/day
 * Going above these without a warmed dedicated subdomain will tank
 * sealtheday.com's reputation and break transactional mail.
 *
 * Pause kill-switch:
 *   Set env var COLD_OUTREACH_PAUSED=1 in Vercel to halt sends without
 *   removing the cron entry. Useful if Resend reports a deliverability
 *   issue and you need to stop sending while you investigate.
 *
 * Per-run query overrides (optional, for manual testing):
 *   ?initials=N      override 40
 *   ?followups=N     override 30
 *   ?state=TX        only this state
 *   ?dry_run=1       skip actual send + DB writes, just preview counts
 */

// Warming schedule for the outreach.sealtheday.com subdomain.
// A brand-new sending domain starts with neutral reputation; ramping
// volume slowly tells Gmail/Outlook/etc that this is a real sender, not
// a snowshoe spammer. Skip the ramp = expect everything in spam for the
// first 2 weeks.
const WARMING_START_DATE = "2026-06-01"; // first send day on outreach subdomain
function warmedCap(today: Date, target: number): number {
  const start = new Date(WARMING_START_DATE + "T00:00:00Z").getTime();
  const days = Math.floor((today.getTime() - start) / 86_400_000);
  if (days < 2) return Math.min(10, target);   // days 0-1: 10/day
  if (days < 5) return Math.min(20, target);   // days 2-4: 20/day
  return target;                                // day 5+: full target
}

const TARGET_MAX_INITIALS = 40;
const TARGET_MAX_FOLLOWUPS = 30;
const FOLLOWUP_DELAY_DAYS = 4;
const SEND_THROTTLE_MS = 1500; // ~40 sends/min

async function isUnsubscribed(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("lead_unsubscribes")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data;
}

async function selectInitials(
  limit: number,
  stateFilter: string | null
): Promise<Lead[]> {
  let q = supabaseAdmin
    .from("photographer_leads")
    .select("id, business_name, email, city, state")
    .eq("status", "enriched")
    .not("email", "is", null)
    .limit(limit);
  if (stateFilter) q = q.eq("state", stateFilter);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Lead[];
}

async function selectFollowups(
  limit: number,
  stateFilter: string | null
): Promise<Lead[]> {
  const cutoff = new Date(
    Date.now() - FOLLOWUP_DELAY_DAYS * 86_400_000
  ).toISOString();

  let q = supabaseAdmin
    .from("photographer_leads")
    .select("id, business_name, email, city, state, emailed_at")
    .eq("status", "emailed")
    .not("email", "is", null)
    .lt("emailed_at", cutoff)
    .limit(limit * 2); // over-fetch, filter in JS
  if (stateFilter) q = q.eq("state", stateFilter);
  const { data, error } = await q;
  if (error) throw error;

  // Exclude leads who already have a sequence_step >= 2 event.
  const result: Lead[] = [];
  for (const lead of (data || []) as Lead[]) {
    const { count } = await supabaseAdmin
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

type SendOutcome =
  | { ok: true }
  | { ok: false; error: string }
  | { skipped: true; reason: string }
  | { dryRun: true };

async function sendOne(
  lead: Lead,
  templateKey: TemplateKey,
  dryRun: boolean
): Promise<SendOutcome> {
  const template = TEMPLATES[templateKey];

  if (await isUnsubscribed(lead.email)) {
    return { skipped: true, reason: "unsubscribed" };
  }

  const rendered = template.render(lead);
  const from = `${SENDER.name} <${SENDER.email}>`;

  if (dryRun) return { dryRun: true };

  let resendId: string | null = null;
  let error: string | null = null;
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
    error = err instanceof Error ? err.message : String(err);
  }

  await supabaseAdmin.from("lead_outreach_events").insert({
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
    await supabaseAdmin
      .from("photographer_leads")
      .update({
        status: "emailed",
        emailed_at: new Date().toISOString(),
      })
      .eq("id", lead.id);
    return { ok: true };
  }
  return { ok: false, error };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.COLD_OUTREACH_PAUSED === "1") {
    return NextResponse.json({ paused: true, message: "COLD_OUTREACH_PAUSED is set" });
  }

  const { searchParams } = new URL(request.url);
  const today = new Date();
  const maxInitials = clampInt(
    searchParams.get("initials"),
    warmedCap(today, TARGET_MAX_INITIALS),
    0,
    100
  );
  const maxFollowups = clampInt(
    searchParams.get("followups"),
    warmedCap(today, TARGET_MAX_FOLLOWUPS),
    0,
    100
  );
  const stateFilter = searchParams.get("state") || null;
  const dryRun = searchParams.get("dry_run") === "1";

  const counts = {
    initials: { sent: 0, skipped: 0, failed: 0, queued: 0 },
    followups: { sent: 0, skipped: 0, failed: 0, queued: 0 },
  };
  const errors: string[] = [];

  try {
    if (maxInitials > 0) {
      const initials = await selectInitials(maxInitials, stateFilter);
      counts.initials.queued = initials.length;
      for (const lead of initials) {
        const r = await sendOne(lead, "photographer_initial_v2", dryRun);
        tally(counts.initials, r, errors, lead);
        if (!dryRun) await sleep(SEND_THROTTLE_MS);
      }
    }

    if (maxFollowups > 0) {
      const followups = await selectFollowups(maxFollowups, stateFilter);
      counts.followups.queued = followups.length;
      for (const lead of followups) {
        const r = await sendOne(lead, "photographer_followup_v2", dryRun);
        tally(counts.followups, r, errors, lead);
        if (!dryRun) await sleep(SEND_THROTTLE_MS);
      }
    }

    return NextResponse.json({
      dry_run: dryRun,
      state_filter: stateFilter,
      ...counts,
      errors: errors.slice(0, 20), // cap to keep response small
    });
  } catch (err) {
    console.error("cold-outreach cron failed:", err);
    return NextResponse.json(
      {
        ...counts,
        errors: [...errors, err instanceof Error ? err.message : "Unknown error"],
      },
      { status: 500 }
    );
  }
}

function tally(
  bucket: { sent: number; skipped: number; failed: number; queued: number },
  outcome: SendOutcome,
  errors: string[],
  lead: Lead
) {
  if ("dryRun" in outcome) return;
  if ("skipped" in outcome) {
    bucket.skipped++;
  } else if (outcome.ok) {
    bucket.sent++;
  } else {
    bucket.failed++;
    errors.push(`${lead.business_name} <${lead.email}>: ${outcome.error}`);
  }
}

function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (raw === null) return fallback;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
