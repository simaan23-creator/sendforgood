-- Direct gift purchases of Anniversary Capsules (and future bundles).
-- A guest at /vault/buy?bundle=anniversary toggles "Gift this Capsule",
-- enters recipient email, and pays via Stripe. The webhook creates a row
-- here with a one-time claim_code; the recipient claims it at
-- /gift/vault/claim/[code] which deposits credits + vault_fees on their
-- account.
--
-- Distinct from affiliate_grants (photographer-driven gifting from their
-- per-account quota) and admin_vault_gifts (manual ops gifts).
create table if not exists vault_gift_purchases (
  id uuid primary key default gen_random_uuid(),
  purchaser_user_id uuid not null references auth.users(id) on delete cascade,
  purchaser_email text not null,
  recipient_email text not null,
  recipient_name text null,
  personal_message text null,
  audio_credits int not null default 0,
  video_credits int not null default 0,
  photo_credits int not null default 0,
  vault_fees int not null default 1,
  bundle text not null default 'anniversary',
  claim_code text unique not null,
  stripe_payment_intent_id text not null,
  status text not null default 'pending',
  claimed_user_id uuid null references auth.users(id) on delete set null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists vault_gift_purchases_claim_code_idx
  on vault_gift_purchases (claim_code);

create index if not exists vault_gift_purchases_recipient_email_idx
  on vault_gift_purchases (lower(recipient_email));

create index if not exists vault_gift_purchases_purchaser_idx
  on vault_gift_purchases (purchaser_user_id);

create index if not exists vault_gift_purchases_pending_idx
  on vault_gift_purchases (status)
  where status = 'pending';
