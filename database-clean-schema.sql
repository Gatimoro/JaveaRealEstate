-- ============================================================================
-- DATABASE SCHEMA - Miraluna Valencia
-- ============================================================================
-- Last updated: 2026-02-22
--
-- TABLES:
--   properties          - Main property data (single source of truth)
--   translations        - EN/RU translations (optional, falls back to Spanish)
--   saved_properties    - User favourites (auth.users → properties)
--   property_analytics  - Append-only event log (views, saves, clicks)
--
-- VIEWS:
--   card_properties     - Materialized view for fast listing display & search
--   properties_for_sale / properties_for_rent / properties_new_building
--   hot_properties / new_properties
--
-- PRINCIPLE: Store once in properties, query via views.
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP VIEWS (safe to re-run, CASCADE removes dependents)
-- ============================================================================
DROP VIEW IF EXISTS hot_properties CASCADE;
DROP VIEW IF EXISTS most_liked_properties CASCADE;
DROP VIEW IF EXISTS new_properties CASCADE;
DROP VIEW IF EXISTS properties_for_sale CASCADE;
DROP VIEW IF EXISTS properties_for_rent CASCADE;
DROP VIEW IF EXISTS properties_new_building CASCADE;
DROP MATERIALIZED VIEW IF EXISTS card_properties CASCADE;
DROP MATERIALIZED VIEW IF EXISTS properties_search CASCADE;

-- ============================================================================
-- STEP 2: PROPERTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
  -- Identity
  id TEXT PRIMARY KEY,

  -- Classification
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent', 'new-building')),
  sub_category TEXT CHECK (sub_category IN ('apartment', 'house', 'commerce', 'plot')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),

  -- Core content (Spanish — primary language)
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,

  -- Location
  location TEXT NOT NULL,
  region TEXT DEFAULT 'Comunidad Valenciana',
  province TEXT,
  municipality TEXT,
  neighborhood TEXT,
  postal_code TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Property details
  images JSONB NOT NULL DEFAULT '[]',        -- Array of image URLs
  specs JSONB NOT NULL DEFAULT '{}',         -- {bedrooms, bathrooms, size, ...}
  features JSONB DEFAULT '[]',               -- Array of feature strings (Spanish)

  -- Scraping source
  source TEXT,                               -- 'idealista', 'fotocasa', 'manual'
  source_id TEXT,                            -- External ID from source
  source_url TEXT,                           -- Original listing URL

  -- Display
  badge TEXT,                                -- 'new', 'most_viewed', 'most_saved' (set by scraper or computed)

  -- Rent-specific
  rent_period TEXT,                          -- NULL for sale/new-building; 'week'|'month' for rent

  -- Analytics counters (incremented by triggers/functions — do NOT aggregate manually)
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Source deduplication
  UNIQUE(source, source_id),

  -- rent_period required for rent, forbidden for sale/new-building
  CONSTRAINT properties_rent_period_check CHECK (
    (listing_type = 'rent' AND rent_period IN ('week', 'month'))
    OR
    (listing_type <> 'rent' AND rent_period IS NULL)
  )
);

-- Indexes on properties
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_municipality ON properties(municipality);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);

-- ============================================================================
-- STEP 3: TRANSLATIONS TABLE
-- ============================================================================
-- Store EN/RU translations only when available; frontend falls back to Spanish.

CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'ru')),  -- 'es' stays in properties

  title TEXT,
  description TEXT,
  features JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(property_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_translations_property ON translations(property_id);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(property_id, locale);

-- ============================================================================
-- STEP 4: SAVED_PROPERTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON saved_properties(created_at DESC);

-- ============================================================================
-- STEP 5: PROPERTY_ANALYTICS TABLE
-- ============================================================================
-- Append-only event log. Never update or delete rows.
-- event_type: 'view' | 'click' | 'save' | 'unsave'

CREATE TABLE IF NOT EXISTS property_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'save', 'unsave')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_property_id ON property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON property_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON property_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON property_analytics(created_at DESC);

-- ============================================================================
-- STEP 6: CARD_PROPERTIES MATERIALIZED VIEW
-- ============================================================================
-- Lightweight snapshot for listing pages. Refreshed after bulk inserts.
-- Contains only what property cards need to display.

CREATE MATERIALIZED VIEW card_properties AS
SELECT
  p.id,
  p.listing_type,
  p.sub_category,
  p.status,
  p.title,
  p.price,
  p.rent_period,
  p.location,
  p.region,
  p.municipality,
  p.province,
  p.badge,
  p.images->0 AS thumbnail,                  -- First image only
  p.specs->>'bedrooms' AS bedrooms,
  p.specs->>'bathrooms' AS bathrooms,
  p.specs->>'size' AS size,
  p.views_count,
  p.saves_count,
  p.created_at,
  -- Full-text search vector (Spanish)
  to_tsvector('spanish',
    COALESCE(p.title, '') || ' ' ||
    COALESCE(p.location, '') || ' ' ||
    COALESCE(p.municipality, '') || ' ' ||
    COALESCE(p.province, '')
  ) AS search_vector
FROM properties p
WHERE p.status = 'available';

CREATE UNIQUE INDEX idx_card_properties_id ON card_properties(id);
CREATE INDEX idx_card_properties_listing_type ON card_properties(listing_type);
CREATE INDEX idx_card_properties_price ON card_properties(price);
CREATE INDEX idx_card_properties_municipality ON card_properties(municipality);
CREATE INDEX idx_card_properties_created ON card_properties(created_at DESC);
CREATE INDEX idx_card_properties_search ON card_properties USING GIN(search_vector);

-- ============================================================================
-- STEP 7: CATEGORY VIEWS
-- ============================================================================

CREATE VIEW properties_for_sale AS
SELECT * FROM card_properties WHERE listing_type = 'sale';

CREATE VIEW properties_for_rent AS
SELECT * FROM card_properties WHERE listing_type = 'rent';

CREATE VIEW properties_new_building AS
SELECT * FROM card_properties WHERE listing_type = 'new-building';

CREATE VIEW hot_properties AS
SELECT * FROM card_properties ORDER BY views_count DESC LIMIT 20;

CREATE VIEW new_properties AS
SELECT * FROM card_properties ORDER BY created_at DESC LIMIT 20;

-- ============================================================================
-- STEP 8: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_analytics ENABLE ROW LEVEL SECURITY;

-- Properties: public read, service role full access
CREATE POLICY "Public read access" ON properties
  FOR SELECT USING (status = 'available');
CREATE POLICY "Service role full access" ON properties
  FOR ALL USING (true) WITH CHECK (true);

-- Translations: public read, service role manages
CREATE POLICY "Public read translations" ON translations
  FOR SELECT USING (true);
CREATE POLICY "Service role translations" ON translations
  FOR ALL USING (true) WITH CHECK (true);

-- Saved properties: users manage their own
CREATE POLICY "Users read own saved" ON saved_properties
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved" ON saved_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved" ON saved_properties
  FOR DELETE USING (auth.uid() = user_id);

-- Analytics: service role inserts, users read own
CREATE POLICY "Service inserts analytics" ON property_analytics
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read analytics" ON property_analytics
  FOR SELECT USING (true);

-- ============================================================================
-- STEP 9: FUNCTIONS
-- ============================================================================

-- Refresh materialized view (call after bulk inserts)
CREATE OR REPLACE FUNCTION refresh_card_properties()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY card_properties;
END;
$$ LANGUAGE plpgsql;

-- sync_saves_count: keeps properties.saves_count accurate via trigger
-- Called by trg_sync_saves_count on saved_properties INSERT/DELETE
CREATE OR REPLACE FUNCTION sync_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE properties SET saves_count = saves_count + 1 WHERE id = NEW.property_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE properties SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.property_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger (safe: CREATE OR REPLACE equivalent via DROP+CREATE)
DROP TRIGGER IF EXISTS trg_sync_saves_count ON saved_properties;
CREATE TRIGGER trg_sync_saves_count
  AFTER INSERT OR DELETE ON saved_properties
  FOR EACH ROW EXECUTE FUNCTION sync_saves_count();

-- ⚠️  WARNING: If the live DB has a second trigger `update_property_saves_count`
-- (using function `update_saves_count`), DROP IT to prevent double-counting:
--
--   DROP TRIGGER IF EXISTS update_property_saves_count ON saved_properties;
--   DROP FUNCTION IF EXISTS update_saves_count();

-- record_property_view: deduplicates view events, increments views_count
-- Dedup: logged-in → once per user per property per day
--        anonymous → once per session_id per property per day
CREATE OR REPLACE FUNCTION record_property_view(
  p_property_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_already_seen BOOLEAN := FALSE;
BEGIN
  -- Check for existing view today
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM property_analytics
      WHERE property_id = p_property_id
        AND user_id = p_user_id
        AND event_type = 'view'
        AND created_at::date = v_today
    ) INTO v_already_seen;
  ELSIF p_session_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM property_analytics
      WHERE property_id = p_property_id
        AND (metadata->>'session_id') = p_session_id
        AND event_type = 'view'
        AND created_at::date = v_today
    ) INTO v_already_seen;
  END IF;

  -- Only record if new
  IF NOT v_already_seen THEN
    INSERT INTO property_analytics (property_id, user_id, event_type, metadata)
    VALUES (
      p_property_id,
      p_user_id,
      'view',
      CASE WHEN p_session_id IS NOT NULL
        THEN jsonb_build_object('session_id', p_session_id)
        ELSE '{}'::jsonb
      END
    );
    UPDATE properties SET views_count = views_count + 1 WHERE id = p_property_id;
    RETURN TRUE;  -- New unique view recorded
  END IF;

  RETURN FALSE;  -- Duplicate, not recorded
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_property_with_translation: fetch property + localized content in one call
CREATE OR REPLACE FUNCTION get_property_with_translation(
  p_id TEXT,
  p_locale TEXT DEFAULT 'es'
)
RETURNS TABLE(
  id TEXT, listing_type TEXT, sub_category TEXT,
  title TEXT, description TEXT,
  price NUMERIC, location TEXT, municipality TEXT, province TEXT, region TEXT,
  images JSONB, specs JSONB, features JSONB,
  source_url TEXT, badge TEXT,
  views_count INTEGER, saves_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.listing_type, p.sub_category,
    COALESCE(t.title, p.title) AS title,
    COALESCE(t.description, p.description) AS description,
    p.price, p.location, p.municipality, p.province, p.region,
    p.images, p.specs,
    COALESCE(t.features, p.features) AS features,
    p.source_url, p.badge,
    p.views_count, p.saves_count,
    p.created_at
  FROM properties p
  LEFT JOIN translations t ON p.id = t.property_id AND t.locale = p_locale
  WHERE p.id = p_id;
END;
$$ LANGUAGE plpgsql;

-- search_properties: full-text + filter search against card_properties
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
-- Insert a sale property (scraper format):
INSERT INTO properties (
  id, listing_type, sub_category, title, price,
  location, municipality, province, region,
  images, specs, source, source_id
) VALUES (
  'idealista-12345', 'sale', 'apartment',
  'Piso luminoso en el centro', 185000,
  'Valencia, Ciutat Vella', 'Valencia', 'Valencia', 'Comunidad Valenciana',
  '["https://images.idealista.com/123.jpg"]',
  '{"bedrooms": 3, "bathrooms": 2, "size": 95}',
  'idealista', '12345'
) ON CONFLICT (source, source_id) DO UPDATE
  SET title = EXCLUDED.title, price = EXCLUDED.price, updated_at = NOW();

-- Insert a rent property (rent_period is REQUIRED):
INSERT INTO properties (
  id, listing_type, sub_category, title, price, rent_period,
  location, municipality, province, region,
  images, specs, source, source_id
) VALUES (
  'idealista-67890', 'rent', 'apartment',
  'Piso en alquiler en el centro', 1200, 'month',
  'Valencia, Ciutat Vella', 'Valencia', 'Valencia', 'Comunidad Valenciana',
  '["https://images.idealista.com/456.jpg"]',
  '{"bedrooms": 2, "bathrooms": 1, "size": 75}',
  'idealista', '67890'
);

-- Add English translation:
INSERT INTO translations (property_id, locale, title, description)
VALUES ('idealista-12345', 'en', 'Bright apartment in city center', 'Beautiful apartment...');

-- Refresh card view after bulk insert:
SELECT refresh_card_properties();

-- Then POST to /api/revalidate to flush Next.js ISR cache.
*/
