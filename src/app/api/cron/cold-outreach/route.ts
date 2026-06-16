import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import {
  TEMPLATES,
  SENDER,
  unsubHeaders,
  LEAD_TYPE_TEMPLATES,
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
 *   ?force=1         bypass per-day idempotency lock (use after a crashed
 *                    run when you need to re-trigger the same day)
 *
 * Per-day idempotency:
 *   First invocation each UTC day inserts a row into cron_run_log
 *   keyed (cron_name, run_date). Concurrent or duplicate invocations hit
 *   the unique-constraint and exit cleanly. Prevents the duplicate-send
 *   bug that affected 44 recipients between 2026-06-08 and 2026-06-11
 *   when Vercel cron fired the handler twice in parallel.
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
  stateFilter: string | null,
  leadTypeFilter: string | null
): Promise<Lead[]> {
  let q = supabaseAdmin
    .from("photographer_leads")
    .select("id, business_name, email, city, state, lead_type")
    .eq("status", "enriched")
    .not("email", "is", null)
    .limit(limit);
  if (stateFilter) q = q.eq("state", stateFilter);
  if (leadTypeFilter) q = q.eq("lead_type", leadTypeFilter);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Lead[];
}

async function selectFollowups(
  limit: number,
  stateFilter: string | null,
  leadTypeFilter: string | null
): Promise<Lead[]> {
  const cutoff = new Date(
    Date.now() - FOLLOWUP_DELAY_DAYS * 86_400_000
  ).toISOString();

  let q = supabaseAdmin
    .from("photographer_leads")
    .select("id, business_name, email, city, state, lead_type, emailed_at")
    .eq("status", "emailed")
    .not("email", "is", null)
    .lt("emailed_at", cutoff)
    .limit(limit * 2); // over-fetch, filter in JS
  if (stateFilter) q = q.eq("state", stateFilter);
  if (leadTypeFilter) q = q.eq("lead_type", leadTypeFilter);
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
  // Optional persona filter. Default: no filter, so the cron pulls leads
  // from both photographer + officiant pools. Pass ?lead_type=officiant
  // to test one persona in isolation.
  const leadTypeFilter = searchParams.get("lead_type") || null;
  const dryRun = searchParams.get("dry_run") === "1";
  const force = searchParams.get("force") === "1";

  const counts = {
    initials: { sent: 0, skipped: 0, failed: 0, queued: 0 },
    followups: { sent: 0, skipped: 0, failed: 0, queued: 0 },
  };
  const errors: string[] = [];

  // Per-day idempotency lock. Insert (cron_name, run_date) — if Vercel
  // fires this handler twice for the same day, the second invocation hits
  // the PK violation and exits without sending. dry_run and force skip
  // the lock (dry_run never sends; force is the manual-recovery escape).
  const runDate = today.toISOString().slice(0, 10); // YYYY-MM-DD UTC
  if (!dryRun && !force) {
    const { error: lockError } = await supabaseAdmin
      .from("cron_run_log")
      .insert({ cron_name: "cold-outreach", run_date: runDate });
    if (lockError) {
      // Postgres unique_violation = "23505". Any other error is unexpected
      // and we still abort (safer to skip a day than risk dupes).
      return NextResponse.json({
        skipped: true,
        reason: lockError.code === "23505" ? "already_ran_today" : "lock_error",
        run_date: runDate,
        detail: lockError.message,
      });
    }
  }

  try {
    if (maxInitials > 0) {
      const initials = await selectInitials(maxInitials, stateFilter, leadTypeFilter);
      counts.initials.queued = initials.length;
      for (const lead of initials) {
        const templateKey = pickInitialTemplate(lead);
        const r = await sendOne(lead, templateKey, dryRun);
        tally(counts.initials, r, errors, lead);
        if (!dryRun) await sleep(SEND_THROTTLE_MS);
      }
    }

    if (maxFollowups > 0) {
      const followups = await selectFollowups(maxFollowups, stateFilter, leadTypeFilter);
      counts.followups.queued = followups.length;
      for (const lead of followups) {
        const templateKey = pickFollowupTemplate(lead);
        const r = await sendOne(lead, templateKey, dryRun);
        tally(counts.followups, r, errors, lead);
        if (!dryRun) await sleep(SEND_THROTTLE_MS);
      }
    }

    // Stamp the lock row with completion time + send total so the admin
    // log shows what the run actually did. Best-effort: a failed update
    // doesn't unwind a successful send.
    if (!dryRun && !force) {
      await supabaseAdmin
        .from("cron_run_log")
        .update({
          finished_at: new Date().toISOString(),
          events_sent: counts.initials.sent + counts.followups.sent,
        })
        .eq("cron_name", "cold-outreach")
        .eq("run_date", runDate);
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

function pickInitialTemplate(lead: Lead): TemplateKey {
  const type = lead.lead_type || "photographer";
  return (
    LEAD_TYPE_TEMPLATES[type]?.initial ||
    LEAD_TYPE_TEMPLATES.photographer.initial
  );
}

function pickFollowupTemplate(lead: Lead): TemplateKey {
  const type = lead.lead_type || "photographer";
  return (
    LEAD_TYPE_TEMPLATES[type]?.followup ||
    LEAD_TYPE_TEMPLATES.photographer.followup
  );
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
