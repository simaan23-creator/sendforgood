-- Photographer outreach pipeline storage.
--
-- One row per photographer business we plan to pitch the SealTheDay
-- affiliate program to. Populated by scripts/leads/places-search.mjs
-- (Google Places API) and enriched by scripts/leads/scrape-emails.mjs.
--
-- Status flow:
--   new       — discovered via Places, has website but no email yet
--   enriched  — email scraped from website, ready to email
--   queued    — sent to Instantly.ai (or equivalent) for a campaign
--   emailed   — first touch sent
--   replied   — they wrote back; needs manual handling
--   unsubscribed — they asked to be removed (CAN-SPAM)
--   converted — they signed up via /affiliate/apply
--
-- We dedupe at two layers:
--   1. unique(source, external_id) — same place_id from Google can't be
--      inserted twice on re-runs of the Places script.
--   2. unique(email) where not null — even if the same studio shows up
--      under two place_ids, we won't email them twice.

create table if not exists photographer_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null,                -- 'google_places' | 'manual'
  external_id text,                    -- e.g. google place_id
  business_name text not null,
  website text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  rating numeric,                      -- Google star rating (0-5)
  user_ratings_total int,              -- review count, proxy for size
  status text not null default 'new',
  notes text,
  scraped_at timestamptz default now(),
  enriched_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists photographer_leads_source_external_idx
  on photographer_leads(source, external_id)
  where external_id is not null;

create unique index if not exists photographer_leads_email_uidx
  on photographer_leads(email)
  where email is not null;

create index if not exists photographer_leads_status_idx on photographer_leads(status);
create index if not exists photographer_leads_state_idx on photographer_leads(state);

-- RLS off intentionally — this table is admin/script-only. No user-facing
-- API ever reads from it. If we ever expose it, lock it down then.
alter table photographer_leads disable row level security;
