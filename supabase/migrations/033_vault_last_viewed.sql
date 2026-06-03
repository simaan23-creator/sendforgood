-- Vault view tracking + manual caller log.
--
-- Why these two together:
--   1. last_viewed_at on memory_requests lets the admin caller list
--      separate "vault opened but owner has logged in to see it" from
--      "vault opened and owner has not seen it yet" — which is where a
--      phone-call nudge is actually useful. Bumped from the existing
--      /api/vault/[id]/recordings GET handler after the owner ownership
--      check passes AND the vault is unlocked.
--
--   2. vault_call_log records each manual phone call Simaan makes from
--      the /admin/call-list page (today / 7-day no-view / 30-day no-view
--      buckets). Existing rows mean "don't show this vault in this bucket
--      again until next cycle." Eventually this is where Twilio-driven
--      automation would log, too.
--
-- No RLS — admin tooling only.

-- ──────────────────────────────────────────────────────────────────────
-- 1. memory_requests.last_viewed_at
-- ──────────────────────────────────────────────────────────────────────
alter table memory_requests
  add column if not exists last_viewed_at timestamptz;

create index if not exists memory_requests_last_viewed_idx
  on memory_requests(last_viewed_at);

-- ──────────────────────────────────────────────────────────────────────
-- 2. vault_call_log
-- ──────────────────────────────────────────────────────────────────────
create table if not exists vault_call_log (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references memory_requests(id) on delete cascade,
  bucket text not null,                  -- 'opening_today' | 'no_view_7d' | 'no_view_30d'
  called_at timestamptz not null default now(),
  notes text,
  called_by uuid                         -- auth.users.id of admin who logged the call
);

create index if not exists vault_call_log_vault_idx
  on vault_call_log(vault_id);
create index if not exists vault_call_log_called_at_idx
  on vault_call_log(called_at desc);

alter table vault_call_log disable row level security;
