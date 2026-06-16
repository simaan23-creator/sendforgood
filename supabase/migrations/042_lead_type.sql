-- Persona segmentation for the cold-outreach pipeline. The
-- photographer_leads table now holds multiple lead personas
-- (photographer | officiant | planner | videographer ...) so we can
-- run parallel campaigns without forking the lead-storage schema.
--
-- Existing rows backfill to 'photographer' which preserves cron behavior
-- (the cron filters by lead_type explicitly after this migration ships).
alter table photographer_leads
  add column if not exists lead_type text not null default 'photographer';

update photographer_leads
  set lead_type = 'photographer'
  where lead_type is null;

create index if not exists photographer_leads_type_status_idx
  on photographer_leads (lead_type, status);
