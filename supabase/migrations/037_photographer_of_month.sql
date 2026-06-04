-- D5: Photographer of the Month feature.
--
-- One row per published feature. The admin picks a winner from the
-- prior-month top 5 (by paid referral count), pastes a quote, supplies
-- a photo URL, and publishes — the row drives the public /partners
-- page and gets emailed to the winner.
--
-- `month` stores the first day of the featured month so we can sort
-- and detect duplicates per month (a unique index enforces one winner
-- per calendar month).

create table if not exists photographer_of_month (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  month date not null,
  business_name text not null,
  photo_url text,
  quote text,
  website text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists photographer_of_month_month_unique
  on photographer_of_month(month);

create index if not exists photographer_of_month_published_idx
  on photographer_of_month(published_at desc);

-- Admin/service-role only — no public access through RLS.
-- The public /partners page reads via the service role inside a server
-- component (or via a SECURITY DEFINER view), not via RLS.
alter table photographer_of_month enable row level security;
