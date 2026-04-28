-- Indexes for the hottest lookup paths.
--
-- Every public claim/contribute URL does a `WHERE column = $code` lookup.
-- Without an index these become full table scans as data grows. CREATE INDEX
-- IF NOT EXISTS is safe to re-run; existing tables (e.g. those backed by a
-- UNIQUE constraint that already auto-created an index) are no-ops.
--
-- A few of these tables may not exist in every environment (depending on
-- whether the table was created via a prior migration or directly in the
-- Supabase Studio). The DO blocks let the migration apply cleanly either way.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gifted_items') THEN
    CREATE INDEX IF NOT EXISTS gifted_items_claim_code_idx ON gifted_items (claim_code);
    CREATE INDEX IF NOT EXISTS gifted_items_user_id_idx ON gifted_items (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_uses') THEN
    CREATE INDEX IF NOT EXISTS message_uses_claim_code_idx ON message_uses (claim_code);
    CREATE INDEX IF NOT EXISTS message_uses_user_id_idx ON message_uses (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates') THEN
    CREATE INDEX IF NOT EXISTS affiliates_code_idx ON affiliates (code);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_referrals') THEN
    CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_id_idx ON affiliate_referrals (affiliate_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_messages') THEN
    CREATE INDEX IF NOT EXISTS voice_messages_user_id_idx ON voice_messages (user_id);
    CREATE INDEX IF NOT EXISTS voice_messages_status_send_date_idx ON voice_messages (status, send_date);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'letters') THEN
    CREATE INDEX IF NOT EXISTS letters_user_id_idx ON letters (user_id);
    CREATE INDEX IF NOT EXISTS letters_status_send_date_idx ON letters (status, send_date);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gift_credits') THEN
    CREATE INDEX IF NOT EXISTS gift_credits_user_id_idx ON gift_credits (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gift_assignments') THEN
    CREATE INDEX IF NOT EXISTS gift_assignments_user_id_idx ON gift_assignments (user_id);
    CREATE INDEX IF NOT EXISTS gift_assignments_status_occasion_date_idx
      ON gift_assignments (status, occasion_date);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_requests') THEN
    CREATE INDEX IF NOT EXISTS memory_requests_user_id_idx ON memory_requests (user_id);
    CREATE INDEX IF NOT EXISTS memory_requests_claim_code_idx ON memory_requests (claim_code);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_recordings') THEN
    CREATE INDEX IF NOT EXISTS memory_recordings_request_id_idx ON memory_recordings (request_id);
  END IF;
END $$;
