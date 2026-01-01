# 🚀 AI Template Generation Setup Guide

This guide will help you set up the **Admin Notion Integration** that powers the AI template generation feature. With this setup, users can generate custom templates using AI, and you'll host them in your Notion workspace for easy duplication.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  USER FLOW                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User types: "Create a habit tracker with weekly goals"       │
│                          ↓                                       │
│  2. AI generates a blueprint (template design)                   │
│                          ↓                                       │
│  3. User previews and confirms                                   │
│                          ↓                                       │
│  4. Template builds in YOUR Notion workspace (admin)             │
│                          ↓                                       │
│  5. User gets a "Duplicate to Notion" link                       │
│                          ↓                                       │
│  6. User clicks → template copies to THEIR workspace ✨          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Create a Notion Internal Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: `NotionStruct AI Templates`
   - **Associated workspace**: Your workspace
   - **Type**: **Internal** (not Public OAuth)
4. Under **Capabilities**, ensure:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
5. Click **Submit**
6. Copy the **Internal Integration Token** (starts with `secret_`)

## Step 2: Create a Template Gallery Page

1. In your Notion workspace, create a new page:
   - **Title**: `AI Template Gallery` (or any name you prefer)
   - This page will contain all AI-generated templates
   
2. **Share the page with your integration**:
   - Click the `...` menu on the page
   - Click **"Add connections"**
   - Search for and select `NotionStruct AI Templates`
   - Click **"Confirm"**

3. Get the **Page ID**:
   - Open the page in Notion
   - Look at the URL: `https://www.notion.so/Your-Page-Name-abc123def456...`
   - The page ID is the part after the page name (the 32-character hex string)
   - Example: `abc123def456789012345678901234ab`

## Step 3: Configure Environment Variables

Add these variables to your `.env.local`:

```bash
# Notion Admin API (Required for AI template generation)
NOTION_ADMIN_TOKEN="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NOTION_GALLERY_PAGE_ID="abc123def456789012345678901234ab"
```

For production (Vercel), add these same variables in:
- **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

## Step 4: Test the Integration

1. Start your dev server: `npm run dev`
2. Go to the homepage
3. Type a prompt like "Create a habit tracker"
4. Click "Design New"
5. Preview the blueprint and click "Build"
6. You should see a success screen with a "Duplicate to Notion" button

## Troubleshooting

### "AI template building is not configured"
- Check that `NOTION_ADMIN_TOKEN` and `NOTION_GALLERY_PAGE_ID` are set
- Make sure the token doesn't have extra quotes or spaces

### "Could not find page"
- Verify the page ID is correct (32 hex characters)
- Ensure the page is shared with your integration

### "Unauthorized" or "Invalid token"
- Make sure you're using an **Internal Integration** token
- The token should start with `secret_`
- Try regenerating the token in Notion integrations settings

### Rate Limiting
- Notion allows ~3 requests/second
- AI templates typically use 10-30 requests
- Building should take 10-30 seconds per template

## Managing Your Template Gallery

All AI-generated templates will appear as subpages under your Gallery page. You can:

- **Review templates** before users duplicate them
- **Delete old/unused templates** to keep it organized
- **Feature templates** by adding a "Featured" property
- **Track usage** by checking how many pages have been created

## Security Notes

- The admin token can create/modify content in shared pages
- Only share the Gallery page with the integration
- Don't expose the token in client-side code
- Consider periodic token rotation

## Next Steps

Once configured:
1. Deploy to Vercel with the new environment variables
2. Test the full AI generation flow in production
3. Monitor your Template Gallery for new entries
4. Enjoy seeing users create custom templates! 🎉
