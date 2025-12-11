# NotionStruct - Complete Setup Guide

## 🎯 Current Status

✅ **Completed:**
- GitHub repository created: https://github.com/biplavnayak/notion-ai-builder
- Code pushed to GitHub with latest security updates
- Vercel project created and linked to GitHub
- Auto-deployment configured
- UI improvements and error handling added

⏳ **Pending:**
- Add environment variables to Vercel
- Configure Google OAuth in Supabase
- Set up custom domain (notionstruct.bartlabs.in)

---

## 📋 Step 1: Add Environment Variables to Vercel

Go to: https://vercel.com/bart-labs-projects/notion-ai-builder/settings/environment-variables

Add these **8 variables** (select Production, Preview, Development for each):

```
NEXT_PUBLIC_SUPABASE_URL=https://gxncoofcwpvzbktjgvhw.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bmNvb2Zjd3B2emJrdGpndmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTA2NjEsImV4cCI6MjA4MDI2NjY2MX0.NbRag7Gib7sz5-ICFLhYE2Ky9r3jRHCZ9DJaaIYQRU8
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bmNvb2Zjd3B2emJrdGpndmh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY5MDY2MSwiZXhwIjoyMDgwMjY2NjYxfQ.2O0xdJJ9rjNzAJmyblzlqdbalWv_UFAuz8dfdE7JBnA
```

```
OPENAI_API_KEY=your-openai-api-key-here
```

```
NEXT_PUBLIC_APP_NAME=NotionStruct
```

```
NEXT_PUBLIC_APP_URL=https://notionstruct.bartlabs.in
```

```
BARTLABS_PAYMENT_URL=https://payments.bartlabs.in
```

```
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

---

## 🔐 Step 2: Configure Google OAuth in Supabase

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add **Authorized redirect URIs**:
   ```
   https://gxncoofcwpvzbktjgvhw.supabase.co/auth/v1/callback
   ```
8. Click **Create** and save your:
   - Client ID
   - Client Secret

### 2.2 Enable Google Provider in Supabase

1. Go to: https://supabase.com/dashboard/project/gxncoofcwpvzbktjgvhw/auth/providers
2. Find **Google** provider
3. Enable it
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

---

## 🌐 Step 3: Configure Custom Domain

### 3.1 Add Domain in Vercel

1. Go to: https://vercel.com/bart-labs-projects/notion-ai-builder/settings/domains
2. Click **Add Domain**
3. Enter: `notionstruct.bartlabs.in`
4. Vercel will provide a CNAME record

### 3.2 Update DNS

Add this CNAME record in your DNS provider (where bartlabs.in is hosted):

```
Type: CNAME
Name: notionstruct
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

---

## ✅ Step 4: Verify Deployment

Once you complete steps 1-3:

1. Vercel will automatically redeploy
2. Wait 2-3 minutes for deployment to complete
3. Visit: **https://notionstruct.bartlabs.in**
4. Test:
   - ✅ Homepage loads
   - ✅ Email/Password login works
   - ✅ Google login works
   - ✅ Template gallery displays
   - ✅ AI template generation works

---

## 🐛 Troubleshooting

### Google Login Not Working
- Verify OAuth credentials in Google Cloud Console
- Check redirect URI matches exactly: `https://gxncoofcwpvzbktjgvhw.supabase.co/auth/v1/callback`
- Ensure Google provider is enabled in Supabase

### Site Not Loading
- Verify all 8 environment variables are added in Vercel
- Check Vercel deployment logs for errors
- Ensure DNS propagation is complete (can take up to 24 hours)

### AI Generation Not Working
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI API key has credits
- Review Vercel function logs

---

## 📞 Support

For issues, check:
- Vercel deployment logs: https://vercel.com/bart-labs-projects/notion-ai-builder
- Supabase logs: https://supabase.com/dashboard/project/gxncoofcwpvzbktjgvhw/logs/explorer
- GitHub repository: https://github.com/biplavnayak/notion-ai-builder

---

## 🚀 Next Steps After Deployment

1. **Test all features** thoroughly
2. **Add more templates** to the gallery
3. **Configure Notion OAuth** (optional - for direct Notion integration)
4. **Set up analytics** (Google Analytics, Vercel Analytics)
5. **Add SEO metadata** for better discoverability
6. **Create marketing materials**

---

**Last Updated:** December 11, 2025
**Version:** 1.0.0
