-- D2 + D3: store business_name as a first-class column and allow
-- multiple URL codes per affiliate.
--
-- business_name: was previously buried in the affiliates.notes blob.
-- D2 (co-branded landing banner) needs to display this on /vault,
-- /wedding, /pricing, /vault/buy — promoting it to a real column is
-- the cleanest fix. Falls back to `name` if null (existing rows).
--
-- aliases: D3 lets photographers rename their referral code to a
-- branded vanity slug, but we keep their old codes working forever
-- as aliases. Why: photographers print business cards, booth banners,
-- and QR codes with the original code. Killing it would break
-- physical materials they've already paid to print. Aliases are one
-- TEXT[] column and a GIN index — cheap insurance against bad CS
-- emails.
--
-- Resolution rule (used by webhook + lookup endpoint):
--   WHERE code = $1 OR $1 = ANY(aliases)

alter table affiliates
  add column if not exists business_name text;

alter table affiliates
  add column if not exists aliases text[] not null default '{}'::text[];

-- GIN supports `?` (contains), so the resolution query stays index-friendly.
create index if not exists affiliates_aliases_gin_idx
  on affiliates using gin (aliases);
