-- 015: Gift Assignments (Phase 2)
-- Creates the gift_assignments table for tracking assigned gift credits

CREATE TABLE IF NOT EXISTS gift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES gift_credits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  relationship TEXT,
  is_pet BOOLEAN DEFAULT false,
  pet_type TEXT,
  occasion_type TEXT NOT NULL,
  occasion_date DATE NOT NULL,
  scheduled_year INT NOT NULL, -- which year of the multi-year plan (1, 2, 3...)
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  is_professional BOOLEAN DEFAULT false,
  age TEXT,
  gender TEXT,
  interests TEXT,
  gift_notes TEXT,
  recipient_industry TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, shipped, delivered, cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE gift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gift assignments"
  ON gift_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gift assignments"
  ON gift_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gift assignments"
  ON gift_assignments FOR UPDATE
  USING (auth.uid() = user_id);
