-- Executor access requests table
CREATE TABLE IF NOT EXISTS executor_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_relationship text NOT NULL,
  account_holder_name text NOT NULL,
  account_holder_email text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT executor_access_requests_status_check
    CHECK (status IN ('pending', 'approved', 'denied'))
);

CREATE INDEX IF NOT EXISTS executor_access_requests_status_idx
  ON executor_access_requests (status);
CREATE INDEX IF NOT EXISTS executor_access_requests_created_at_idx
  ON executor_access_requests (created_at DESC);

-- RLS: no public access. All reads/writes go through supabaseAdmin (service role).
ALTER TABLE executor_access_requests ENABLE ROW LEVEL SECURITY;
