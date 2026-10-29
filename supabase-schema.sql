-- =========================================================================
-- SUPABASE POSTGRESQL SCHEMA: registrations
-- =========================================================================

-- 1. Create the 'registrations' table with complete columns
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    transaction_id TEXT,
    bank TEXT,
    plan_name TEXT DEFAULT 'Standard Plan (200 Birr)',
    amount NUMERIC DEFAULT 200,
    status TEXT DEFAULT 'pending',
    verification_method TEXT DEFAULT 'verify_et',
    payment_image_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    reviewed_at TIMESTAMPTZ
);

-- 2. Non-destructive migration if table already exists without certain columns
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS bank TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'verify_et';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'Standard Plan (200 Birr)';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 200;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_image_url TEXT DEFAULT '';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Drop NOT NULL constraint on payment_image_url if previously set
ALTER TABLE public.registrations ALTER COLUMN payment_image_url DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN payment_image_url SET DEFAULT '';

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow public insert for registrations
DROP POLICY IF EXISTS "Allow public insert for registrations" ON public.registrations;
CREATE POLICY "Allow public insert for registrations"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (true);

-- 5. Policy: Allow service role full access (reads, updates, deletes)
DROP POLICY IF EXISTS "Allow service role full access" ON public.registrations;
CREATE POLICY "Allow service role full access"
ON public.registrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Policy: Allow anon lookup
DROP POLICY IF EXISTS "Allow anon lookup by exact phone number" ON public.registrations;
CREATE POLICY "Allow anon lookup by exact phone number"
ON public.registrations
FOR SELECT
TO anon
USING (true);

-- 7. Policy: Allow anon update for quick approval status if using anon key
DROP POLICY IF EXISTS "Allow public update for status" ON public.registrations;
CREATE POLICY "Allow public update for status"
ON public.registrations
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations (phone_number);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations (status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations (created_at DESC);
