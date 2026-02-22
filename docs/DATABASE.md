# Database Schema

**Last Updated:** 2026-02-22
**Database:** Supabase (PostgreSQL)
**Schema File:** `database-clean-schema.sql`

---

## Overview

```
properties              ← Main table (single source of truth)
translations            ← Optional EN/RU override translations
saved_properties        ← User favourites (auth.users → properties)
property_analytics      ← Append-only event log (views, saves)
    ↓
card_properties         ← Materialized view (fast listing display)
    ↓
properties_for_sale     ← Filtered view (listing_type = 'sale')
properties_for_rent     ← Filtered view (listing_type = 'rent')
properties_new_building ← Filtered view (listing_type = 'new-building')
hot_properties          ← View (top 20 by views_count)
new_properties          ← View (top 20 by created_at)
```

---

## Tables

### 1. `properties` — Main Table

```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,                    -- 'idealista-12345'

  listing_type TEXT NOT NULL,             -- 'sale' | 'rent' | 'new-building'
  sub_category TEXT,                      -- 'apartment' | 'house' | 'commerce' | 'plot'
  status TEXT DEFAULT 'available',        -- 'available' | 'reserved' | 'sold'

  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,

  location TEXT NOT NULL,                 -- Display: "Valencia, Centro"
  region TEXT DEFAULT 'Comunidad Valenciana',
  province TEXT,
  municipality TEXT,
  neighborhood TEXT,
  postal_code TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  images JSONB DEFAULT '[]',              -- ["https://...jpg", ...]
  specs JSONB DEFAULT '{}',              -- {"bedrooms": 3, "bathrooms": 2, "size": 95}
  features JSONB DEFAULT '[]',           -- ["Terraza", "Piscina", ...]

  source TEXT,                            -- 'idealista' | 'fotocasa' | 'manual'
  source_id TEXT,
  source_url TEXT,

  badge TEXT,                             -- 'new' | 'most_viewed' | 'most_saved'
  rent_period TEXT,                       -- 'week' | 'month' (rent only, NULL for sale/new-building)

  views_count INTEGER DEFAULT 0,          -- Incremented by record_property_view()
  saves_count INTEGER DEFAULT 0,          -- Incremented by trg_sync_saves_count trigger

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source, source_id)
);
```

**specs format** (always numeric, use `size` key — not `area`):
```json
{"bedrooms": 3, "bathrooms": 2, "size": 95}
```

---

### 2. `translations` — Optional EN/RU Translations

Stores overrides only. Frontend falls back to `properties.title` (English from scraper).

```sql
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,                   -- 'en' | 'ru' (never 'es')
  title TEXT,
  description TEXT,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, locale)
);
```

---

### 3. `saved_properties` — User Favourites

```sql
CREATE TABLE saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);
```

On INSERT → `saves_count + 1` via `trg_sync_saves_count` trigger.
On DELETE → `GREATEST(saves_count - 1, 0)` via same trigger.

---

### 4. `property_analytics` — Event Log

Append-only. Never update or delete rows.

```sql
CREATE TABLE property_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,               -- 'view' | 'click' | 'save' | 'unsave'
  metadata JSONB DEFAULT '{}',            -- {"session_id": "..."} for anonymous views
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Views

### `card_properties` — Materialized View

Lightweight snapshot for listing pages. Refresh after bulk inserts.

```sql
CREATE MATERIALIZED VIEW card_properties AS
SELECT
  p.id, p.listing_type, p.sub_category, p.status,
  p.title, p.price, p.rent_period,
  p.location, p.region, p.municipality, p.province,
  p.badge,
  p.images->0 AS thumbnail,
  p.specs->>'bedrooms' AS bedrooms,
  p.specs->>'bathrooms' AS bathrooms,
  p.specs->>'size' AS size,
  p.views_count, p.saves_count, p.created_at,
  to_tsvector('spanish',
    COALESCE(p.title, '') || ' ' ||
    COALESCE(p.location, '') || ' ' ||
    COALESCE(p.municipality, '') || ' ' ||
    COALESCE(p.province, '')
  ) AS search_vector
FROM properties p
WHERE p.status = 'available';
```

**Refresh:** `SELECT refresh_card_properties();`

---

## Functions

### `record_property_view(p_property_id, p_user_id, p_session_id)`

Deduplicates view events and increments `views_count`:
- Logged-in: 1 view per user per property per day
- Anonymous: 1 view per `session_id` (localStorage UUID) per property per day

Returns `TRUE` if a new unique view was recorded, `FALSE` if duplicate.

Called by `/api/track-view` route (fire-and-forget via `navigator.sendBeacon`).

---

### `sync_saves_count()` — Trigger Function

Fires on `saved_properties` INSERT/DELETE to keep `properties.saves_count` accurate.

> **⚠️ Warning:** If your live DB has a pre-existing `update_property_saves_count` trigger,
> drop it to prevent double-counting:
> ```sql
> DROP TRIGGER IF EXISTS update_property_saves_count ON saved_properties;
> DROP FUNCTION IF EXISTS update_saves_count();
> ```

---

### `get_property_with_translation(p_id, p_locale)`

Fetches a single property with localized content in one query. Falls back to base Spanish
(`properties.title`) if no translation row exists for the requested locale.

---

### `search_properties(p_query, p_listing_type, p_min_price, p_max_price, p_limit, p_offset)`

Full-text + filter search against `card_properties`.

---

## Row Level Security

```sql
-- Properties: public read available, service role full access
-- Translations: public read
-- saved_properties: users manage own rows only
-- property_analytics: service role inserts, public read
```

---

## Query Patterns

### Paginated listing (category pages)
```typescript
const { data, count } = await supabase
  .from('card_properties')
  .select('*', { count: 'exact' })
  .eq('listing_type', 'sale')
  .order('created_at', { ascending: false })
  .range(0, 23);
```

### Bedroom filter (text extraction from JSONB)
```typescript
query = query.gte('specs->>bedrooms', String(minBedrooms));
```

### Property detail with translations
```typescript
const data = await supabase.rpc('get_property_with_translation', {
  p_id: 'idealista-12345',
  p_locale: 'en'
});
```

### Insert from scraper
```typescript
await supabase.from('properties').upsert({
  id: 'idealista-12345',
  listing_type: 'sale',
  sub_category: 'apartment',
  title: 'Piso luminoso en el centro',
  price: 185000,
  location: 'Valencia, Ciutat Vella',
  municipality: 'Valencia',
  province: 'Valencia',
  region: 'Comunidad Valenciana',
  images: ['https://...'],
  specs: { bedrooms: 3, bathrooms: 2, size: 95 },  // Always numbers, 'size' key
  source: 'idealista',
  source_id: '12345'
}, { onConflict: 'source,source_id' });
```

---

## After Bulk Insert

```sql
-- 1. Refresh materialized view
SELECT refresh_card_properties();
```

```bash
# 2. Flush ISR cache
curl -X POST https://miraluna.es/api/revalidate \
  -H "x-revalidate-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"clearAll": true}'
```

---

## Connection

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # Server-only (revalidate route)
```
