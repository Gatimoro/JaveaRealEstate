-- Database Schema: Spain-wide Expansion
-- Date: 2026-02-04
-- Purpose: Add location hierarchy for Valencia and Madrid regions

-- ============================================================================
-- LOCATION HIERARCHY FIELDS
-- ============================================================================

-- Add geographic columns for Spain-wide coverage
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Spain',
ADD COLUMN IF NOT EXISTS region TEXT,           -- 'Comunidad Valenciana', 'Comunidad de Madrid'
ADD COLUMN IF NOT EXISTS province TEXT,         -- 'Alicante', 'Valencia', 'Castellón', 'Madrid'
ADD COLUMN IF NOT EXISTS municipality TEXT,     -- 'Jávea', 'Valencia', 'Madrid', etc.
ADD COLUMN IF NOT EXISTS neighborhood TEXT,     -- 'Arenal', 'Ciutat Vella', etc.
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Add comments for documentation
COMMENT ON COLUMN properties.region IS 'Autonomous community: Comunidad Valenciana, Comunidad de Madrid, etc.';
COMMENT ON COLUMN properties.province IS 'Province: Alicante, Valencia, Castellón, Madrid';
COMMENT ON COLUMN properties.municipality IS 'City/Town: Jávea, Valencia, Madrid, etc.';
COMMENT ON COLUMN properties.neighborhood IS 'Neighborhood/District within city';

-- ============================================================================
-- INDEXES FOR LOCATION-BASED QUERIES
-- ============================================================================

-- Individual indexes for filtering
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_province ON properties(province);
CREATE INDEX IF NOT EXISTS idx_properties_municipality ON properties(municipality);
CREATE INDEX IF NOT EXISTS idx_properties_postal_code ON properties(postal_code);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_location_hierarchy
  ON properties(region, province, municipality)
  WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_properties_region_category
  ON properties(region, listing_type, sub_category)
  WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_properties_province_price
  ON properties(province, price)
  WHERE status = 'available';

-- Geospatial index for map queries (requires PostGIS extension)
-- Note: Install PostGIS first: CREATE EXTENSION IF NOT EXISTS postgis;
CREATE INDEX IF NOT EXISTS idx_properties_geolocation
  ON properties USING GIST (
    ST_MakePoint(longitude, latitude)::geography
  )
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- MIGRATE EXISTING DATA (Jávea properties)
-- ============================================================================

-- Update existing Jávea properties with location hierarchy
UPDATE properties
SET
  region = 'Comunidad Valenciana',
  province = 'Alicante',
  municipality = 'Jávea'
WHERE municipality IS NULL
  AND (location ILIKE '%jávea%' OR location ILIKE '%javea%' OR location ILIKE '%xàbia%');

-- ============================================================================
-- LOCATION REFERENCE DATA
-- ============================================================================

-- Create lookup table for regions and provinces (optional, for validation)
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  country TEXT DEFAULT 'Spain',
  region TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  population INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region, province, municipality)
);

-- Insert Valencia region locations
INSERT INTO locations (region, province, municipality, latitude, longitude, population) VALUES
  -- Alicante Province
  ('Comunidad Valenciana', 'Alicante', 'Jávea', 38.7915, 0.1750, 27000),
  ('Comunidad Valenciana', 'Alicante', 'Alicante', 38.3452, -0.4815, 330000),
  ('Comunidad Valenciana', 'Alicante', 'Benidorm', 38.5369, -0.1310, 70000),
  ('Comunidad Valenciana', 'Alicante', 'Torrevieja', 37.9787, -0.6817, 84000),
  ('Comunidad Valenciana', 'Alicante', 'Elche', 38.2699, -0.6983, 230000),
  ('Comunidad Valenciana', 'Alicante', 'Denia', 38.8408, 0.1057, 42000),
  ('Comunidad Valenciana', 'Alicante', 'Calpe', 38.6420, 0.0428, 23000),
  ('Comunidad Valenciana', 'Alicante', 'Altea', 38.5987, -0.0543, 22000),
  ('Comunidad Valenciana', 'Alicante', 'Moraira', 38.6893, 0.1372, 10000),

  -- Valencia Province
  ('Comunidad Valenciana', 'Valencia', 'Valencia', 39.4699, -0.3763, 800000),
  ('Comunidad Valenciana', 'Valencia', 'Gandía', 38.9667, -0.1833, 75000),
  ('Comunidad Valenciana', 'Valencia', 'Torrent', 39.4369, -0.4672, 82000),
  ('Comunidad Valenciana', 'Valencia', 'Paterna', 39.5028, -0.4408, 70000),
  ('Comunidad Valenciana', 'Valencia', 'Sagunto', 39.6806, -0.2731, 65000),
  ('Comunidad Valenciana', 'Valencia', 'Cullera', 39.1667, -0.2500, 23000),
  ('Comunidad Valenciana', 'Valencia', 'Oliva', 38.9167, -0.1167, 26000),

  -- Castellón Province
  ('Comunidad Valenciana', 'Castellón', 'Castellón de la Plana', 39.9864, -0.0513, 170000),
  ('Comunidad Valenciana', 'Castellón', 'Vila-real', 39.9375, -0.1011, 51000),
  ('Comunidad Valenciana', 'Castellón', 'Burriana', 39.8894, -0.0853, 35000),
  ('Comunidad Valenciana', 'Castellón', 'Benicàssim', 40.0519, 0.0667, 18000),
  ('Comunidad Valenciana', 'Castellón', 'Vinaròs', 40.4706, 0.4667, 28000),
  ('Comunidad Valenciana', 'Castellón', 'Peñíscola', 40.3603, 0.4094, 8000)
ON CONFLICT (region, province, municipality) DO NOTHING;

-- Insert Madrid region locations
INSERT INTO locations (region, province, municipality, latitude, longitude, population) VALUES
  ('Comunidad de Madrid', 'Madrid', 'Madrid', 40.4168, -3.7038, 3200000),
  ('Comunidad de Madrid', 'Madrid', 'Móstoles', 40.3228, -3.8648, 210000),
  ('Comunidad de Madrid', 'Madrid', 'Alcalá de Henares', 40.4818, -3.3636, 195000),
  ('Comunidad de Madrid', 'Madrid', 'Fuenlabrada', 40.2842, -3.7947, 193000),
  ('Comunidad de Madrid', 'Madrid', 'Leganés', 40.3272, -3.7636, 188000),
  ('Comunidad de Madrid', 'Madrid', 'Getafe', 40.3056, -3.7325, 183000),
  ('Comunidad de Madrid', 'Madrid', 'Alcorcón', 40.3458, -3.8242, 170000),
  ('Comunidad de Madrid', 'Madrid', 'Torrejón de Ardoz', 40.4567, -3.4714, 132000),
  ('Comunidad de Madrid', 'Madrid', 'Parla', 40.2375, -3.7711, 130000),
  ('Comunidad de Madrid', 'Madrid', 'Alcobendas', 40.5478, -3.6419, 116000),
  ('Comunidad de Madrid', 'Madrid', 'Las Rozas', 40.4925, -3.8736, 95000),
  ('Comunidad de Madrid', 'Madrid', 'Pozuelo de Alarcón', 40.4350, -3.8119, 85000),
  ('Comunidad de Madrid', 'Madrid', 'Majadahonda', 40.4733, -3.8719, 71000),
  ('Comunidad de Madrid', 'Madrid', 'Boadilla del Monte', 40.4042, -3.8764, 53000)
ON CONFLICT (region, province, municipality) DO NOTHING;

-- Create index on locations table
CREATE INDEX IF NOT EXISTS idx_locations_province ON locations(province);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);

-- ============================================================================
-- HELPER FUNCTIONS FOR LOCATION QUERIES
-- ============================================================================

/**
 * Get properties by region with pagination
 * Usage: SELECT * FROM get_properties_by_region('Comunidad Valenciana', 20, 0);
 */
CREATE OR REPLACE FUNCTION get_properties_by_region(
  p_region TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
) RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM properties
  WHERE region = p_region
    AND status = 'available'
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

/**
 * Get properties by province and category
 * Usage: SELECT * FROM get_properties_by_province_category('Alicante', 'sale', 20, 0);
 */
CREATE OR REPLACE FUNCTION get_properties_by_province_category(
  p_province TEXT,
  p_listing_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
) RETURNS SETOF properties AS $$
BEGIN
  IF p_listing_type IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM properties
    WHERE province = p_province
      AND listing_type = p_listing_type
      AND status = 'available'
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
  ELSE
    RETURN QUERY
    SELECT * FROM properties
    WHERE province = p_province
      AND status = 'available'
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$ LANGUAGE plpgsql;

/**
 * Search properties within radius of a point (for map queries)
 * Usage: SELECT * FROM search_properties_near_point(38.7915, 0.1750, 10000, 20);
 */
CREATE OR REPLACE FUNCTION search_properties_near_point(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_radius_meters INT DEFAULT 5000,
  p_limit INT DEFAULT 50
) RETURNS TABLE(
  property_id TEXT,
  distance_meters INT,
  title TEXT,
  price NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    ST_Distance(
      ST_MakePoint(p_longitude, p_latitude)::geography,
      ST_MakePoint(p.longitude, p.latitude)::geography
    )::INT as distance_meters,
    p.title,
    p.price,
    p.latitude,
    p.longitude
  FROM properties p
  WHERE p.status = 'available'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(p_longitude, p_latitude)::geography,
      ST_MakePoint(p.longitude, p.latitude)::geography,
      p_radius_meters
    )
  ORDER BY distance_meters
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STATISTICS VIEWS
-- ============================================================================

-- Property counts by region and province
CREATE OR REPLACE VIEW property_stats_by_location AS
SELECT
  region,
  province,
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE listing_type = 'sale') as for_sale,
  COUNT(*) FILTER (WHERE listing_type = 'rent') as for_rent,
  COUNT(*) FILTER (WHERE listing_type = 'new-building') as new_buildings,
  AVG(price) FILTER (WHERE listing_type = 'sale') as avg_sale_price,
  AVG(price) FILTER (WHERE listing_type = 'rent') as avg_rent_price
FROM properties
WHERE status = 'available'
GROUP BY region, province
ORDER BY region, province;

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Check that existing properties have location data
SELECT
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE region IS NOT NULL) as with_region,
  COUNT(*) FILTER (WHERE province IS NOT NULL) as with_province,
  COUNT(*) FILTER (WHERE municipality IS NOT NULL) as with_municipality,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as with_coordinates
FROM properties;

-- Show property distribution by province
SELECT province, COUNT(*) as count
FROM properties
WHERE status = 'available'
GROUP BY province
ORDER BY count DESC;
