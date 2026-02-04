-- Migration: Add listing_type and sub_category fields for new category structure
-- Date: 2026-01-28
-- Purpose: Restructure properties to support New Buildings, Rent, and Sale categories

-- 1. Add new columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_type TEXT,
ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- 2. Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_sub_category ON properties(sub_category);
CREATE INDEX IF NOT EXISTS idx_properties_category_combo ON properties(listing_type, sub_category);

-- 3. Migrate existing data
-- Current 'type' field has: 'house', 'investment', 'plot'
-- Mapping:
--   'house' -> listing_type='sale', sub_category='house'
--   'investment' -> listing_type='sale', sub_category='apartment' (since most investments are apartments)
--   'plot' -> listing_type='sale', sub_category='plot'

UPDATE properties
SET
  listing_type = 'sale',
  sub_category = CASE
    WHEN type = 'house' THEN 'house'
    WHEN type = 'investment' THEN 'apartment'
    WHEN type = 'plot' THEN 'plot'
    ELSE 'apartment' -- default
  END
WHERE listing_type IS NULL;

-- 4. Add check constraints for valid values
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS check_listing_type;

ALTER TABLE properties
ADD CONSTRAINT check_listing_type
CHECK (listing_type IN ('sale', 'rent', 'new-building'));

ALTER TABLE properties
DROP CONSTRAINT IF EXISTS check_sub_category;

ALTER TABLE properties
ADD CONSTRAINT check_sub_category
CHECK (sub_category IN ('apartment', 'house', 'commerce', 'plot'));

-- 5. Update the properties table comment
COMMENT ON COLUMN properties.listing_type IS 'Main category: sale, rent, or new-building';
COMMENT ON COLUMN properties.sub_category IS 'Property type: apartment, house, commerce, or plot';
COMMENT ON COLUMN properties.type IS 'DEPRECATED: Use listing_type and sub_category instead';

-- 6. Create helper views for each category
CREATE OR REPLACE VIEW properties_new_buildings AS
SELECT * FROM properties
WHERE listing_type = 'new-building' AND status = 'available'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW properties_for_rent AS
SELECT * FROM properties
WHERE listing_type = 'rent' AND status = 'available'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW properties_for_sale AS
SELECT * FROM properties
WHERE listing_type = 'sale' AND status = 'available'
ORDER BY created_at DESC;

-- 7. Create function to get properties by category
CREATE OR REPLACE FUNCTION get_properties_by_category(
  p_listing_type TEXT,
  p_sub_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
) RETURNS SETOF properties AS $$
BEGIN
  IF p_sub_category IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM properties
    WHERE listing_type = p_listing_type
      AND sub_category = p_sub_category
      AND status = 'available'
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
  ELSE
    RETURN QUERY
    SELECT * FROM properties
    WHERE listing_type = p_listing_type
      AND status = 'available'
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get featured properties for homepage
CREATE OR REPLACE FUNCTION get_featured_properties_by_category(
  p_listing_type TEXT,
  p_limit INT DEFAULT 6
) RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM properties
  WHERE listing_type = p_listing_type
    AND status = 'available'
  ORDER BY
    views_count DESC,
    created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
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
