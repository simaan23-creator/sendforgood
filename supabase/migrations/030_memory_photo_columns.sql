-- Add photo support columns that were missed when photo credits were wired
-- into the webhook (src/app/api/webhooks/stripe/route.ts handleVaultCreditOrder).
--
-- Without these columns, every purchase that includes photo slots — including
-- the new $99.95 Starter Package (1 vault + 50 video + 200 photo) — silently
-- fails at the webhook step because supabaseAdmin.insert({ photo_credits: N })
-- throws "column does not exist".

-- 1. memory_credits.photo_credits — credit balance for photo uploads
alter table memory_credits
  add column if not exists photo_credits int not null default 0;

-- 2. memory_requests.max_photo_uploads — per-vault cap on photo uploads
alter table memory_requests
  add column if not exists max_photo_uploads int not null default 0;
