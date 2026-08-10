CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'push_and_inbox',
    target_audience TEXT DEFAULT 'all',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.notifications
    FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Allow public delete access" ON public.notifications
    FOR DELETE USING (true);
