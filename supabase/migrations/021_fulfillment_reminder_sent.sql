-- Track when the 14-day fulfillment reminder was sent so the cron is idempotent.
ALTER TABLE gift_assignments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
