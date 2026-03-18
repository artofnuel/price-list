-- SQL to fix Subscriptions Table for PriceForge
-- Run this in your Supabase SQL Editor

-- 1. Add updated_at column if it doesn't exist
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Add UPDATE policy so users can cancel their own subscription
CREATE POLICY "Users can update own subscription" 
ON public.subscriptions 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. (Optional but recommended) Add INSERT policy if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' AND policyname = 'Users can insert own subscription'
    ) THEN
        CREATE POLICY "Users can insert own subscription" 
        ON public.subscriptions 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
