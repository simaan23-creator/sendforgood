-- Idempotency table for Stripe webhook events.
-- Migration 020 was marked applied on remote without actually running its SQL,
-- so the table never existed in prod. This migration recreates it idempotently.
-- The presence of this table is required by src/app/api/webhooks/stripe/route.ts
-- which upserts every incoming event id at the top of the handler.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id          TEXT PRIMARY KEY,           -- the Stripe event id (evt_*)
  type        TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Force PostgREST to reload its schema cache so the table is immediately visible.
NOTIFY pgrst, 'reload schema';
