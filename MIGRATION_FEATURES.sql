-- NotionStruct Feature Migration
-- Run this in Supabase SQL Editor to add new features

-- ==================================================
-- 1. FAVORITES TABLE - Let users bookmark templates
-- ==================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Anyone can see favorites count, users can manage their own
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 2. REVIEWS TABLE - Let users rate and review templates
-- ==================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT,  -- Cached for display without join
  user_avatar TEXT, -- Cached avatar URL
  template_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public data)
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 3. ADD ADMIN FIELDS TO USERS TABLE
-- ==================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bonus_credits INTEGER DEFAULT 0;

-- ==================================================
-- 4. TEMPLATE OVERRIDES TABLE - Admin can override template settings
-- ==================================================
CREATE TABLE IF NOT EXISTS public.template_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT UNIQUE NOT NULL,
  is_pro BOOLEAN,
  price DECIMAL(10,2),
  is_featured BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  custom_name TEXT,
  custom_description TEXT,
  admin_notes TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can read overrides (needed for display)
CREATE POLICY "Anyone can view template overrides" ON public.template_overrides
  FOR SELECT USING (true);

-- ==================================================
-- 5. ADMIN AUDIT LOG - Track admin actions
-- ==================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'template', 'review'
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit log
CREATE POLICY "Service role can view audit log" ON public.admin_audit_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can insert audit log" ON public.admin_audit_log
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ==================================================
-- 6. INDEXES FOR PERFORMANCE
-- ==================================================
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_template_id ON public.favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_reviews_template_id ON public.reviews(template_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_template_overrides_template_id ON public.template_overrides(template_id);

-- ==================================================
-- 7. HELPER FUNCTIONS
-- ==================================================

-- Function to get average rating for a template
CREATE OR REPLACE FUNCTION get_template_rating(p_template_id TEXT)
RETURNS TABLE(avg_rating DECIMAL, review_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::DECIMAL(3,2), 0) as avg_rating,
    COUNT(*)::INTEGER as review_count
  FROM public.reviews
  WHERE template_id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get favorites count for a template
CREATE OR REPLACE FUNCTION get_template_favorites_count(p_template_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM public.favorites WHERE template_id = p_template_id);
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 8. SET ADMIN USER
-- ==================================================
-- This should be run AFTER the user has signed up
-- UPDATE public.users SET is_admin = true WHERE email = 'biplavsoccer007@gmail.com';

-- ==================================================
-- SUCCESS MESSAGE
-- ==================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete! New tables: favorites, reviews, template_overrides, admin_audit_log';
  RAISE NOTICE '✅ New user fields: is_suspended, is_admin, admin_notes, bonus_credits';
  RAISE NOTICE '⚠️  Remember to run: UPDATE public.users SET is_admin = true WHERE email = ''biplavsoccer007@gmail.com'';';
END $$;
