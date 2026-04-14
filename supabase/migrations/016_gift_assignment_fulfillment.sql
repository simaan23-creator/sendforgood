-- 016: Gift Assignment Fulfillment
-- Adds tracking_number, admin_notes, and country columns for fulfillment workflow

ALTER TABLE gift_assignments ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE gift_assignments ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE gift_assignments ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
