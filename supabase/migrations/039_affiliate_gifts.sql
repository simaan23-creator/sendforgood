-- Per-affiliate gift quota. New affiliates get 1 gift slot at signup.
-- Existing affiliates backfilled to 1 so the perk applies to everyone in the program.
alter table affiliates
  add column if not exists gift_credits int not null default 0;

update affiliates set gift_credits = 1 where gift_credits = 0;

-- Extend affiliate_grants to support gifts (vs. personal signup grants).
-- recipient_email + personal_message are set when the photographer fills the
-- gift form; expires_at is set to now() + 90 days at that time. Unclaimed
-- gifts past expires_at are dead inventory.
alter table affiliate_grants
  add column if not exists recipient_email text null,
  add column if not exists personal_message text null,
  add column if not exists expires_at timestamptz null;

create index if not exists affiliate_grants_recipient_email_idx
  on affiliate_grants (lower(recipient_email))
  where recipient_email is not null;

create index if not exists affiliate_grants_expires_unclaimed_idx
  on affiliate_grants (expires_at)
  where claimed_user_id is null and expires_at is not null;

-- Stamp the gifting photographer onto the vault the recipient creates.
-- Used by the unlock-notification cron to email the photographer when their
-- gift opens, and by analytics to compute the "activated" stage of the gift
-- funnel.
alter table memory_requests
  add column if not exists gifted_by_affiliate_id uuid null
  references affiliates(id) on delete set null;

-- Durable affiliate attribution for users who received a gift. Cookie-based
-- attribution is fragile (cleared cookies, different device); this persists
-- on the profile so any future checkout by the recipient pays commission to
-- the gifting photographer.
alter table profiles
  add column if not exists attributed_affiliate_id uuid null
  references affiliates(id) on delete set null;
