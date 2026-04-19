-- Add recipient_name directly to letters table
ALTER TABLE letters ADD COLUMN IF NOT EXISTS recipient_name text;
