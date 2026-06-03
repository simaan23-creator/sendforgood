-- Tag memory_credits rows with the bundle that minted them.
--
-- Why: the Anniversary Capsule bundle (1 vault + 6 video + 15 photo,
-- $29.95) ships with a hard 12-month seal cap. The cap is enforced at
-- vault-creation time by looking at the credits being consumed: if ANY
-- of them came from an 'anniversary' bundle, the user's chosen
-- sealed_until is clamped to (created_at + 12 months).
--
-- Recording the bundle on the credit row (rather than on the vault row
-- or the order row) keeps the rule simple: the limit travels with the
-- credit. A user can't combine sampler credits with full credits to
-- escape the cap.
--
-- Also used by D1 (free vault on affiliate signup): the auto-granted
-- credits get bundle='anniversary' so the same enforcement applies for
-- free; no new code path.

alter table memory_credits
  add column if not exists bundle text;

create index if not exists memory_credits_bundle_idx
  on memory_credits(bundle)
  where bundle is not null;
