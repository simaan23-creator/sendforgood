-- Reconcile memory_recordings schema drift.
--
-- Background: migration 012 (in git) defines memory_recordings with columns
--   (id, request_id, recorder_name, audio_url, duration_seconds, status, created_at, message_format).
-- The prod table was created from an older version and actually has
--   (id, request_id, recorder_name, audio_url, video_url, message_type, recorded_at, delivered, message_format).
--
-- All current app code (vault view API, listen-memory page, send-memory-recordings cron)
-- reads/writes status, created_at, and (sometimes) duration_seconds. None of it reads
-- the legacy delivered / recorded_at / video_url / message_type columns. Most notably,
-- /api/cron/send-memory-recordings has been silently failing every day at 9am because
-- it filters by `.eq("status","pending")` and updates `{ status: "delivered" }` on a
-- column that does not exist — no scheduled vault recording has ever auto-delivered.
--
-- This migration is purely additive: it adds the three missing columns, backfills
-- them from the legacy columns where possible, and reloads PostgREST. The legacy
-- columns are intentionally NOT dropped so a rollback (revert this migration) is
-- harmless and so any forgotten downstream consumer keeps working.

-- 1. duration_seconds — nullable int, never written by app, just needs to exist
ALTER TABLE memory_recordings
  ADD COLUMN IF NOT EXISTS duration_seconds INT;

-- 2. created_at — backfill from legacy recorded_at where present, default now()
ALTER TABLE memory_recordings
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- For existing rows, copy recorded_at into created_at where it isn't already set
-- to the default. We use a guarded update so this is safe to re-run.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memory_recordings' AND column_name = 'recorded_at'
  ) THEN
    UPDATE memory_recordings
    SET created_at = recorded_at
    WHERE recorded_at IS NOT NULL
      AND created_at <> recorded_at;
  END IF;
END $$;

-- 3. status — backfill from legacy delivered bool, then enforce check + not null
ALTER TABLE memory_recordings
  ADD COLUMN IF NOT EXISTS status TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memory_recordings' AND column_name = 'delivered'
  ) THEN
    UPDATE memory_recordings
    SET status = CASE WHEN delivered THEN 'delivered' ELSE 'pending' END
    WHERE status IS NULL;
  END IF;
END $$;

-- Any rows still null (no legacy delivered column at all) → default to 'pending'
UPDATE memory_recordings SET status = 'pending' WHERE status IS NULL;

-- Now that every row has a value, enforce NOT NULL + default + check constraint
ALTER TABLE memory_recordings ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE memory_recordings ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'memory_recordings'
      AND constraint_name = 'memory_recordings_status_check'
  ) THEN
    ALTER TABLE memory_recordings
      ADD CONSTRAINT memory_recordings_status_check
      CHECK (status IN ('pending', 'delivered'));
  END IF;
END $$;

-- 4. Index for the daily delivery cron's hot path
CREATE INDEX IF NOT EXISTS idx_memory_recordings_status_request
  ON memory_recordings(status, request_id);

-- 5. Reload PostgREST schema cache so the new columns are immediately visible
NOTIFY pgrst, 'reload schema';
