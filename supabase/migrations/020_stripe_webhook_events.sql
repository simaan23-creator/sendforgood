-- Idempotency table for Stripe webhook events.
-- Stripe occasionally redelivers events; we record each event id
-- the first time we see it and short-circuit any duplicates.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id          TEXT PRIMARY KEY,           -- the Stripe event id (evt_*)
  type        TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service role only (no RLS policies needed; the table is server-side only,
-- but we still enable RLS to deny anon/authenticated access by default).
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
