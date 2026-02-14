# Database Schema

**Last Updated:** February 14, 2026
**Database:** Supabase (PostgreSQL)
**Schema File:** `database-clean-schema.sql`

---

## Overview

Simple, clean schema designed for:
- Fast property card display (materialized view)
- Full-text search in Spanish
- Optional translations (separate table)
- Easy scraping integration

### Schema Structure

```
properties          ← Main table (single source of truth)
    ↓
card_properties     ← Materialized view (fast search/display)
    ↓
properties_for_*    ← Filtered views by category

translations        ← Optional EN/RU translations
```

---

## Tables

### 1. `properties` - Main Property Table

Stores ALL property data. No duplicate translation columns.

```sql
CREATE TABLE properties (
  -- Identity
  id TEXT PRIMARY KEY,                    -- 'idealista-12345' or 'manual-001'

  -- Classification
  listing_type TEXT NOT NULL,             -- 'sale' | 'rent' | 'new-building'
  sub_category TEXT,                      -- 'apartment' | 'house' | 'commerce' | 'plot'
  status TEXT DEFAULT 'available',        -- 'available' | 'reserved' | 'sold'

  -- Content (Spanish primary)
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,

  -- Location
  location TEXT NOT NULL,                 -- Display: "Valencia, Centro"
  region TEXT DEFAULT 'Comunidad Valenciana',
  province TEXT,
  municipality TEXT,
  neighborhood TEXT,
  postal_code TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Property details
  images JSONB DEFAULT '[]',              -- ["https://...jpg", ...]
  specs JSONB DEFAULT '{}',               -- {bedrooms: 3, bathrooms: 2, size: 95}
  features JSONB DEFAULT '[]',            -- ["Terraza", "Piscina", ...]

  -- Source tracking
  source TEXT,                            -- 'idealista', 'fotocasa', 'manual'
  source_id TEXT,                         -- External ID
  source_url TEXT,                        -- Original URL

  -- Analytics
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source, source_id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_municipality ON properties(municipality);
CREATE INDEX idx_properties_created ON properties(created_at DESC);
CREATE INDEX idx_properties_source ON properties(source, source_id);
```

---

### 2. `translations` - Optional Translations

Only stores translations when available. Frontend falls back to Spanish.

```sql
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,                   -- 'en' | 'ru' (NOT 'es')

  title TEXT,
  description TEXT,
  features JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, locale)
);
```

---

### 3. `card_properties` - Materialized View

Lightweight view for listings. Contains only what's needed for cards.

```sql
CREATE MATERIALIZED VIEW card_properties AS
SELECT
  id,
  listing_type,
  sub_category,
  status,
  title,
  price,
  location,
  municipality,
  province,
  images->0 AS thumbnail,
  specs->>'bedrooms' AS bedrooms,
  specs->>'bathrooms' AS bathrooms,
  specs->>'size' AS size,
  views_count,
  created_at,
  to_tsvector('spanish', title || ' ' || location || ' ' || COALESCE(municipality, '')) AS search_vector
FROM properties
WHERE status = 'available';
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_card_properties_id ON card_properties(id);
CREATE INDEX idx_card_properties_listing_type ON card_properties(listing_type);
CREATE INDEX idx_card_properties_price ON card_properties(price);
CREATE INDEX idx_card_properties_search ON card_properties USING GIN(search_vector);
```

**Refresh after data changes:**
```sql
SELECT refresh_card_properties();
-- or
REFRESH MATERIALIZED VIEW CONCURRENTLY card_properties;
```

---

### 4. Category Views

Simple filtered views on top of `card_properties`:

```sql
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
```

---

## Query Patterns

### List properties (cards)
```typescript
// Fast - uses materialized view
const { data } = await supabase
  .from('card_properties')
  .select('*')
  .eq('listing_type', 'sale')
  .order('created_at', { ascending: false })
  .range(0, 23);
```

### Search properties
```typescript
// Full-text search
const { data } = await supabase
  .rpc('search_properties', {
    p_query: 'valencia centro',
    p_listing_type: 'sale',
    p_min_price: 100000,
    p_max_price: 500000
  });
```

### Get property detail with translation
```typescript
// Falls back to Spanish if no translation
const { data } = await supabase
  .rpc('get_property_with_translation', {
    p_id: 'idealista-12345',
    p_locale: 'en'  // or 'ru'
  });
```

### Insert property (from scraper)
```typescript
const { error } = await supabase
  .from('properties')
  .upsert({
    id: 'idealista-12345',
    listing_type: 'sale',
    sub_category: 'apartment',
    title: 'Piso luminoso en el centro',
    price: 185000,
    location: 'Valencia, Ciutat Vella',
    municipality: 'Valencia',
    province: 'Valencia',
    images: ['https://...'],
    specs: { bedrooms: 3, bathrooms: 2, size: 95 },
    source: 'idealista',
    source_id: '12345'
  }, { onConflict: 'source,source_id' });
```

---

## Row Level Security

```sql
-- Anyone can read available properties
CREATE POLICY "Public read" ON properties
  FOR SELECT USING (status = 'available');

-- Service role (backend) can do everything
CREATE POLICY "Service full access" ON properties
  FOR ALL USING (true);

-- Same for translations
CREATE POLICY "Public read translations" ON translations
  FOR SELECT USING (true);
```

---

## Migration Guide

### From scratch (new database)
```bash
# Run the clean schema
psql $DATABASE_URL < database-clean-schema.sql
```

### From old schema (with title_en, description_en columns)
```sql
-- 1. Migrate translations to new table
INSERT INTO translations (property_id, locale, title, description, features)
SELECT id, 'en', title_en, description_en, features_en
FROM properties WHERE title_en IS NOT NULL;

INSERT INTO translations (property_id, locale, title, description, features)
SELECT id, 'ru', title_ru, description_ru, features_ru
FROM properties WHERE title_ru IS NOT NULL;

-- 2. Drop old columns
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
```

---

## Maintenance

### Refresh card view (after bulk inserts)
```sql
SELECT refresh_card_properties();
```

### Update analytics
```sql
UPDATE properties SET views_count = views_count + 1 WHERE id = 'xyz';
```

### Mark stale properties
```sql
UPDATE properties SET status = 'sold'
WHERE source = 'idealista'
  AND updated_at < NOW() - INTERVAL '7 days';
```

---

## Connection

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```
