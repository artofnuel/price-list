-- SQL script to update PriceForge Database for Monetization

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('free', 'premium')) DEFAULT 'free',
    provider TEXT CHECK (provider IN ('stripe', 'paystack')),
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Add views_count to price_lists
ALTER TABLE public.price_lists 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 3. Add custom branding fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT;

-- 4. Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for subscriptions
-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" 
ON public.subscriptions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- System/Service Role can manage all subscriptions (for webhooks)
-- Note: Service role bypasses RLS, so no extra policy needed for it.

-- 6. Update view permissions for profiles/price_lists if needed
-- (Assume existing policies allow public read for shared price lists)

-- 7. Function to increment views_count
CREATE OR REPLACE FUNCTION increment_price_list_view(list_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.price_lists
  SET views_count = views_count + 1
  WHERE id = list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
