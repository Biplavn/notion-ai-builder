# 🚀 Deployment Instructions - NotionStruct to Vercel

**Last Updated:** January 11, 2026
**Status:** ✅ Code pushed to GitHub, ready for Vercel deployment

---

## ✅ Pre-Deployment Status

**GitHub:** ✅ All changes committed and pushed
**Code Quality:** ✅ Verified and tested
**Documentation:** ✅ Complete
**Database Migration:** ⏳ Needs to be run
**Vercel Setup:** ⏳ Needs configuration

---

## 🎯 Deployment Steps

### Step 1: Set Up Vercel Project (5 minutes)

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to:** [vercel.com/new](https://vercel.com/new)
2. **Import Repository:**
   - Click "Import Git Repository"
   - Select: `Biplavn/notion-ai-builder`
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Add Environment Variables:**

   Click "Environment Variables" and add these:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
   OPENAI_API_KEY = sk-your_openai_api_key_here
   RAZORPAY_KEY_ID = rzp_live_your_key_id
   RAZORPAY_KEY_SECRET = your_razorpay_secret
   RAZORPAY_WEBHOOK_SECRET = whsec_your_webhook_secret
   ```

   **Where to find these:**
   - Supabase: [app.supabase.com](https://app.supabase.com) → Project Settings → API
   - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Razorpay: [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Note your deployment URL (e.g., `your-app.vercel.app`)

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts to link project
# Add environment variables when prompted
```

---

### Step 2: Run Database Migration (5 minutes)

**CRITICAL:** Must be done before users can access the app

1. **Open Supabase Dashboard:**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open SQL Editor:**
   - Click "SQL Editor" in sidebar
   - Click "New Query"

3. **Run Migration:**
   - Copy entire content from `MIGRATION_ADMIN_ENHANCEMENTS.sql`
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success:**
   ```sql
   -- Check new tables exist
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('subscription_history', 'credits_history', 'payment_transactions', 'admin_notifications');

   -- Should return 4 rows
   ```

5. **Verify Admin User:**
   ```sql
   SELECT email, is_admin, bonus_credits
   FROM public.users
   WHERE email = 'biplavsoccer007@gmail.com';

   -- Should show is_admin = true
   ```

---

### Step 3: Configure Razorpay Webhook (5 minutes)

1. **Get Production URL:**
   - From Vercel deployment (e.g., `https://your-app.vercel.app`)

2. **Set Up Webhook:**
   - Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
   - Settings → Webhooks
   - Click "Create New Webhook"

3. **Configure:**
   ```
   Webhook URL: https://your-app.vercel.app/api/webhooks/razorpay
   Active Events:
   ✅ payment.captured
   ✅ payment.failed
   ✅ subscription.activated
   ✅ subscription.charged
   ✅ subscription.cancelled
   ✅ subscription.paused
   ✅ subscription.resumed
   ```

4. **Save and Copy Secret:**
   - Click "Create Webhook"
   - Copy the webhook secret
   - Add to Vercel Environment Variables:
     - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
     - Add: `RAZORPAY_WEBHOOK_SECRET = whsec_xxxxx`
     - Redeploy to apply changes

---

### Step 4: Verify Deployment (10 minutes)

#### 4.1 Basic Verification

Visit your Vercel URL and check:

- [ ] Homepage loads ✅
- [ ] No console errors (F12 → Console)
- [ ] Templates page loads (`/templates`)
- [ ] Navigation works

#### 4.2 Admin Panel Verification

1. **Access Admin Panel:**
   - Go to `https://your-app.vercel.app/admin`
   - Login as `biplavsoccer007@gmail.com`

2. **Test Features:**
   - [ ] Admin panel loads
   - [ ] Users tab shows users
   - [ ] Click Gift icon → Modal opens
   - [ ] Can add/subtract credits
   - [ ] Templates tab works
   - [ ] Analytics displays

#### 4.3 User Pages Verification

1. **Create Test Account:**
   - Sign up with test email
   - Verify email

2. **Test Pages:**
   - [ ] `/dashboard` loads and shows stats
   - [ ] `/subscription` displays plan info
   - [ ] `/profile` shows user info
   - [ ] Navigation between pages works

#### 4.4 Webhook Verification

**Test with Razorpay Test Mode:**

1. Go to Razorpay Dashboard → Test Mode
2. Create test payment
3. Check Vercel Logs:
   - Vercel Dashboard → Your Project → Deployments → Latest → Function Logs
   - Look for webhook events
4. Verify user upgraded to Pro in database

---

### Step 5: Post-Deployment Tasks (15 minutes)

#### 5.1 Configure Custom Domain (Optional)

1. **Vercel Dashboard:**
   - Your Project → Settings → Domains
   - Add your domain (e.g., `notionstruct.com`)
   - Follow DNS configuration instructions

2. **Update Razorpay Webhook:**
   - Change webhook URL to custom domain
   - `https://notionstruct.com/api/webhooks/razorpay`

#### 5.2 Set Up Monitoring

**Vercel Analytics (Free):**
- Vercel Dashboard → Your Project → Analytics
- Enable "Web Analytics"

**Error Tracking (Optional - Sentry):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

#### 5.3 Enable HTTPS Only

- Vercel automatically provides HTTPS
- Ensure `RAZORPAY_WEBHOOK_SECRET` is set
- Test webhook with HTTPS URL

#### 5.4 Configure Email Notifications (Optional)

If using Resend for emails:

1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Add to Vercel env vars: `RESEND_API_KEY`
4. Implement email templates (future enhancement)

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [x] Code pushed to GitHub
- [x] All files committed
- [x] Documentation complete
- [ ] Environment variables ready
- [ ] Supabase project ready
- [ ] Razorpay account ready
- [ ] OpenAI API key ready

### During Deployment
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Initial deployment successful
- [ ] Database migration run
- [ ] Admin user verified
- [ ] Webhook configured

### Post-Deployment
- [ ] Homepage loads correctly
- [ ] Admin panel accessible
- [ ] Dashboard works
- [ ] Subscription page works
- [ ] Test payment successful
- [ ] Webhook receives events
- [ ] No console errors
- [ ] Mobile responsive

### Optional
- [ ] Custom domain configured
- [ ] Analytics enabled
- [ ] Error tracking set up
- [ ] Email notifications configured

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Check:**
1. Vercel build logs for errors
2. TypeScript errors: `npm run build` locally
3. Missing dependencies in `package.json`
4. Environment variables set correctly

**Common Fixes:**
```bash
# Clear cache and rebuild
vercel --prod --force

# Check Node version (should be 18+)
# In vercel.json, add:
{
  "build": {
    "env": {
      "NODE_VERSION": "18"
    }
  }
}
```

### Admin Panel Returns 403

**Issue:** Admin not set in database

**Fix:**
```sql
UPDATE public.users
SET is_admin = true
WHERE email = 'biplavsoccer007@gmail.com';
```

### Webhook Not Working

**Check:**
1. Webhook URL is publicly accessible
2. `RAZORPAY_WEBHOOK_SECRET` is set in Vercel
3. Events are selected in Razorpay dashboard
4. Check Vercel Function Logs for errors

**Test Webhook:**
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -d '{"event": "test"}'
```

### Environment Variables Not Working

**Steps:**
1. Verify all env vars in Vercel Dashboard
2. Redeploy after adding/changing env vars
3. Check variable names match exactly (case-sensitive)
4. Ensure `NEXT_PUBLIC_` prefix for client-side vars

---

## 📊 Performance Optimization

### After Deployment

**Enable Caching:**
- Vercel automatically caches static assets
- API routes cache with `revalidate` param

**Optimize Images:**
- Use Next.js Image component
- Images auto-optimized by Vercel

**Monitor Performance:**
- Vercel Analytics → Web Vitals
- Track: LCP, FID, CLS

---

## 🔒 Security Checklist

### Post-Deployment Security

- [ ] All API keys in environment variables (not code)
- [ ] Webhook signature verification enabled
- [ ] HTTPS only (Vercel default)
- [ ] Row Level Security enabled in Supabase
- [ ] Admin routes protected
- [ ] Rate limiting considered (future)
- [ ] CORS configured for webhooks

---

## 📈 Scaling Considerations

### When You Grow

**At 100+ users:**
- Monitor Supabase usage
- Consider upgrading Supabase plan

**At 500+ users:**
- Add pagination to admin panel
- Implement caching for templates
- Consider CDN for images

**At 1000+ users:**
- Upgrade Vercel plan for analytics
- Add rate limiting
- Consider database read replicas
- Implement Redis caching

---

## 🎉 Success Criteria

**Deployment Successful When:**

✅ Vercel deployment shows "Ready"
✅ Homepage loads without errors
✅ Admin can access `/admin`
✅ Users can access `/dashboard`
✅ Payments process via webhook
✅ Database queries work
✅ No console errors
✅ Mobile responsive

**Status:** Ready to deploy!

---

## 📞 Support Resources

**Documentation:**
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Razorpay Docs: [razorpay.com/docs](https://razorpay.com/docs)

**Project Documentation:**
- `README_ADMIN_SYSTEM.md` - Overview
- `QUICK_START_ADMIN.md` - Quick setup
- `ADMIN_ENHANCEMENTS_GUIDE.md` - Features
- `TESTING_GUIDE.md` - Testing

---

## 🚀 Deploy Now!

**You're ready to deploy. Just follow Steps 1-5 above.**

**Estimated Total Time:** 30-40 minutes
**Difficulty:** Easy (well-documented)
**Risk:** Low (all code verified)

**Good luck! 🎉**

---

**Last Updated:** January 11, 2026
**Version:** 1.0.0
**Status:** Production Ready
