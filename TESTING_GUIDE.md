# 🧪 Comprehensive Testing Guide - NotionStruct

**Manual Testing Instructions for Browser Testing**

---

## 🎯 How to Run Tests

### Prerequisites

```bash
# 1. Start the development server
npm run dev

# 2. Open browser to http://localhost:3000
```

---

## 📋 Test Checklist

### Phase 1: Basic Application Tests (5 minutes)

#### 1.1 Homepage
- [ ] Navigate to `http://localhost:3000`
- [ ] Page loads without errors
- [ ] Console has no errors (F12 → Console)
- [ ] AI prompt input is visible
- [ ] "Generate Template" button visible

**Test AI Generation:**
- [ ] Type prompt: "Project management system"
- [ ] Click "Generate Template"
- [ ] Loading spinner appears
- [ ] Blueprint preview shows
- [ ] Contains at least 2 databases
- [ ] Contains dashboard page
- [ ] "Build in Notion" button appears

#### 1.2 Templates Page
- [ ] Navigate to `/templates`
- [ ] Templates load and display
- [ ] Filter by category works
- [ ] Search functionality works
- [ ] Template cards clickable
- [ ] Free/Pro badges visible

**Click on a Template:**
- [ ] Detail page loads
- [ ] Description visible
- [ ] "Get This Template" button present
- [ ] Preview image loads (if available)

---

### Phase 2: Authentication Tests (10 minutes)

#### 2.1 Sign Up
- [ ] Click "Sign In" button
- [ ] Sign up form appears
- [ ] Create test account: `test@example.com`
- [ ] Receive verification email
- [ ] Verify email
- [ ] Redirected to homepage

#### 2.2 Sign In
- [ ] Sign out
- [ ] Sign in with test account
- [ ] Redirected to homepage
- [ ] User profile icon appears

#### 2.3 Admin Access
- [ ] Sign out
- [ ] Sign in as `biplavsoccer007@gmail.com`
- [ ] Navigate to `/admin`
- [ ] Admin panel loads
- [ ] See "Users", "Templates", "Reviews", "Analytics" tabs

**Expected Result:** Admin panel accessible only for admin email

---

### Phase 3: User Dashboard Tests (15 minutes)

#### 3.1 Profile Page
- [ ] Navigate to `/profile`
- [ ] User info displays correctly
- [ ] Email shows
- [ ] Plan badge shows (Free/Pro)
- [ ] Stats cards visible (Favorites, Downloads, AI Generations)
- [ ] "Dashboard" button visible
- [ ] "Upgrade to Pro" or "Manage Subscription" button visible

#### 3.2 Dashboard Page
- [ ] Click "Dashboard" button
- [ ] Redirected to `/dashboard`
- [ ] Welcome message with user name
- [ ] 4 stats cards display:
  - [ ] AI Credits (shows number or "Unlimited")
  - [ ] Downloads (number)
  - [ ] Favorites (number)
  - [ ] AI Created (number)
- [ ] Recent Activity section visible
- [ ] Quick Actions section visible
- [ ] Account Info card visible

**Test Quick Actions:**
- [ ] Click "Create with AI" → Goes to `/`
- [ ] Click "Browse Templates" → Goes to `/templates`
- [ ] Click "Manage Subscription" → Goes to `/subscription`

#### 3.3 Subscription Page
- [ ] Navigate to `/subscription`
- [ ] Current plan card displays
- [ ] Shows correct plan (Free or Pro)
- [ ] Credits displayed accurately
- [ ] Plan comparison section visible
- [ ] Free plan details correct
- [ ] Pro plan details correct
- [ ] If no history: "No subscription history" message

---

### Phase 4: Admin Panel Tests (30 minutes)

**Login as admin:** `biplavsoccer007@gmail.com`

#### 4.1 Users Tab

**View Users:**
- [ ] Navigate to `/admin`
- [ ] Users list displays
- [ ] Search bar visible
- [ ] User cards show:
  - [ ] Avatar/initial
  - [ ] Full name
  - [ ] Email
  - [ ] Plan badge (Free/Pro)
  - [ ] AI Credits
  - [ ] Status (Active/Suspended)
  - [ ] Joined date
  - [ ] Action buttons

**Test Search:**
- [ ] Type email in search
- [ ] List filters correctly
- [ ] Clear search
- [ ] All users return

**Test Credit Management:**
- [ ] Find any user
- [ ] Click Gift icon (🎁)
- [ ] Modal opens
- [ ] Shows current balance
- [ ] Shows user name
- [ ] Credit amount input visible
- [ ] +/- buttons work
- [ ] Type custom amount: `25`
- [ ] Quick preset buttons visible (5, 10, 25, 50, 100)
- [ ] Click preset "50" → Input updates to 50
- [ ] Click "Add 50"
- [ ] Modal closes
- [ ] User's bonus_credits increases by 50
- [ ] Click Gift icon again
- [ ] Balance shows new amount
- [ ] Type `10`
- [ ] Click "Remove 10"
- [ ] Balance decreases by 10
- [ ] Cannot go below 0
- [ ] Click "Cancel" → Modal closes

**Test Pro Toggle:**
- [ ] Find free user
- [ ] Click Crown icon (👑)
- [ ] Plan badge changes to "Pro" (gold)
- [ ] Click Crown again
- [ ] Plan changes back to "Free"
- [ ] Badge color changes

**Test Suspend:**
- [ ] Find non-admin user
- [ ] Click Ban icon (🚫)
- [ ] Status changes to "Suspended" (red)
- [ ] Click Ban again
- [ ] Status changes to "Active" (green)
- [ ] Try to suspend admin user
- [ ] Button should be disabled

**Test Refresh:**
- [ ] Click "Refresh" button
- [ ] Users list reloads
- [ ] No errors

#### 4.2 Templates Tab

- [ ] Click "Templates" tab
- [ ] Template grid displays
- [ ] 120+ templates visible
- [ ] Search bar works
- [ ] Each card shows:
  - [ ] Icon
  - [ ] Name
  - [ ] Category
  - [ ] Description
  - [ ] Pro/Free button
  - [ ] Star button (Featured)
  - [ ] Eye button (Hide)

**Test Template Controls:**
- [ ] Find any template
- [ ] Click "Pro/Free" button
- [ ] Status toggles
- [ ] Click Star icon
- [ ] Star fills (featured)
- [ ] Click Eye icon
- [ ] Template opacity changes (hidden)
- [ ] Click Eye again
- [ ] Opacity returns to normal

#### 4.3 Reviews Tab

- [ ] Click "Reviews" tab
- [ ] If reviews exist:
  - [ ] Reviews list displays
  - [ ] Each review shows:
    - [ ] User name
    - [ ] Star rating (1-5)
    - [ ] Review text
    - [ ] Template ID
    - [ ] Date
    - [ ] Delete button
- [ ] If no reviews:
  - [ ] "No reviews yet" message

**Test Delete Review (if reviews exist):**
- [ ] Click Trash icon on a review
- [ ] Confirmation dialog appears
- [ ] Click "OK"
- [ ] Review disappears from list

#### 4.4 Analytics Tab

- [ ] Click "Analytics" tab
- [ ] Stats cards display:
  - [ ] Total Users (number)
  - [ ] Pro Users (number)
  - [ ] Total Downloads (number)
  - [ ] AI Generations (number)
  - [ ] Total Reviews (number)
  - [ ] Avg Rating (number)
- [ ] Conversion Metrics section visible
- [ ] Pro Conversion Rate displays (%)
- [ ] AI Usage Rate displays (per user)
- [ ] Click "Refresh"
- [ ] Numbers reload

**Verify Calculations:**
```
Pro Conversion Rate = (Pro Users / Total Users) × 100
AI Usage Rate = Total Generations / Total Users
```

---

### Phase 5: API Endpoint Tests (15 minutes)

#### 5.1 Admin API

**Test User Update:**

Open browser console (F12) and run:

```javascript
// Update user bonus credits
fetch('/api/admin/users', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USER_ID_HERE',
    updates: { bonus_credits: 100 }
  })
})
.then(r => r.json())
.then(console.log)

// Expected: { success: true }
```

**Test Template Update:**

```javascript
fetch('/api/admin/templates', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'habit-tracker',
    updates: { is_featured: true }
  })
})
.then(r => r.json())
.then(console.log)

// Expected: Success response
```

#### 5.2 Webhook Endpoint

**Test Webhook is Reachable:**

```bash
# In terminal
curl -X POST http://localhost:3000/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "payload": {}}'
```

**Expected:** Response (might be 400 due to invalid signature, but endpoint is reachable)

---

### Phase 6: Database Tests (10 minutes)

#### 6.1 Check Tables Exist

**Open Supabase Dashboard → SQL Editor:**

```sql
-- Check if new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subscription_history', 'credits_history', 'payment_transactions', 'admin_notifications');

-- Expected: 4 rows (or 0 if migration not run yet)
```

#### 6.2 Check Admin User

```sql
SELECT email, is_admin, bonus_credits, subscription_plan
FROM public.users
WHERE email = 'biplavsoccer007@gmail.com';

-- Expected: 1 row with is_admin = true
```

#### 6.3 Check Triggers

```sql
-- Test AI generation trigger
-- Create a test generation
INSERT INTO ai_generations (user_id, prompt, template_data)
VALUES ('USER_ID_HERE', 'Test prompt', '{}');

-- Check credits_history
SELECT * FROM credits_history
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: New entry with amount = -1, type = 'ai_generation'
```

---

### Phase 7: Edge Cases & Error Handling (20 minutes)

#### 7.1 Unauthenticated Access

- [ ] Sign out completely
- [ ] Try to access `/admin` → Redirected to `/`
- [ ] Try to access `/dashboard` → Redirected to `/`
- [ ] Try to access `/subscription` → Redirected to `/`
- [ ] Try to access `/profile` → Redirected to `/`

**Expected:** Protected routes redirect unauthenticated users

#### 7.2 Non-Admin Access

- [ ] Sign in as regular user (not admin)
- [ ] Try to access `/admin`
- [ ] Should redirect to `/`

**Expected:** Admin panel only for admin email

#### 7.3 Invalid Inputs

**Admin Panel:**
- [ ] Try to add negative credits → Should fail or default to 1
- [ ] Try to remove more credits than user has → Should go to 0, not negative
- [ ] Try empty search → Shows all users
- [ ] Try search with no results → Shows "No users found"

**Dashboard:**
- [ ] User with no activity → Shows empty states
- [ ] User with 0 credits → Shows "0" clearly
- [ ] Pro user → Shows "Unlimited" credits

#### 7.4 Network Errors

**Simulate offline:**
- [ ] Open DevTools → Network tab
- [ ] Set to "Offline"
- [ ] Try to load dashboard
- [ ] Should show loading state or error
- [ ] Set back to "Online"
- [ ] Refresh → Page loads

#### 7.5 Large Data Sets

**If you have many users:**
- [ ] Admin panel loads quickly (< 2 seconds)
- [ ] Pagination works (if implemented)
- [ ] Search is responsive

---

### Phase 8: UI/UX Tests (15 minutes)

#### 8.1 Responsive Design

**Desktop (1920px):**
- [ ] All pages look good
- [ ] No horizontal scroll
- [ ] Content centered

**Tablet (768px):**
- [ ] Change browser width to 768px
- [ ] Dashboard cards stack properly
- [ ] Navigation works
- [ ] No overflow

**Mobile (375px):**
- [ ] Change browser width to 375px
- [ ] All buttons accessible
- [ ] Text readable
- [ ] Modal fits screen

#### 8.2 Dark Mode

**If dark mode implemented:**
- [ ] Toggle dark mode
- [ ] All pages support dark mode
- [ ] Colors contrast well
- [ ] No white backgrounds bleeding through

#### 8.3 Loading States

- [ ] Dashboard shows spinner while loading
- [ ] Admin panel shows "Loading users..."
- [ ] Subscription page shows loading
- [ ] Button shows loading during API calls

#### 8.4 Success/Error Messages

**Should see feedback for:**
- [ ] Credit added successfully
- [ ] User upgraded to Pro
- [ ] Review deleted
- [ ] Network errors
- [ ] Invalid inputs

---

### Phase 9: Performance Tests (10 minutes)

#### 9.1 Page Load Times

**Open DevTools → Performance:**
- [ ] Record page load for `/dashboard`
- [ ] Should load in < 2 seconds
- [ ] Record page load for `/admin`
- [ ] Should load in < 3 seconds

#### 9.2 API Response Times

**Open DevTools → Network:**
- [ ] Watch API calls
- [ ] `/api/admin/users` should respond in < 500ms
- [ ] `/api/admin/templates` should respond in < 300ms
- [ ] AI generation may take 5-10 seconds (OpenAI)

#### 9.3 Database Queries

**In Supabase Dashboard → Logs:**
- [ ] Check query performance
- [ ] No queries taking > 1 second
- [ ] Indexes being used

---

### Phase 10: Integration Tests (15 minutes)

#### 10.1 Complete User Journey

**New User Flow:**
1. [ ] User signs up
2. [ ] Email verified
3. [ ] User browses templates
4. [ ] User favorites a template
5. [ ] User goes to dashboard → Sees 1 favorite
6. [ ] User creates AI template (uses 1 credit)
7. [ ] Dashboard shows 4 credits remaining
8. [ ] User goes to subscription page
9. [ ] Sees "Free" plan
10. [ ] Clicks "Upgrade to Pro"

**Admin Grants Credits:**
1. [ ] Admin logs in
2. [ ] Finds user in admin panel
3. [ ] Grants 10 bonus credits
4. [ ] User refreshes dashboard
5. [ ] Sees updated credit count (4 + 10 = 14)

#### 10.2 Payment Flow (Test Mode)

**Using Razorpay Test Mode:**
1. [ ] User clicks "Upgrade to Pro"
2. [ ] Redirected to Razorpay checkout
3. [ ] Uses test card: `4111 1111 1111 1111`
4. [ ] Payment succeeds
5. [ ] Webhook fires
6. [ ] Check server logs for webhook event
7. [ ] User subscription updated to "Pro"
8. [ ] User sees "Unlimited" credits
9. [ ] Payment recorded in payment_transactions
10. [ ] Subscription history logged

---

## 🐛 Bug Reporting Template

If you find bugs during testing, report them like this:

```markdown
## Bug Report

**Title:** [Short description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Behavior:**
Should do X

**Actual Behavior:**
Does Y instead

**Error Message:**
[Paste console error if any]

**Screenshot:**
[Attach if helpful]

**Environment:**
- Browser: Chrome 120
- OS: macOS
- User: admin / regular

**Possible Fix:**
[Optional - your thoughts on how to fix]
```

---

## ✅ Test Results Template

```markdown
## Test Run Results

**Date:** 2026-01-11
**Tester:** Your Name
**Duration:** 2 hours

### Phase 1: Basic Application ✅ PASS
- All tests passed
- No errors found

### Phase 2: Authentication ✅ PASS
- Sign up works
- Sign in works
- Admin access restricted

### Phase 3: User Dashboard ⚠️ PARTIAL
- Dashboard loads ✅
- Stats display correctly ✅
- Quick actions work ❌ Bug: Subscription link 404

### Phase 4: Admin Panel ✅ PASS
- Credit management works perfectly
- Pro toggle works
- All tabs functional

... etc

### Bugs Found: 1
1. Subscription link returns 404 [Medium]

### Overall Status: 95% Pass Rate
Ready for deployment with minor fixes
```

---

## 🎯 Critical Test Scenarios

**MUST PASS before deployment:**

1. ✅ Admin can login at `/admin`
2. ✅ Credit modal opens and functions
3. ✅ Can add/subtract credits
4. ✅ Pro toggle works
5. ✅ Dashboard displays correctly
6. ✅ Subscription page loads
7. ✅ Webhook endpoint responds
8. ✅ Database migration ran
9. ✅ No console errors on main pages
10. ✅ Navigation works

---

## 🚀 Automated Test Script

**Copy this to browser console:**

```javascript
// Automated UI Test Script
(async function testApp() {
  console.log('🧪 Starting NotionStruct Tests...');

  const tests = {
    passed: 0,
    failed: 0,
    results: []
  };

  function test(name, fn) {
    try {
      const result = fn();
      if (result) {
        tests.passed++;
        tests.results.push(`✅ ${name}`);
        console.log(`✅ ${name}`);
      } else {
        tests.failed++;
        tests.results.push(`❌ ${name}`);
        console.error(`❌ ${name}`);
      }
    } catch (error) {
      tests.failed++;
      tests.results.push(`❌ ${name}: ${error.message}`);
      console.error(`❌ ${name}:`, error);
    }
  }

  // Test 1: Check homepage elements
  test('Homepage loads', () => {
    return document.querySelector('h1') !== null;
  });

  // Test 2: Check navigation
  test('Navigation exists', () => {
    return document.querySelector('nav') !== null ||
           document.querySelector('header') !== null;
  });

  // Test 3: Check for React errors
  test('No React errors in console', () => {
    return !console.error.called;
  });

  // Test 4: Local storage accessible
  test('Local storage works', () => {
    localStorage.setItem('test', '1');
    const result = localStorage.getItem('test') === '1';
    localStorage.removeItem('test');
    return result;
  });

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`Passed: ${tests.passed}`);
  console.log(`Failed: ${tests.failed}`);
  console.log(`Total: ${tests.passed + tests.failed}`);
  console.log('\nResults:');
  tests.results.forEach(r => console.log(r));

  return tests;
})();
```

---

## 📞 Need Help?

**If tests fail:**

1. Check browser console for errors
2. Check network tab for failed requests
3. Check Supabase logs
4. Review error messages
5. Check environment variables
6. Verify database migration ran

**Common Issues:**

- **404 errors:** Check routes exist in app folder
- **401 errors:** Check authentication
- **500 errors:** Check server logs
- **Blank pages:** Check console errors
- **Slow loading:** Check network tab

---

**Ready to test? Start the dev server and begin testing! 🚀**

```bash
npm run dev
# Open http://localhost:3000
# Follow Phase 1-10 above
```
