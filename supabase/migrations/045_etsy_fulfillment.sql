-- Etsy auto-fulfillment: OAuth token storage + fulfillment tracking.
--
-- etsy_tokens holds the single rotating OAuth token pair for the shop's
-- Etsy app (Etsy v3 rotates the refresh token on every refresh, so tokens
-- must live in the DB, not env vars). RLS enabled with no policies =
-- service-role access only.

create table if not exists etsy_tokens (
  id smallint primary key default 1 check (id = 1),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table etsy_tokens enable row level security;

-- Track automated delivery on Etsy-minted gift rows: which address the
-- claim email went to and when. Null = not yet emailed (cron will pick up).
alter table vault_gift_purchases
  add column if not exists fulfillment_email text,
  add column if not exists fulfillment_emailed_at timestamptz;

notify pgrst, 'reload schema';
