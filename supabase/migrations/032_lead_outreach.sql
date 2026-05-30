-- Cold outreach tracking — companion to photographer_leads (031).
--
-- Two tables:
--   1. lead_outreach_events — one row per email sent. Used to throttle
--      sequences (don't send follow-up N+1 until N is older than X days),
--      to attribute conversions, and to give us a paper trail if anyone
--      ever asks "did you contact me?".
--   2. lead_unsubscribes — emails that have opted out via the public
--      /api/leads/unsubscribe endpoint. Checked at send time so we never
--      re-email someone who said stop, even if a future scraper rediscovers
--      them under a new place_id.
--
-- We track per-event (rather than just bumping a counter on the lead row)
-- because the send script throttles by both calendar time AND total recent
-- volume per sender, which needs a real timestamp history.

-- ──────────────────────────────────────────────────────────────────────
-- 1. lead_outreach_events
-- ──────────────────────────────────────────────────────────────────────
create table if not exists lead_outreach_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references photographer_leads(id) on delete cascade,
  sequence_step int not null default 1,   -- 1 = initial, 2 = follow-up 1, etc.
  template_key text not null,             -- e.g. 'photographer_initial_v1'
  subject text not null,
  from_address text not null,
  to_address text not null,
  resend_message_id text,                 -- returned by Resend on success
  status text not null default 'sent',    -- 'sent' | 'failed' | 'bounced' | 'replied'
  error text,
  sent_at timestamptz not null default now()
);

create index if not exists lead_outreach_events_lead_idx
  on lead_outreach_events(lead_id);
create index if not exists lead_outreach_events_sent_at_idx
  on lead_outreach_events(sent_at desc);
create index if not exists lead_outreach_events_status_idx
  on lead_outreach_events(status);

-- ──────────────────────────────────────────────────────────────────────
-- 2. lead_unsubscribes
-- ──────────────────────────────────────────────────────────────────────
-- Stored independently of photographer_leads.email because (a) we want
-- the suppression list to outlive any cleanup of the leads table, and
-- (b) future scrapers from other sources should be filtered against it.
create table if not exists lead_unsubscribes (
  email text primary key,
  reason text,
  unsubscribed_at timestamptz not null default now()
);

-- RLS off — admin/script-only, never exposed to user-facing API.
alter table lead_outreach_events disable row level security;
alter table lead_unsubscribes disable row level security;
