-- Add pet occasion types to the occasion_type enum
ALTER TYPE public.occasion_type ADD VALUE IF NOT EXISTS 'pet_birthday';
ALTER TYPE public.occasion_type ADD VALUE IF NOT EXISTS 'pet_gotcha_day';
