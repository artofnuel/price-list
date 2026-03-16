-- Create the subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'premium')),
  provider text CHECK (provider IN ('stripe', 'paystack')),
  provider_customer_id text,
  provider_subscription_id text,
  status text CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing')),
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Add tracking for analytics to price_lists
ALTER TABLE public.price_lists
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- Add custom branding to professional_profiles
ALTER TABLE public.professional_profiles
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS brand_color text;

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create RPC to increment view count
CREATE OR REPLACE FUNCTION increment_price_list_view(list_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.price_lists
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
