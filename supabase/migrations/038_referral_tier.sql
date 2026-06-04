-- D7: tag each referral with the commission tier active at the time
-- of the sale, so we can audit "why did this row get 12%?" without
-- recomputing from history.
--
-- Tier rules at write time (see processAffiliateReferral):
--   - first purchase by this customer  -> 'first'     (15% always)
--   - repeat, affiliate < 5 prior paid -> 'repeat_t1' (10%)
--   - repeat, 5..9 prior paid          -> 'repeat_t2' (12%)
--   - repeat, 10+ prior paid           -> 'repeat_t3' (15%)
--
-- Stored as text rather than an enum so we can adjust bands without a
-- schema migration. Old rows stay NULL (pre-D7); reports can treat
-- NULL as 'repeat_t1' for the legacy 10% behavior.

alter table affiliate_referrals
  add column if not exists tier text;

create index if not exists affiliate_referrals_tier_idx
  on affiliate_referrals(tier)
  where tier is not null;
