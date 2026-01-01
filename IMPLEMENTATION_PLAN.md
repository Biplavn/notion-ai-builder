# 🚀 NotionStruct Feature Implementation Plan

## Overview
Implementing 5 major features + Razorpay integration with full testing.

---

## 📋 Features to Implement

### 1. Template Favorites/Bookmarks ⭐
**Database Schema:**
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);
```

**Components:**
- `FavoriteButton.tsx` - Heart icon toggle
- Update `TemplateGallery.tsx` to show favorites
- "My Favorites" filter/tab on homepage

**API Routes:**
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites` - Remove favorite
- `GET /api/favorites` - List user's favorites

---

### 2. Template Previews/Interactive Demo 👁️
**Components:**
- `TemplatePreview.tsx` - Interactive mockup component
- Add preview modal with live database simulation
- Show sample data, filtering, different views

**Features:**
- Table view with sample rows
- Board view simulation
- Calendar view option
- Interactive filtering demo

---

### 3. User Profile Page 👤
**Route:** `/profile`

**Sections:**
- Profile header (avatar, name, email)
- Subscription status & upgrade option
- My Favorites (with pagination)
- Downloaded Templates history
- AI Generation history
- Account settings

---

### 4. User Reviews & Ratings ⭐⭐⭐⭐⭐
**Database Schema:**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);
```

**Components:**
- `StarRating.tsx` - Clickable star rating
- `ReviewCard.tsx` - Single review display
- `ReviewsList.tsx` - List with pagination
- `WriteReviewModal.tsx` - Submit review

---

### 5. Admin Panel 🔐
**Route:** `/admin` (Protected for biplavsoccer007@gmail.com only)

**Features:**
| Section | Actions |
|---------|---------|
| Users | View all, give credits, make pro, suspend |
| Templates | Make free/paid, edit metadata |
| Reviews | Delete inappropriate reviews |
| Analytics | User stats, revenue, popular templates |
| Settings | App configuration |

**Security:**
- Server-side email check
- Protected API routes
- Audit logging

---

## 🔧 Technical Implementation Order

### Phase 1: Database & API Foundation (30 min)
1. ✅ Create migration SQL for new tables
2. ✅ Update Razorpay env variables
3. ✅ Create base API routes

### Phase 2: Favorites System (30 min)
1. ✅ FavoriteButton component
2. ✅ API routes for favorites
3. ✅ Integrate into gallery

### Phase 3: Reviews & Ratings (45 min)
1. ✅ StarRating component
2. ✅ Review submission system
3. ✅ Display reviews on template page

### Phase 4: User Profile (30 min)
1. ✅ Profile page layout
2. ✅ Favorites section
3. ✅ History sections

### Phase 5: Template Previews (45 min)
1. ✅ Interactive preview component
2. ✅ Sample data simulation
3. ✅ Different view modes

### Phase 6: Admin Panel (60 min)
1. ✅ Protected route setup
2. ✅ User management
3. ✅ Template management
4. ✅ Analytics dashboard

### Phase 7: Razorpay Integration (20 min)
1. ✅ Update env with test credentials
2. ✅ Test payment flow
3. ✅ Verify subscription updates

### Phase 8: Testing (30 min)
1. ✅ End-to-end testing
2. ✅ Fix any bugs
3. ✅ Deploy to production

---

## 📊 Database Migration SQL

```sql
-- Run this in Supabase SQL Editor

-- 1. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Add is_suspended field to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_template_id ON public.reviews(template_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 5. Admin policies (service role can do everything)
CREATE POLICY "Service role full access to users" ON public.users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 🔐 Admin Email
```
biplavsoccer007@gmail.com
```

---

## 💳 Razorpay Test Credentials
```
RAZORPAY_KEY_ID=rzp_test_RtX1ZoEhA4IZj8
RAZORPAY_KEY_SECRET=CmT6Kj024K84aejraC4QGREo
```

---

## ✅ Implementation Status
- [ ] Phase 1: Database & API
- [ ] Phase 2: Favorites
- [ ] Phase 3: Reviews
- [ ] Phase 4: Profile
- [ ] Phase 5: Previews
- [ ] Phase 6: Admin
- [ ] Phase 7: Razorpay
- [ ] Phase 8: Testing
