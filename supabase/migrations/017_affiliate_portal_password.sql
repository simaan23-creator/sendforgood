-- Add portal_password column to affiliates table
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS portal_password TEXT;
