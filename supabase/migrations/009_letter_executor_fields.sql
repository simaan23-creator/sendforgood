-- Add executor name, phone, address to letters table (email already exists from 007)
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS executor_name text;
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS executor_phone text;
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS executor_address text;
