-- Bartlabs Standard Schema for Notion Template Builder
-- Run this in Supabase SQL Editor to setup your project instantly.

-- 1. Enable RLS (Security First)
alter default privileges in schema public grant all on tables to postgres, service_role;

-- 2. Users Table (Extends Supabase Auth)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  
  -- Subscription Fields (The "Grandfathering" System)
  subscription_plan text default 'free', -- 'free', 'pro'
  subscription_status text default 'active', -- 'active', 'past_due', 'canceled', 'trialing'
  grandfathered_price decimal(10,2), -- Locked price for this user
  price_locked boolean default false, -- If true, never increase price
  subscription_id text, -- Razorpay Subscription ID
  
  -- Notion Integration
  notion_access_token text,
  notion_workspace_id text,
  notion_workspace_name text,
  notion_bot_id text,
  
  -- Usage Tracking
  ai_generations_lifetime integer default 0, -- Total AI generations used (free users get 5 lifetime)
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Enable RLS on Users
alter table public.users enable row level security;

-- Policy: Users can only see/edit their own data
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- 4. Trigger: Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Trigger: Auto-update updated_at
create extension if not exists moddatetime schema extensions;

drop trigger if exists handle_updated_at on public.users;
create trigger handle_updated_at before update on public.users
  for each row execute procedure moddatetime (updated_at);

-- 6. Monthly reset function removed (AI generations are now lifetime limited)


-- 7. Template Downloads Table (Track what users download)
create table if not exists public.template_downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  template_id text not null,
  template_name text not null,
  downloaded_at timestamptz default now()
);

alter table public.template_downloads enable row level security;

create policy "Users can view own downloads" on public.template_downloads
  for select using (auth.uid() = user_id);

create policy "Users can insert own downloads" on public.template_downloads
  for insert with check (auth.uid() = user_id);

-- 8. AI Generations Table (Track AI usage)
create table if not exists public.ai_generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  prompt text not null,
  template_data jsonb,
  created_at timestamptz default now()
);

alter table public.ai_generations enable row level security;

create policy "Users can view own generations" on public.ai_generations
  for select using (auth.uid() = user_id);

create policy "Users can insert own generations" on public.ai_generations
  for insert with check (auth.uid() = user_id);
