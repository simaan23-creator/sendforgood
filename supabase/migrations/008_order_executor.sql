-- Add executor fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executor_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executor_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executor_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executor_address text;
