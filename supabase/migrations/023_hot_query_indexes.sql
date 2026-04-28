-- Indexes for the hottest lookup paths.
--
-- Every public claim/contribute URL does a `WHERE column = $code` lookup.
-- Without an index these become full table scans as data grows.
--
-- Each statement is wrapped in a DO block that checks BOTH table and column
-- existence so the migration applies cleanly across environments where the
-- schema may have drifted from the migration history.

CREATE OR REPLACE FUNCTION pg_temp.col_exists(t TEXT, c TEXT) RETURNS BOOLEAN
LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = t AND column_name = c
  )
$$;

DO $$
BEGIN
  IF pg_temp.col_exists('gifted_items', 'claim_code') THEN
    CREATE INDEX IF NOT EXISTS gifted_items_claim_code_idx ON gifted_items (claim_code);
  END IF;
  IF pg_temp.col_exists('gifted_items', 'sender_id') THEN
    CREATE INDEX IF NOT EXISTS gifted_items_sender_id_idx ON gifted_items (sender_id);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('message_uses', 'claim_code') THEN
    CREATE INDEX IF NOT EXISTS message_uses_claim_code_idx ON message_uses (claim_code);
  END IF;
  IF pg_temp.col_exists('message_uses', 'user_id') THEN
    CREATE INDEX IF NOT EXISTS message_uses_user_id_idx ON message_uses (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('affiliates', 'code') THEN
    CREATE INDEX IF NOT EXISTS affiliates_code_idx ON affiliates (code);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('affiliate_referrals', 'affiliate_id') THEN
    CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_id_idx ON affiliate_referrals (affiliate_id);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('voice_messages', 'user_id') THEN
    CREATE INDEX IF NOT EXISTS voice_messages_user_id_idx ON voice_messages (user_id);
  END IF;
  IF pg_temp.col_exists('voice_messages', 'status') AND pg_temp.col_exists('voice_messages', 'scheduled_date') THEN
    CREATE INDEX IF NOT EXISTS voice_messages_status_scheduled_date_idx ON voice_messages (status, scheduled_date);
  ELSIF pg_temp.col_exists('voice_messages', 'status') AND pg_temp.col_exists('voice_messages', 'send_date') THEN
    CREATE INDEX IF NOT EXISTS voice_messages_status_send_date_idx ON voice_messages (status, send_date);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('letters', 'user_id') THEN
    CREATE INDEX IF NOT EXISTS letters_user_id_idx ON letters (user_id);
  END IF;
  IF pg_temp.col_exists('letters', 'status') AND pg_temp.col_exists('letters', 'scheduled_date') THEN
    CREATE INDEX IF NOT EXISTS letters_status_scheduled_date_idx ON letters (status, scheduled_date);
  ELSIF pg_temp.col_exists('letters', 'status') AND pg_temp.col_exists('letters', 'send_date') THEN
    CREATE INDEX IF NOT EXISTS letters_status_send_date_idx ON letters (status, send_date);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('gift_credits', 'user_id') THEN
    CREATE INDEX IF NOT EXISTS gift_credits_user_id_idx ON gift_credits (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('gift_assignments', 'user_id') THEN
    CREATE INDEX IF NOT EXISTS gift_assignments_user_id_idx ON gift_assignments (user_id);
  END IF;
  IF pg_temp.col_exists('gift_assignments', 'status') AND pg_temp.col_exists('gift_assignments', 'occasion_date') THEN
    CREATE INDEX IF NOT EXISTS gift_assignments_status_occasion_date_idx
      ON gift_assignments (status, occasion_date);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('orders', 'user_id') THEN
    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
  END IF;
  IF pg_temp.col_exists('orders', 'status') THEN
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('memory_requests', 'requester_id') THEN
    CREATE INDEX IF NOT EXISTS memory_requests_requester_id_idx ON memory_requests (requester_id);
  END IF;
  IF pg_temp.col_exists('memory_requests', 'unique_code') THEN
    CREATE INDEX IF NOT EXISTS memory_requests_unique_code_idx ON memory_requests (unique_code);
  ELSIF pg_temp.col_exists('memory_requests', 'claim_code') THEN
    CREATE INDEX IF NOT EXISTS memory_requests_claim_code_idx ON memory_requests (claim_code);
  END IF;
END $$;

DO $$
BEGIN
  IF pg_temp.col_exists('memory_recordings', 'request_id') THEN
    CREATE INDEX IF NOT EXISTS memory_recordings_request_id_idx ON memory_recordings (request_id);
  END IF;
END $$;
