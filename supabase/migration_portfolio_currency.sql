-- Migration: Add portfolio_url, display_name, and show_name_publicly to professional_profiles
-- Run this in your Supabase SQL Editor

ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS show_name_publicly BOOLEAN DEFAULT false;
