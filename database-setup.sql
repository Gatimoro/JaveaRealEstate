-- Supabase Database Setup for JaveaRealEstate
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/cqoqbbdypebzawgmtazv/sql

-- ============================================================================
-- SAVED PROPERTIES TABLE
-- ============================================================================
-- Stores which properties users have saved/favorited

CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a user can't save the same property twice
  UNIQUE(user_id, property_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON saved_properties(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on the table
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved properties
CREATE POLICY "Users can view their own saved properties"
  ON saved_properties
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved properties
CREATE POLICY "Users can insert their own saved properties"
  ON saved_properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved properties
CREATE POLICY "Users can delete their own saved properties"
  ON saved_properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPFUL QUERIES (for testing)
-- ============================================================================

-- View all saved properties for the current user
-- SELECT * FROM saved_properties WHERE user_id = auth.uid();

-- Count saved properties per user
-- SELECT user_id, COUNT(*) as saved_count
-- FROM saved_properties
-- GROUP BY user_id
-- ORDER BY saved_count DESC;

-- Delete all saved properties for a specific user (if needed for testing)
-- DELETE FROM saved_properties WHERE user_id = auth.uid();
