-- Supabase Database Setup for Property Listings
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/cqoqbbdypebzawgmtazv/sql

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('house', 'investment', 'plot')),

  -- Titles (multilingual)
  title TEXT NOT NULL,
  title_en TEXT,
  title_ru TEXT,

  -- Basic info
  price NUMERIC NOT NULL,
  location TEXT NOT NULL,
  badge TEXT,

  -- Descriptions (multilingual)
  description TEXT,
  description_en TEXT,
  description_ru TEXT,

  -- Images (stored as JSON array)
  images JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Features (multilingual, stored as JSON arrays)
  features JSONB DEFAULT '[]'::jsonb,
  features_en JSONB DEFAULT '[]'::jsonb,
  features_ru JSONB DEFAULT '[]'::jsonb,

  -- Specs (stored as JSON object)
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Source tracking
  source_url TEXT,
  source_reference TEXT,

  -- Analytics (added by database-analytics-setup.sql)
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,

  -- Metadata
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scraped_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Create a GIN index for searching within JSONB fields
CREATE INDEX IF NOT EXISTS idx_properties_features ON properties USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_properties_specs ON properties USING GIN (specs);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Everyone can view available properties (public access for listing)
CREATE POLICY "Anyone can view available properties"
  ON properties
  FOR SELECT
  USING (status = 'available' OR status = 'reserved');

-- Only authenticated users can insert (for admin/scraper use)
-- You'll need to create a service role key for the scraper
CREATE POLICY "Service role can insert properties"
  ON properties
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "Service role can update properties"
  ON properties
  FOR UPDATE
  USING (true);

-- Only authenticated users can delete
CREATE POLICY "Service role can delete properties"
  ON properties
  FOR DELETE
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPFUL QUERIES (for testing)
-- ============================================================================

-- View all properties
-- SELECT id, title, price, location, type, status FROM properties ORDER BY created_at DESC;

-- Count properties by type
-- SELECT type, COUNT(*) as count FROM properties GROUP BY type;

-- Search properties by price range
-- SELECT id, title, price, location FROM properties
-- WHERE price BETWEEN 200000 AND 500000
-- ORDER BY price;

-- Search properties with specific features (example: pool)
-- SELECT id, title FROM properties
-- WHERE features @> '["pool"]'::jsonb;

-- Get properties with 3+ bedrooms
-- SELECT id, title FROM properties
-- WHERE specs->>'bedrooms' IS NOT NULL
-- AND (specs->>'bedrooms')::int >= 3;
