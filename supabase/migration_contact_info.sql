-- Migration: Add contact info to professional_profiles
-- Run this in your Supabase SQL Editor

ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS public_email TEXT,
  ADD COLUMN IF NOT EXISTS public_phone TEXT;
