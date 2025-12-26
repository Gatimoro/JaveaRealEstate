-- Jávea Real Estate - Initial Database Schema
-- This migration creates all core tables for the real estate aggregation platform

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Properties table - Core listing data
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- External tracking (prevent duplicates from scraping)
  external_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,  -- 'idealista', 'fotocasa', 'kyero', etc.
  source_url TEXT NOT NULL,

  -- Basic info
  type TEXT NOT NULL CHECK (type IN ('house', 'investment', 'plot')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),

  -- Pricing
  price INTEGER NOT NULL CHECK (price > 0),
  price_per_sqm INTEGER,  -- Calculated field
  currency TEXT DEFAULT 'EUR',

  -- Location
  location TEXT NOT NULL,  -- Human readable: "Jávea, Portichol"
  municipality TEXT,       -- "Jávea"
  area TEXT,               -- "Portichol", "Arenal", etc.
  coordinates GEOGRAPHY(POINT, 4326),  -- PostGIS point for geospatial queries

  -- Multilingual content
  title_es TEXT,
  title_en TEXT,
  title_ru TEXT,
  description_es TEXT,
  description_en TEXT,
  description_ru TEXT,

  -- Media
  images TEXT[] DEFAULT '{}',  -- Array of image URLs

  -- Common specifications (denormalized for query performance)
  bedrooms INTEGER CHECK (bedrooms >= 0),
  bathrooms INTEGER CHECK (bathrooms >= 0),
  size_built INTEGER CHECK (size_built > 0),      -- m² built area
  size_plot INTEGER CHECK (size_plot >= 0),        -- m² plot/land area
  year_built INTEGER CHECK (year_built >= 1800 AND year_built <= 2100),
  energy_rating TEXT CHECK (energy_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),

  -- Investment-specific fields
  roi_percentage DECIMAL(5,2) CHECK (roi_percentage >= 0 AND roi_percentage <= 100),
  rental_yield DECIMAL(5,2) CHECK (rental_yield >= 0 AND rental_yield <= 100),

  -- Plot-specific fields
  zone TEXT,  -- 'residential', 'commercial', 'agricultural', 'rustic'
  buildable BOOLEAN,
  max_build_sqm INTEGER CHECK (max_build_sqm >= 0),

  -- Tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_municipality ON properties(municipality);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_source ON properties(source);
CREATE INDEX idx_properties_external_id ON properties(external_id);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_updated_at ON properties(updated_at DESC);

-- PostGIS spatial index for geospatial queries
CREATE INDEX idx_properties_coordinates ON properties USING GIST(coordinates);

-- Composite indexes for common filter combinations
CREATE INDEX idx_properties_type_status_price ON properties(type, status, price);
CREATE INDEX idx_properties_area_type_price ON properties(area, type, price) WHERE status = 'active';

-- ============================================================================
-- FEATURES SYSTEM (Normalized)
-- ============================================================================

-- Features table - Reusable property features with multilingual names
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,  -- 'pool', 'garage', 'sea_view', etc.

  -- Multilingual names
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,

  -- Categorization
  category TEXT,  -- 'amenities', 'exterior', 'interior', 'security'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many junction table
CREATE TABLE property_features (
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, feature_id)
);

CREATE INDEX idx_property_features_property ON property_features(property_id);
CREATE INDEX idx_property_features_feature ON property_features(feature_id);

-- ============================================================================
-- PRICE HISTORY
-- ============================================================================

-- Price history table - Track price changes over time
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price > 0),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_property ON price_history(property_id);
CREATE INDEX idx_price_history_date ON price_history(recorded_at DESC);
CREATE INDEX idx_price_history_property_date ON price_history(property_id, recorded_at DESC);

-- ============================================================================
-- GEOGRAPHIC AREAS
-- ============================================================================

-- Areas table - Define neighborhoods/areas in Jávea
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,

  -- Multilingual names
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,

  municipality TEXT NOT NULL DEFAULT 'Jávea',

  -- Geospatial data
  center GEOGRAPHY(POINT, 4326),       -- Center point of the area
  bounds GEOGRAPHY(POLYGON, 4326),     -- Boundary polygon for "in area" queries

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_areas_slug ON areas(slug);
CREATE INDEX idx_areas_municipality ON areas(municipality);
CREATE INDEX idx_areas_center ON areas USING GIST(center);
CREATE INDEX idx_areas_bounds ON areas USING GIST(bounds);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate price_per_sqm when price or size changes
CREATE OR REPLACE FUNCTION calculate_price_per_sqm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.size_built IS NOT NULL AND NEW.size_built > 0 THEN
    NEW.price_per_sqm = ROUND(NEW.price::DECIMAL / NEW.size_built);
  ELSE
    NEW.price_per_sqm = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_properties_price_per_sqm
  BEFORE INSERT OR UPDATE OF price, size_built ON properties
  FOR EACH ROW
  EXECUTE FUNCTION calculate_price_per_sqm();

-- Auto-add to price_history when price changes
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if price actually changed (not on first insert)
  IF (TG_OP = 'UPDATE' AND NEW.price != OLD.price) THEN
    INSERT INTO price_history (property_id, price, recorded_at)
    VALUES (NEW.id, NEW.price, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_property_price_changes
  AFTER UPDATE OF price ON properties
  FOR EACH ROW
  EXECUTE FUNCTION track_price_changes();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE properties IS 'Main properties table with multilingual content and PostGIS geospatial support';
COMMENT ON COLUMN properties.external_id IS 'Unique ID from source site (idealista-12345) to prevent duplicates';
COMMENT ON COLUMN properties.coordinates IS 'PostGIS geography point for geospatial queries (lat/lng)';
COMMENT ON COLUMN properties.last_seen_at IS 'Last time this listing was seen during scraping (for archiving stale listings)';

COMMENT ON TABLE features IS 'Normalized feature tags with multilingual names (pool, garage, etc.)';
COMMENT ON TABLE property_features IS 'Many-to-many relationship between properties and features';
COMMENT ON TABLE price_history IS 'Historical price tracking for market analysis and alerts';
COMMENT ON TABLE areas IS 'Geographic areas/neighborhoods in Jávea with spatial boundaries';
