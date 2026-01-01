-- Analytics and Tracking Setup for Properties
-- Run this AFTER database-properties-setup.sql
-- Supabase SQL Editor: https://app.supabase.com/project/cqoqbbdypebzawgmtazv/sql

-- ============================================================================
-- ADD ANALYTICS COLUMNS TO PROPERTIES TABLE
-- ============================================================================

-- Add analytics tracking columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_properties_views ON properties(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_properties_saves ON properties(saves_count DESC);

-- ============================================================================
-- PROPERTY ANALYTICS EVENTS TABLE
-- ============================================================================

-- Track individual analytics events (optional, for detailed tracking)
CREATE TABLE IF NOT EXISTS property_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'save', 'unsave')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Store additional metadata as JSON
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_property_id ON property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON property_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON property_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON property_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE property_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (even anonymous users)
CREATE POLICY "Anyone can insert analytics events"
  ON property_analytics
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view analytics (admin only in production)
CREATE POLICY "Authenticated users can view analytics"
  ON property_analytics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- FUNCTIONS TO INCREMENT COUNTERS
-- ============================================================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_property_views(property_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET views_count = views_count + 1
  WHERE id = property_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_property_clicks(property_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET clicks_count = clicks_count + 1
  WHERE id = property_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment saves count
CREATE OR REPLACE FUNCTION increment_property_saves(property_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET saves_count = saves_count + 1
  WHERE id = property_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement saves count
CREATE OR REPLACE FUNCTION decrement_property_saves(property_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET saves_count = GREATEST(0, saves_count - 1)
  WHERE id = property_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS FOR POPULAR PROPERTIES
-- ============================================================================

-- View for top 10 most viewed properties (HOT)
CREATE OR REPLACE VIEW hot_properties AS
SELECT id, title, views_count
FROM properties
WHERE status = 'available'
ORDER BY views_count DESC
LIMIT 10;

-- View for top 10 most saved properties (MOST LIKED)
CREATE OR REPLACE VIEW most_liked_properties AS
SELECT id, title, saves_count
FROM properties
WHERE status = 'available'
ORDER BY saves_count DESC
LIMIT 10;

-- View for new properties (less than 2 weeks old)
CREATE OR REPLACE VIEW new_properties AS
SELECT id, title, created_at
FROM properties
WHERE status = 'available'
AND created_at > NOW() - INTERVAL '14 days'
ORDER BY created_at DESC;

-- ============================================================================
-- TRIGGER TO UPDATE SAVES COUNT AUTOMATICALLY
-- ============================================================================

-- Function to update saves count when saved_properties changes
CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment saves count
    PERFORM increment_property_saves(NEW.property_id);
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement saves count
    PERFORM decrement_property_saves(OLD.property_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on saved_properties table
CREATE TRIGGER update_property_saves_count
AFTER INSERT OR DELETE ON saved_properties
FOR EACH ROW
EXECUTE FUNCTION update_saves_count();

-- ============================================================================
-- HELPFUL QUERIES
-- ============================================================================

-- Get property badges (hot, new, most-liked)
-- SELECT
--   p.id,
--   p.title,
--   CASE
--     WHEN p.id IN (SELECT id FROM hot_properties) THEN 'hot'
--     WHEN p.id IN (SELECT id FROM new_properties) THEN 'new'
--     WHEN p.id IN (SELECT id FROM most_liked_properties) THEN 'most-liked'
--     ELSE NULL
--   END as badge
-- FROM properties p
-- WHERE p.status = 'available';

-- Get analytics summary for a property
-- SELECT
--   id,
--   title,
--   views_count,
--   clicks_count,
--   saves_count
-- FROM properties
-- WHERE id = 'property-id-here';

-- Get top performing properties
-- SELECT
--   id,
--   title,
--   views_count,
--   clicks_count,
--   saves_count,
--   (views_count + clicks_count * 2 + saves_count * 3) as engagement_score
-- FROM properties
-- ORDER BY engagement_score DESC
-- LIMIT 20;
