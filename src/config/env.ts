import { z } from "zod"

// Define the schema for your environment variables
// This ensures type safety and validation at runtime
const envSchema = z.object({
    // App Config
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().min(1),

    // Database (Supabase)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // Server-side only

    // Notion API (OAuth - for user integrations)
    NOTION_CLIENT_ID: z.string().min(1).optional(),
    NOTION_CLIENT_SECRET: z.string().min(1).optional(),
    NOTION_REDIRECT_URI: z.string().url().optional(),

    // Notion Admin API (Internal Integration - for AI template gallery)
    NOTION_ADMIN_TOKEN: z.string().min(1).optional(),
    NOTION_GALLERY_PAGE_ID: z.string().min(1).optional(),

    // Payments (Razorpay)
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
    RAZORPAY_KEY_SECRET: z.string().min(1).optional(),

    // AI (OpenAI)
    OPENAI_API_KEY: z.string().min(1).optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1).optional(),

    // Monitoring (Sentry)
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

    // Bartlabs Ecosystem
    BARTLABS_APP_SECRET: z.string().min(1).optional(),
    BARTLABS_PAYMENT_URL: z.string().url().default("https://payments.bartlabs.in"),

    // Admin
    NEXT_PUBLIC_ADMIN_PASSWORD: z.string().min(1).optional(),
})

// Parse and export the environment variables
// This will throw an error if required variables are missing
export const env = envSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NOTION_CLIENT_ID: process.env.NOTION_CLIENT_ID,
    NOTION_CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET,
    NOTION_REDIRECT_URI: process.env.NOTION_REDIRECT_URI,
    NOTION_ADMIN_TOKEN: process.env.NOTION_ADMIN_TOKEN,
    NOTION_GALLERY_PAGE_ID: process.env.NOTION_GALLERY_PAGE_ID,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    BARTLABS_APP_SECRET: process.env.BARTLABS_APP_SECRET,
    BARTLABS_PAYMENT_URL: process.env.BARTLABS_PAYMENT_URL,
    NEXT_PUBLIC_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
})
