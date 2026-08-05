-- Run this SQL in your Supabase SQL Editor
-- Creates a table to track all user logins from web (email/Google) and app (code)

CREATE TABLE IF NOT EXISTS public.user_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Source: 'web_google' (website Google sign-in) or 'app_code' (app code entry)
  source TEXT NOT NULL DEFAULT 'web_google',
  
  -- For web Google logins: the email address
  email TEXT,
  
  -- For web Google logins: display name
  display_name TEXT,
  
  -- For web: Supabase Auth user ID
  user_id TEXT,
  
  -- For app code logins: anonymous device identifier
  device_id TEXT,
  
  -- The code used (for app logins)
  code_used TEXT
);

-- Enable Row Level Security
ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (so web + app can record logins)
CREATE POLICY "Allow insert for all" ON public.user_logins
  FOR INSERT WITH CHECK (true);

-- Allow admin to read all
CREATE POLICY "Allow read for all" ON public.user_logins
  FOR SELECT USING (true);
