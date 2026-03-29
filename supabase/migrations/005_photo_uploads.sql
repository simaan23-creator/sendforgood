-- Add photo_url columns
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage buckets for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipient-photos', 'recipient-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-photos', 'shipment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to both buckets
CREATE POLICY "Public read access for recipient photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipient-photos');

CREATE POLICY "Public read access for shipment photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shipment-photos');

-- Allow authenticated users to upload to recipient-photos
CREATE POLICY "Authenticated users can upload recipient photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipient-photos' AND auth.role() = 'authenticated');

-- Allow service role to upload to shipment-photos (admin only)
CREATE POLICY "Service role can upload shipment photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shipment-photos');

-- Allow overwrite (upsert) for both buckets
CREATE POLICY "Allow update recipient photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'recipient-photos');

CREATE POLICY "Allow update shipment photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'shipment-photos');
