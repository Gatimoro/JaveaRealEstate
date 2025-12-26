-- Jávea Real Estate - RPC Functions for Complex Queries
-- Server-side functions for efficient database operations

-- ============================================================================
-- NEARBY PROPERTIES (Geospatial Query)
-- ============================================================================

-- Find properties within X kilometers of a given point
-- Returns properties sorted by distance, with optional filters
CREATE OR REPLACE FUNCTION nearby_properties(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5,
  property_type TEXT DEFAULT NULL,
  max_price INTEGER DEFAULT NULL,
  min_bedrooms INTEGER DEFAULT NULL,
  lim INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  type TEXT,
  title_es TEXT,
  title_en TEXT,
  title_ru TEXT,
  price INTEGER,
  location TEXT,
  area TEXT,
  images TEXT[],
  bedrooms INTEGER,
  bathrooms INTEGER,
  size_built INTEGER,
  distance_meters DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    p.id,
    p.external_id,
    p.type,
    p.title_es,
    p.title_en,
    p.title_ru,
    p.price,
    p.location,
    p.area,
    p.images,
    p.bedrooms,
    p.bathrooms,
    p.size_built,
    ST_Distance(
      p.coordinates,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_meters
  FROM properties p
  WHERE
    p.status = 'active'
    AND p.coordinates IS NOT NULL
    AND ST_DWithin(
      p.coordinates,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000  -- Convert km to meters
    )
    AND (property_type IS NULL OR p.type = property_type)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_bedrooms IS NULL OR p.bedrooms >= min_bedrooms)
  ORDER BY distance_meters ASC
  LIMIT lim;
$$;

COMMENT ON FUNCTION nearby_properties IS 'Find properties within radius using PostGIS spatial queries';

-- ============================================================================
-- FULL PROPERTY DATA (Single Query for Detail Page)
-- ============================================================================

-- Get complete property data including features, price history, and nearby properties
-- Optimized to fetch all related data in a single function call
CREATE OR REPLACE FUNCTION get_property_full(property_uuid UUID)
RETURNS JSON
LANGUAGE SQL
STABLE
AS $$
  SELECT json_build_object(
    'property', row_to_json(p),
    'features', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', f.id,
          'slug', f.slug,
          'name_es', f.name_es,
          'name_en', f.name_en,
          'name_ru', f.name_ru,
          'category', f.category
        )
      ), '[]'::json)
      FROM property_features pf
      JOIN features f ON f.id = pf.feature_id
      WHERE pf.property_id = p.id
    ),
    'price_history', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'price', ph.price,
          'recorded_at', ph.recorded_at
        ) ORDER BY ph.recorded_at DESC
      ), '[]'::json)
      FROM price_history ph
      WHERE ph.property_id = p.id
    ),
    'nearby_properties', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', n.id,
          'type', n.type,
          'title_es', n.title_es,
          'title_en', n.title_en,
          'title_ru', n.title_ru,
          'price', n.price,
          'location', n.location,
          'images', n.images,
          'bedrooms', n.bedrooms,
          'bathrooms', n.bathrooms,
          'size_built', n.size_built,
          'distance_meters', n.distance_meters
        )
      ), '[]'::json)
      FROM (
        SELECT
          pr.id,
          pr.type,
          pr.title_es,
          pr.title_en,
          pr.title_ru,
          pr.price,
          pr.location,
          pr.images,
          pr.bedrooms,
          pr.bathrooms,
          pr.size_built,
          ST_Distance(pr.coordinates, p.coordinates) AS distance_meters
        FROM properties pr
        WHERE pr.id != p.id
          AND pr.status = 'active'
          AND pr.type = p.type
          AND pr.coordinates IS NOT NULL
          AND p.coordinates IS NOT NULL
          AND ST_DWithin(pr.coordinates, p.coordinates, 5000)  -- Within 5km
        ORDER BY distance_meters ASC
        LIMIT 4
      ) n
    )
  )
  FROM properties p
  WHERE p.id = property_uuid;
$$;

COMMENT ON FUNCTION get_property_full IS 'Get complete property with features, price history, and nearby listings';

-- ============================================================================
-- MARKET ANALYTICS
-- ============================================================================

-- Get average prices by type
CREATE OR REPLACE FUNCTION get_market_stats()
RETURNS TABLE (
  property_type TEXT,
  count BIGINT,
  avg_price NUMERIC,
  min_price INTEGER,
  max_price INTEGER,
  avg_price_per_sqm NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    type AS property_type,
    COUNT(*)::BIGINT AS count,
    ROUND(AVG(price)) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price,
    ROUND(AVG(price_per_sqm)) AS avg_price_per_sqm
  FROM properties
  WHERE status = 'active'
  GROUP BY type
  ORDER BY type;
$$;

COMMENT ON FUNCTION get_market_stats IS 'Get aggregate market statistics by property type';

-- Get price trends over time (last 12 months)
CREATE OR REPLACE FUNCTION get_price_trends(
  property_type TEXT DEFAULT NULL,
  months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
  month DATE,
  avg_price NUMERIC,
  property_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    DATE_TRUNC('month', ph.recorded_at)::DATE AS month,
    ROUND(AVG(ph.price)) AS avg_price,
    COUNT(DISTINCT ph.property_id)::BIGINT AS property_count
  FROM price_history ph
  JOIN properties p ON p.id = ph.property_id
  WHERE
    ph.recorded_at >= NOW() - INTERVAL '1 month' * months_back
    AND (property_type IS NULL OR p.type = property_type)
  GROUP BY DATE_TRUNC('month', ph.recorded_at)
  ORDER BY month DESC;
$$;

COMMENT ON FUNCTION get_price_trends IS 'Get average price trends over time';

-- ============================================================================
-- SEARCH WITH FULL-TEXT
-- ============================================================================

-- Search properties with text matching and filters
CREATE OR REPLACE FUNCTION search_properties(
  search_query TEXT DEFAULT NULL,
  property_type TEXT DEFAULT NULL,
  min_price INTEGER DEFAULT NULL,
  max_price INTEGER DEFAULT NULL,
  min_bedrooms INTEGER DEFAULT NULL,
  max_bedrooms INTEGER DEFAULT NULL,
  min_bathrooms INTEGER DEFAULT NULL,
  min_size INTEGER DEFAULT NULL,
  area_filter TEXT DEFAULT NULL,
  lim INTEGER DEFAULT 50,
  off INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  type TEXT,
  title_es TEXT,
  title_en TEXT,
  title_ru TEXT,
  description_es TEXT,
  price INTEGER,
  location TEXT,
  area TEXT,
  images TEXT[],
  bedrooms INTEGER,
  bathrooms INTEGER,
  size_built INTEGER,
  size_plot INTEGER
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    p.id,
    p.external_id,
    p.type,
    p.title_es,
    p.title_en,
    p.title_ru,
    p.description_es,
    p.price,
    p.location,
    p.area,
    p.images,
    p.bedrooms,
    p.bathrooms,
    p.size_built,
    p.size_plot
  FROM properties p
  WHERE
    p.status = 'active'
    AND (property_type IS NULL OR p.type = property_type)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_bedrooms IS NULL OR p.bedrooms >= min_bedrooms)
    AND (max_bedrooms IS NULL OR p.bedrooms <= max_bedrooms)
    AND (min_bathrooms IS NULL OR p.bathrooms >= min_bathrooms)
    AND (min_size IS NULL OR p.size_built >= min_size)
    AND (area_filter IS NULL OR p.area = area_filter)
    AND (
      search_query IS NULL
      OR p.title_es ILIKE '%' || search_query || '%'
      OR p.title_en ILIKE '%' || search_query || '%'
      OR p.description_es ILIKE '%' || search_query || '%'
      OR p.location ILIKE '%' || search_query || '%'
    )
  ORDER BY p.updated_at DESC
  LIMIT lim
  OFFSET off;
$$;

COMMENT ON FUNCTION search_properties IS 'Full-text search with multiple filters';

-- ============================================================================
-- ADMIN / SCRAPER UTILITIES
-- ============================================================================

-- Upsert property (insert or update if external_id exists)
CREATE OR REPLACE FUNCTION upsert_property(
  p_external_id TEXT,
  p_source TEXT,
  p_source_url TEXT,
  p_type TEXT,
  p_price INTEGER,
  p_location TEXT,
  p_title_es TEXT DEFAULT NULL,
  p_description_es TEXT DEFAULT NULL,
  p_images TEXT[] DEFAULT '{}',
  p_bedrooms INTEGER DEFAULT NULL,
  p_bathrooms INTEGER DEFAULT NULL,
  p_size_built INTEGER DEFAULT NULL,
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  property_id UUID;
BEGIN
  INSERT INTO properties (
    external_id, source, source_url, type, price, location,
    title_es, description_es, images, bedrooms, bathrooms, size_built,
    coordinates, first_seen_at, last_seen_at
  )
  VALUES (
    p_external_id, p_source, p_source_url, p_type, p_price, p_location,
    p_title_es, p_description_es, p_images, p_bedrooms, p_bathrooms, p_size_built,
    CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      ELSE NULL
    END,
    NOW(), NOW()
  )
  ON CONFLICT (external_id)
  DO UPDATE SET
    price = EXCLUDED.price,
    title_es = COALESCE(EXCLUDED.title_es, properties.title_es),
    description_es = COALESCE(EXCLUDED.description_es, properties.description_es),
    images = COALESCE(EXCLUDED.images, properties.images),
    bedrooms = COALESCE(EXCLUDED.bedrooms, properties.bedrooms),
    bathrooms = COALESCE(EXCLUDED.bathrooms, properties.bathrooms),
    size_built = COALESCE(EXCLUDED.size_built, properties.size_built),
    coordinates = COALESCE(EXCLUDED.coordinates, properties.coordinates),
    last_seen_at = NOW(),
    status = 'active'  -- Reactivate if it was inactive
  RETURNING id INTO property_id;

  RETURN property_id;
END;
$$;

COMMENT ON FUNCTION upsert_property IS 'Insert or update property by external_id (for web scraper)';

-- Mark properties as inactive if not seen recently
CREATE OR REPLACE FUNCTION archive_stale_properties(days_threshold INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  UPDATE properties
  SET status = 'inactive'
  WHERE status = 'active'
    AND last_seen_at < NOW() - INTERVAL '1 day' * days_threshold
  RETURNING 1;
$$;

COMMENT ON FUNCTION archive_stale_properties IS 'Mark properties as inactive if not seen in X days';
