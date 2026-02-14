-- ============================================================================
-- CLEAN DATABASE SCHEMA - Miraluna Valencia
-- ============================================================================
-- Date: 2026-02-14
-- Purpose: Simplified schema removing legacy redundancy
--
-- STRUCTURE:
--   properties        - Main table with ALL property data
--   translations      - Separate table for EN/RU translations (optional)
--   card_properties   - Lightweight VIEW for fast card display & search
--   properties_for_sale/rent/new - Filtered VIEWs by category
--
-- PRINCIPLE: Store once, query via views
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP LEGACY VIEWS (if they exist)
-- ============================================================================
DROP VIEW IF EXISTS hot_properties CASCADE;
DROP VIEW IF EXISTS most_liked_properties CASCADE;
DROP VIEW IF EXISTS new_properties CASCADE;
DROP VIEW IF EXISTS properties_for_sale CASCADE;
DROP VIEW IF EXISTS properties_for_rent CASCADE;
DROP MATERIALIZED VIEW IF EXISTS card_properties CASCADE;
DROP MATERIALIZED VIEW IF EXISTS properties_search CASCADE;

-- ============================================================================
-- STEP 2: CLEAN PROPERTIES TABLE
-- ============================================================================
-- This is the SINGLE SOURCE OF TRUTH for all property data.
-- No duplicate translation columns - translations go in translations table.

CREATE TABLE IF NOT EXISTS properties (
  -- Identity
  id TEXT PRIMARY KEY,

  -- Classification
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent', 'new-building')),
  sub_category TEXT CHECK (sub_category IN ('apartment', 'house', 'commerce', 'plot')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),

  -- Core content (Spanish - primary language)
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,

  -- Location
  location TEXT NOT NULL,                    -- Display string: "Valencia, Centro"
  region TEXT DEFAULT 'Comunidad Valenciana',
  province TEXT,
  municipality TEXT,
  neighborhood TEXT,
  postal_code TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Property details
  images JSONB NOT NULL DEFAULT '[]',        -- Array of image URLs
  specs JSONB NOT NULL DEFAULT '{}',         -- {bedrooms, bathrooms, size, etc.}
  features JSONB DEFAULT '[]',               -- Array of feature strings

  -- Scraping source
  source TEXT,                               -- 'idealista', 'fotocasa', 'manual'
  source_id TEXT,                            -- External ID from source
  source_url TEXT,                           -- Original listing URL

  -- Analytics
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint for source deduplication
  UNIQUE(source, source_id)
);

-- ============================================================================
-- STEP 3: TRANSLATIONS TABLE (Optional - only when translations exist)
-- ============================================================================
-- Store translations ONLY when they're available.
-- If no translation exists, frontend falls back to Spanish.

CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'ru')),  -- No 'es' - that's in properties

  title TEXT,
  description TEXT,
  features JSONB,                            -- Translated features array

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(property_id, locale)
);

-- ============================================================================
-- STEP 4: CARD_PROPERTIES MATERIALIZED VIEW (Fast search & display)
-- ============================================================================
-- This is what we query for listings. Lightweight, indexed, fast.
-- Contains ONLY what's needed to display a property card.

CREATE MATERIALIZED VIEW card_properties AS
SELECT
  p.id,
  p.listing_type,
  p.sub_category,
  p.status,
  p.title,
  p.price,
  p.location,
  p.municipality,
  p.province,
  p.images->0 AS thumbnail,                  -- First image only
  p.specs->>'bedrooms' AS bedrooms,
  p.specs->>'bathrooms' AS bathrooms,
  p.specs->>'size' AS size,
  p.views_count,
  p.created_at,
  -- Search vector for full-text search
  to_tsvector('spanish',
    COALESCE(p.title, '') || ' ' ||
    COALESCE(p.location, '') || ' ' ||
    COALESCE(p.municipality, '') || ' ' ||
    COALESCE(p.province, '')
  ) AS search_vector
FROM properties p
WHERE p.status = 'available';

-- Indexes for card_properties
CREATE UNIQUE INDEX idx_card_properties_id ON card_properties(id);
CREATE INDEX idx_card_properties_listing_type ON card_properties(listing_type);
CREATE INDEX idx_card_properties_price ON card_properties(price);
CREATE INDEX idx_card_properties_municipality ON card_properties(municipality);
CREATE INDEX idx_card_properties_created ON card_properties(created_at DESC);
CREATE INDEX idx_card_properties_search ON card_properties USING GIN(search_vector);

-- ============================================================================
-- STEP 5: CATEGORY VIEWS (Filter card_properties by type)
-- ============================================================================
-- These are simple filtered views on top of card_properties.
-- Ultra-fast because card_properties is already materialized.

CREATE VIEW properties_for_sale AS
SELECT * FROM card_properties WHERE listing_type = 'sale';

CREATE VIEW properties_for_rent AS
SELECT * FROM card_properties WHERE listing_type = 'rent';

CREATE VIEW properties_new_building AS
SELECT * FROM card_properties WHERE listing_type = 'new-building';

-- Hot properties (most viewed)
CREATE VIEW hot_properties AS
SELECT * FROM card_properties
ORDER BY views_count DESC
LIMIT 20;

-- New properties (most recent)
CREATE VIEW new_properties AS
SELECT * FROM card_properties
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- STEP 6: INDEXES ON MAIN PROPERTIES TABLE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_municipality ON properties(municipality);
CREATE INDEX IF NOT EXISTS idx_properties_province ON properties(province);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source, source_id);

-- Index on translations
CREATE INDEX IF NOT EXISTS idx_translations_property ON translations(property_id);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(property_id, locale);

-- ============================================================================
-- STEP 7: REFRESH FUNCTION
-- ============================================================================
-- Call this after inserting/updating properties to refresh the card view.

CREATE OR REPLACE FUNCTION refresh_card_properties()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY card_properties;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read available properties
CREATE POLICY "Public read access" ON properties
  FOR SELECT USING (status = 'available');

-- Service role can do everything
CREATE POLICY "Service role full access" ON properties
  FOR ALL USING (true) WITH CHECK (true);

-- Anyone can read translations
CREATE POLICY "Public read translations" ON translations
  FOR SELECT USING (true);

-- Service role manages translations
CREATE POLICY "Service role translations" ON translations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 9: HELPER FUNCTIONS
-- ============================================================================

-- Get property with translation (for detail pages)
CREATE OR REPLACE FUNCTION get_property_with_translation(
  p_id TEXT,
  p_locale TEXT DEFAULT 'es'
)
RETURNS TABLE(
  id TEXT,
  listing_type TEXT,
  sub_category TEXT,
  title TEXT,
  description TEXT,
  price NUMERIC,
  location TEXT,
  municipality TEXT,
  province TEXT,
  images JSONB,
  specs JSONB,
  features JSONB,
  source_url TEXT,
  views_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.listing_type,
    p.sub_category,
    COALESCE(t.title, p.title) AS title,
    COALESCE(t.description, p.description) AS description,
    p.price,
    p.location,
    p.municipality,
    p.province,
    p.images,
    p.specs,
    COALESCE(t.features, p.features) AS features,
    p.source_url,
    p.views_count,
    p.created_at
  FROM properties p
  LEFT JOIN translations t ON p.id = t.property_id AND t.locale = p_locale
  WHERE p.id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Search properties (uses card_properties)
CREATE OR REPLACE FUNCTION search_properties(
  p_query TEXT,
  p_listing_type TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF card_properties AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM card_properties
  WHERE
    (p_query IS NULL OR search_vector @@ plainto_tsquery('spanish', p_query))
    AND (p_listing_type IS NULL OR listing_type = p_listing_type)
    AND (p_min_price IS NULL OR price >= p_min_price)
    AND (p_max_price IS NULL OR price <= p_max_price)
  ORDER BY
    CASE WHEN p_query IS NOT NULL
      THEN ts_rank(search_vector, plainto_tsquery('spanish', p_query))
      ELSE 0
    END DESC,
    created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- 1. Get properties for sale (card data only)
SELECT * FROM properties_for_sale LIMIT 20;

-- 2. Search properties
SELECT * FROM search_properties('valencia centro', 'sale', 100000, 500000);

-- 3. Get full property details with English translation
SELECT * FROM get_property_with_translation('prop-123', 'en');

-- 4. Insert a new property
INSERT INTO properties (id, listing_type, sub_category, title, price, location, municipality, province, images, specs, source, source_id)
VALUES (
  'idealista-12345',
  'sale',
  'apartment',
  'Piso luminoso en el centro',
  185000,
  'Valencia, Ciutat Vella',
  'Valencia',
  'Valencia',
  '["https://images.idealista.com/123.jpg"]',
  '{"bedrooms": 3, "bathrooms": 2, "size": 95}',
  'idealista',
  '12345'
);

-- 5. Add English translation
INSERT INTO translations (property_id, locale, title, description)
VALUES ('idealista-12345', 'en', 'Bright apartment in city center', 'Beautiful apartment with...');

-- 6. Refresh card view after bulk insert
SELECT refresh_card_properties();

-- 7. Get hot properties
SELECT * FROM hot_properties;
*/

-- ============================================================================
-- MIGRATION: If you have existing data
-- ============================================================================

/*
-- Migrate existing properties (if coming from old schema):

-- 1. If you have title_en, description_en columns, migrate them:
INSERT INTO translations (property_id, locale, title, description, features)
SELECT id, 'en', title_en, description_en, features_en
FROM properties
WHERE title_en IS NOT NULL
ON CONFLICT (property_id, locale) DO NOTHING;

INSERT INTO translations (property_id, locale, title, description, features)
SELECT id, 'ru', title_ru, description_ru, features_ru
FROM properties
WHERE title_ru IS NOT NULL
ON CONFLICT (property_id, locale) DO NOTHING;

-- 2. Then drop the old columns:
ALTER TABLE properties
  DROP COLUMN IF EXISTS title_en,
  DROP COLUMN IF EXISTS title_es,
  DROP COLUMN IF EXISTS title_ru,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS description_es,
  DROP COLUMN IF EXISTS description_ru,
  DROP COLUMN IF EXISTS features_en,
  DROP COLUMN IF EXISTS features_es,
  DROP COLUMN IF EXISTS features_ru;
*/
