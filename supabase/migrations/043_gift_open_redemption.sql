-- 043: open-redemption (bearer) codes for off-site gift channels (Etsy, etc).
--
-- The in-app gift flow (commit 177b53c) keys claims by recipient_email.
-- That's correct for "I bought this for jane@example.com" — Jane signs in
-- with her own email to claim. But it's wrong for Etsy fulfillment, where:
--   - the Etsy buyer paid on Etsy (no Stripe session, no purchaser_user_id)
--   - the buyer may forward the code to the actual couple as the gift
--   - so the claim has to be a bearer token: whoever signs in first wins.
--
-- This migration makes vault_gift_purchases support both modes:
--   - in_app_gift (default): recipient_email NOT NULL, email-match required
--   - etsy_order, etc.: recipient_email NULL, redeemable_by_anyone = true
--
-- source + external_order_id let the admin mint endpoint dedupe accidental
-- double-clicks (same Etsy order ID = same code) via the partial unique idx.

alter table vault_gift_purchases
  alter column recipient_email drop not null,
  alter column purchaser_user_id drop not null;

alter table vault_gift_purchases
  add column if not exists source text not null default 'in_app_gift',
  add column if not exists redeemable_by_anyone boolean not null default false,
  add column if not exists external_order_id text null;

create index if not exists vault_gift_purchases_source_idx
  on vault_gift_purchases (source);

create unique index if not exists vault_gift_purchases_external_order_id_idx
  on vault_gift_purchases (source, external_order_id)
  where external_order_id is not null;
