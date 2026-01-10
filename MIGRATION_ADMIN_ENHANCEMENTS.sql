-- NotionStruct Admin Panel Enhancements Migration
-- Run this in Supabase SQL Editor to add enhanced admin functionality
-- Date: 2026-01-11

-- ==================================================
-- 1. ADD SUBSCRIPTION TRACKING FIELDS TO USERS TABLE
-- ==================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

-- ==================================================
-- 2. ENHANCE BONUS CREDITS TRACKING
-- ==================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_credits_granted INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credits_granted_by TEXT; -- Admin email who granted
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_credit_grant_at TIMESTAMPTZ;

-- ==================================================
-- 3. CREATE SUBSCRIPTION HISTORY TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'upgraded', 'downgraded', 'canceled', 'renewed', 'payment_failed'
  from_plan TEXT,
  to_plan TEXT,
  amount DECIMAL(10,2),
  razorpay_payment_id TEXT,
  admin_email TEXT, -- If changed by admin
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history" ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON public.subscription_history(created_at DESC);

-- ==================================================
-- 4. CREATE CREDITS HISTORY TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS public.credits_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Positive for grants, negative for usage
  type TEXT NOT NULL, -- 'admin_grant', 'ai_generation', 'refund', 'bonus'
  description TEXT,
  admin_email TEXT, -- If granted by admin
  related_generation_id UUID REFERENCES public.ai_generations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits history" ON public.credits_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_credits_history_user_id ON public.credits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_history_created_at ON public.credits_history(created_at DESC);

-- ==================================================
-- 5. CREATE ADMIN NOTIFICATIONS TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'payment_failed', 'new_user', 'subscription_canceled', 'low_credits'
  title TEXT NOT NULL,
  message TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can see notifications (handled in API layer)
CREATE POLICY "Service role can manage notifications" ON public.admin_notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- ==================================================
-- 6. ADD USAGE ANALYTICS FIELDS
-- ==================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_logins INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS templates_downloaded INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_templates_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reviews_written INTEGER DEFAULT 0;

-- ==================================================
-- 7. CREATE PAYMENT TRANSACTIONS TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL, -- 'pending', 'captured', 'failed', 'refunded'
  payment_method TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_payment_id ON public.payment_transactions(razorpay_payment_id);

-- ==================================================
-- 8. SET ADMIN USER
-- ==================================================
-- Update the admin user
UPDATE public.users
SET
  is_admin = true,
  admin_notes = 'Primary administrator - Full access',
  updated_at = NOW()
WHERE email = 'biplavsoccer007@gmail.com';

-- ==================================================
-- 9. CREATE HELPER FUNCTIONS
-- ==================================================

-- Function to track AI generation and update credits
CREATE OR REPLACE FUNCTION track_ai_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment lifetime AI generations
  UPDATE public.users
  SET ai_generations_lifetime = COALESCE(ai_generations_lifetime, 0) + 1
  WHERE id = NEW.user_id;

  -- Log credit usage
  INSERT INTO public.credits_history (user_id, amount, type, description, related_generation_id)
  VALUES (NEW.user_id, -1, 'ai_generation', 'AI template generation', NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for AI generation tracking
DROP TRIGGER IF EXISTS on_ai_generation_created ON public.ai_generations;
CREATE TRIGGER on_ai_generation_created
  AFTER INSERT ON public.ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION track_ai_generation();

-- Function to track template downloads
CREATE OR REPLACE FUNCTION track_template_download()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET templates_downloaded = COALESCE(templates_downloaded, 0) + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_template_download ON public.template_downloads;
CREATE TRIGGER on_template_download
  AFTER INSERT ON public.template_downloads
  FOR EACH ROW
  EXECUTE FUNCTION track_template_download();

-- Function to track favorites
CREATE OR REPLACE FUNCTION update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
    SET favorite_templates_count = COALESCE(favorite_templates_count, 0) + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET favorite_templates_count = GREATEST(COALESCE(favorite_templates_count, 0) - 1, 0)
    WHERE id = OLD.user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_favorites_change ON public.favorites;
CREATE TRIGGER on_favorites_change
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_count();

-- Function to track reviews
CREATE OR REPLACE FUNCTION track_review_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
    SET reviews_written = COALESCE(reviews_written, 0) + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET reviews_written = GREATEST(COALESCE(reviews_written, 0) - 1, 0)
    WHERE id = OLD.user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION track_review_count();

-- ==================================================
-- 10. CREATE VIEW FOR USER ANALYTICS
-- ==================================================
CREATE OR REPLACE VIEW user_analytics AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.subscription_plan,
  u.subscription_status,
  u.ai_generations_lifetime,
  u.bonus_credits,
  u.templates_downloaded,
  u.favorite_templates_count,
  u.reviews_written,
  u.total_logins,
  u.last_login_at,
  u.created_at,
  COALESCE(
    (SELECT SUM(amount) FROM public.payment_transactions WHERE user_id = u.id AND status = 'captured'),
    0
  ) as total_revenue,
  (SELECT COUNT(*) FROM public.ai_generations WHERE user_id = u.id) as total_ai_generations,
  (SELECT COUNT(*) FROM public.template_downloads WHERE user_id = u.id) as total_downloads
FROM public.users u;

-- ==================================================
-- SUCCESS MESSAGE
-- ==================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Admin enhancements migration complete!';
  RAISE NOTICE '✅ New tables: subscription_history, credits_history, payment_transactions, admin_notifications';
  RAISE NOTICE '✅ New fields: subscription dates, payment tracking, usage analytics';
  RAISE NOTICE '✅ New triggers: Auto-track AI generations, downloads, favorites, reviews';
  RAISE NOTICE '✅ Admin user set: biplavsoccer007@gmail.com';
  RAISE NOTICE '🎉 Your admin panel is now fully enhanced!';
END $$;
