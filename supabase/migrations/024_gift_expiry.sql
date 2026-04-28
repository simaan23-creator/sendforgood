-- Gift expiry: senders can set how long a gift link stays claimable.
-- Cron job /api/cron/expire-gifts flips status to 'expired' once expires_at passes.
ALTER TABLE gifted_items
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS gifted_items_status_expires_idx
  ON gifted_items (status, expires_at);
