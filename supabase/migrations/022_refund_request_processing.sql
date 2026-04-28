-- Add processing fields so admins can mark refund requests as
-- approved/denied and link the resulting Stripe refund.
ALTER TABLE refund_requests
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS refund_requests_status_idx
  ON refund_requests (status, created_at DESC);
