-- Add gift_assignments.scheduled_year (multi-year gift plan: 1, 2, 3, ...)
--
-- Migration 015 declared this column NOT NULL on table creation but the
-- prod table was created from an earlier schema and is missing it. The
-- /dashboard PostgREST query selects scheduled_year and returns 400, and
-- /api/gift-credits/assign writes scheduled_year on every insert (which
-- would then fail). Same drift class as migrations 020 (stripe_webhook_
-- events recovery) and 028 (memory_recordings reconcile).
--
-- The table has 0 rows in prod, so adding NOT NULL with default 1 is safe.

ALTER TABLE gift_assignments
  ADD COLUMN IF NOT EXISTS scheduled_year INT NOT NULL DEFAULT 1;

NOTIFY pgrst, 'reload schema';
