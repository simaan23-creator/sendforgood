-- Add delivery type columns to letters table
ALTER TABLE letters ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'physical';
ALTER TABLE letters ADD COLUMN IF NOT EXISTS recipient_email text;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for letter photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('letter-photos', 'letter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to letter-photos bucket
CREATE POLICY "Public read access for letter-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'letter-photos');

-- Allow authenticated users to upload to letter-photos bucket
CREATE POLICY "Authenticated users can upload letter-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'letter-photos' AND auth.role() = 'authenticated');

-- Allow users to update their own letter-photos
CREATE POLICY "Users can update their own letter-photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'letter-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own letter-photos
CREATE POLICY "Users can delete their own letter-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'letter-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
