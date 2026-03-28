-- Add 'paused' to shipment_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'paused'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'shipment_status')
  ) THEN
    ALTER TYPE public.shipment_status ADD VALUE 'paused';
  END IF;
END
$$;

-- Add pet_type column to recipients if not exists
ALTER TABLE public.recipients ADD COLUMN IF NOT EXISTS pet_type text;

-- Add extra profile columns to recipients if they don't exist yet
ALTER TABLE public.recipients ADD COLUMN IF NOT EXISTS age text;
ALTER TABLE public.recipients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.recipients ADD COLUMN IF NOT EXISTS interests text;
ALTER TABLE public.recipients ADD COLUMN IF NOT EXISTS card_message text;
ALTER TABLE public.recipients ADD COLUMN IF NOT EXISTS gift_notes text;

-- Refund requests table
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending',
  refund_amount integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund requests
CREATE POLICY "Users can view own refund requests"
  ON public.refund_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own refund requests
CREATE POLICY "Users can insert own refund requests"
  ON public.refund_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own shipments (for pause/unpause)
CREATE POLICY "Users can update shipments for own orders"
  ON public.shipments FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );
