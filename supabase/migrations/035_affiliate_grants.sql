-- D1: free Anniversary Capsule on photographer signup.
--
-- New affiliates get 1 vault + 6 video + 15 photo (the Anniversary Capsule)
-- granted automatically on signup, so they can pitch from the experience of
-- having actually used the product on their own family.
--
-- Why a separate `affiliate_grants` table instead of inserting NULL-user
-- rows into memory_credits / vault_fees: those tables both require user_id
-- (NOT NULL), and the affiliate's user account doesn't necessarily exist
-- yet at signup time. Storing the grant in its own table avoids loosening
-- the NOT NULL constraint on production tables and gives us a clean record
-- of which grants are still unclaimed.
--
-- Grants are claimed on the dashboard: when a logged-in user's email
-- matches an affiliate.email, /api/affiliate/claim-grants materializes
-- each unclaimed grant into the real memory_credits + vault_fees rows for
-- that user and marks the grant claimed.

create table if not exists affiliate_grants (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  vault_fees int not null default 0,
  audio_credits int not null default 0,
  video_credits int not null default 0,
  photo_credits int not null default 0,
  bundle text,
  source text not null,
  created_at timestamptz not null default now(),
  claimed_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz
);

create index if not exists affiliate_grants_affiliate_idx
  on affiliate_grants(affiliate_id);

create index if not exists affiliate_grants_unclaimed_idx
  on affiliate_grants(affiliate_id)
  where claimed_user_id is null;

-- Admin/service-role only — no public access. RLS on, zero policies.
alter table affiliate_grants enable row level security;
