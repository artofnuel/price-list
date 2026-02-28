-- Comprehensive fix for Public Access
-- Run this in your Supabase SQL Editor

-- 1. Ensure columns exist and have defaults
ALTER TABLE price_lists 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. Update any NULL values to false
UPDATE price_lists SET is_public = false WHERE is_public IS NULL;

-- 3. Reset policies for price_lists
DROP POLICY IF EXISTS "Users can view their own lists" ON price_lists;
DROP POLICY IF EXISTS "Public can view shared lists" ON price_lists;
DROP POLICY IF EXISTS "Allow public lists viewing for everyone" ON price_lists;

-- Allow users to see their own, and everyone to see public ones
CREATE POLICY "Enable select for users and public" 
ON price_lists FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

-- 4. Reset policies for professional_profiles
DROP POLICY IF EXISTS "Users can view their own profiles" ON professional_profiles;
DROP POLICY IF EXISTS "Public can view profiles linked to public lists" ON professional_profiles;

CREATE POLICY "Enable select for users and linked public" 
ON professional_profiles FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  id IN (SELECT profile_id FROM price_lists WHERE is_public = true)
);

-- 5. Ensure RLS is actually ON
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
