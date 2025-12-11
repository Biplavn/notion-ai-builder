-- Migration: Update to Freemium Pricing Model
-- Run this in Supabase SQL Editor to update existing database

-- 1. Add new column for AI generations (lifetime tracking)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS ai_generations_lifetime integer DEFAULT 0;

-- 2. Migrate existing data (if you have users)
-- Copy monthly AI generations to lifetime (one-time migration)
UPDATE public.users 
SET ai_generations_lifetime = COALESCE(ai_generations_this_month, 0)
WHERE ai_generations_lifetime = 0;

-- 3. Drop old columns that are no longer needed
ALTER TABLE public.users 
DROP COLUMN IF EXISTS templates_downloaded_this_month,
DROP COLUMN IF EXISTS templates_downloaded_lifetime,
DROP COLUMN IF EXISTS ai_generations_this_month,
DROP COLUMN IF EXISTS last_reset_date;

-- 4. Verify the changes
SELECT 
    id,
    email,
    subscription_plan,
    ai_generations_lifetime,
    created_at
FROM public.users
LIMIT 10;

-- 5. Update any existing free users to have correct limits
-- (Optional: Reset AI generations for testing)
-- UPDATE public.users 
-- SET ai_generations_lifetime = 0
-- WHERE subscription_plan = 'free';

COMMENT ON COLUMN public.users.ai_generations_lifetime IS 'Total AI generations used (free users get 5 lifetime)';
