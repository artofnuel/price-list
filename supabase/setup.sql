-- Supabase Schema for PriceForge
-- Create this in your Supabase SQL Editor

-- 1. Create professional_profiles table
CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  skill_level TEXT NOT NULL, -- Beginner, Intermediate, Advanced, Expert
  target_market TEXT NOT NULL, -- Budget, Standard, Premium
  region TEXT,
  services TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create price_lists table
CREATE TABLE price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  generated_data JSONB NOT NULL, -- The AI output
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for professional_profiles
CREATE POLICY "Users can view their own profiles" 
ON professional_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles" 
ON professional_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" 
ON professional_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" 
ON professional_profiles FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view profiles linked to public lists" 
ON professional_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM price_lists 
    WHERE price_lists.profile_id = professional_profiles.id 
    AND price_lists.is_public = true
  )
);

-- 5. Create Policies for price_lists
CREATE POLICY "Users can view their own lists" 
ON price_lists FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own lists" 
ON price_lists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" 
ON price_lists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" 
ON price_lists FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Indices for performance
CREATE INDEX idx_profiles_user_id ON professional_profiles(user_id);
CREATE INDEX idx_lists_user_id ON price_lists(user_id);
CREATE INDEX idx_lists_profile_id ON price_lists(profile_id);
