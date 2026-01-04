# Database Architecture

This document explains the database schema, tables, queries, and how data is stored and accessed.

## Database Provider

**Supabase** - PostgreSQL database with additional features:
- Row Level Security (RLS)
- Built-in authentication
- RESTful API auto-generated from schema
- Real-time subscriptions

**Connection**:
- URL: `process.env.NEXT_PUBLIC_SUPABASE_URL`
- Key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Tables

### 1. `properties` Table

Main table storing all property listings.

**Schema**:
```sql
CREATE TABLE properties (
  -- Identity
  id TEXT PRIMARY KEY,                    -- Example: "house-001"
  type TEXT NOT NULL,                     -- 'house' | 'investment' | 'plot'
  status TEXT DEFAULT 'available',        -- 'available' | 'reserved' | 'sold'

  -- Multilingual titles
  title TEXT NOT NULL,                    -- Base title (English from scraper)
  title_en TEXT,                          -- English translation
  title_es TEXT,                          -- Spanish translation
  title_ru TEXT,                          -- Russian translation

  -- Multilingual descriptions
  description TEXT,                       -- Base description (English)
  description_en TEXT,                    -- English translation
  description_es TEXT,                    -- Spanish translation
  description_ru TEXT,                    -- Russian translation

  -- Multilingual features (JSONB arrays)
  features JSONB DEFAULT '[]',            -- Base features (English)
  features_en JSONB DEFAULT '[]',         -- English features
  features_es JSONB DEFAULT '[]',         -- Spanish features
  features_ru JSONB DEFAULT '[]',         -- Russian features

  -- Core info
  price NUMERIC NOT NULL,                 -- Property price in EUR
  location TEXT NOT NULL,                 -- "Javea, Alicante"
  images JSONB NOT NULL DEFAULT '[]',     -- Array of image URLs
  specs JSONB NOT NULL DEFAULT '{}',      -- Property specifications

  -- Optional fields
  badge TEXT,                             -- UNUSED (generated dynamically)
  source_url TEXT,                        -- Original listing URL
  source_reference TEXT,                  -- External ID (idealista, etc.)

  -- Analytics
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,         -- UNUSED (never incremented)
  saves_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scraped_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes**:
```sql
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_properties_features ON properties USING GIN (features);
CREATE INDEX idx_properties_specs ON properties USING GIN (specs);
CREATE INDEX idx_properties_features_es ON properties USING GIN (features_es);
```

**Critical Notes**:
1. Uses **TEXT** for `id` (not UUID) - property IDs like "house-001"
2. **JSONB** for images, features, specs - flexible but harder to query
3. **badge** column exists but UNUSED - badges generated dynamically in code
4. **clicks_count** exists but NEVER incremented - technical debt
5. **title_es** was missing initially - added via schema fix
6. Supports both snake_case (DB) and camelCase (TypeScript)

### 2. `saved_properties` Table

Stores which properties users have favorited.

**Schema**:
```sql
CREATE TABLE saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,              -- References properties(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, property_id)            -- Prevent duplicate saves
);
```

**Indexes**:
```sql
CREATE INDEX idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX idx_saved_properties_created_at ON saved_properties(created_at DESC);
```

**Critical Notes**:
1. Currently **NOT USED** - saved properties stored in localStorage instead
2. Requires authentication to work
3. RLS policies limit users to their own saves
4. Future migration planned from localStorage

### 3. `property_analytics` Table

Tracks individual analytics events for detailed analysis.

**Schema**:
```sql
CREATE TABLE property_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,               -- 'view' | 'click' | 'save' | 'unsave'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'             -- Additional context
);
```

**Indexes**:
```sql
CREATE INDEX idx_analytics_property_id ON property_analytics(property_id);
CREATE INDEX idx_analytics_user_id ON property_analytics(user_id);
CREATE INDEX idx_analytics_event_type ON property_analytics(event_type);
CREATE INDEX idx_analytics_created_at ON property_analytics(created_at DESC);
```

**Critical Notes**:
1. Currently **NOT USED** - no events tracked yet
2. Designed for future analytics dashboard
3. Allows anonymous events (user_id can be NULL)

## Row Level Security (RLS)

All tables have RLS enabled for security.

### Properties Table Policies

```sql
-- Anyone can view available/reserved properties
CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  USING (status = 'available' OR status = 'reserved');

-- Only service role can insert/update/delete
CREATE POLICY "Service role can insert properties"
  ON properties FOR INSERT
  WITH CHECK (true);
```

**Implication**: Frontend can read properties, but only backend scripts (with service role key) can modify them.

### Saved Properties Policies

```sql
-- Users can only see/modify their own saves
CREATE POLICY "Users can view their own saved properties"
  ON saved_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved properties"
  ON saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved properties"
  ON saved_properties FOR DELETE
  USING (auth.uid() = user_id);
```

**Implication**: Users cannot see other users' saved properties.

## Data Types and Structures

### Property `specs` Object (JSONB)

Different property types have different specs:

**Houses/Apartments**:
```json
{
  "bedrooms": 3,
  "bathrooms": 2,
  "size": 150,
  "pool": true
}
```

**Investments**:
```json
{
  "bedrooms": 2,
  "bathrooms": 1,
  "size": 80,
  "roi": 8.5,           // ROI percentage
  "rentalYield": 6.2    // Annual rental yield
}
```

**Plots**:
```json
{
  "size": 500,          // Plot size in m²
  "buildable": true,    // Can you build on it?
  "zone": "residential",
  "maxBuildSqm": 200    // Maximum build size
}
```

**Critical Issue**: TypeScript interface uses camelCase (`rentalYield`), but some DB queries might use snake_case (`rental_yield`). The `getLocalizedField()` function handles both.

### Property `images` Array (JSONB)

```json
[
  "https://images.unsplash.com/photo-1...",
  "https://images.unsplash.com/photo-2...",
  "https://images.unsplash.com/photo-3..."
]
```

**Current**: Using Unsplash placeholders
**Future**: Upload to Supabase Storage, store public URLs

### Property `features` Arrays (JSONB)

**Spanish** (`features_es`):
```json
["Piscina", "Jardín", "Garaje", "Terraza"]
```

**English** (`features_en`):
```json
["Pool", "Garden", "Garage", "Terrace"]
```

**Russian** (`features_ru`):
```json
["Бассейн", "Сад", "Гараж", "Терраса"]
```

## Common Queries

### Get All Available Properties

```typescript
// lib/supabase/queries.ts
export async function getProperties() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }

  return data || [];
}
```

**Critical Issue**: Identical code exists in `server-queries.ts` - ~400 lines duplicated.

### Get Property by ID

```typescript
export async function getPropertyById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }

  return data;
}
```

### Get Properties by Type

```typescript
export async function getPropertiesByType(type: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties by type:', error);
    return [];
  }

  return data || [];
}
```

### Search Properties (Complex Filter)

```typescript
export async function searchProperties(filters: {
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minSize?: number;
  query?: string;
}) {
  const supabase = createClient();
  let queryBuilder = supabase
    .from('properties')
    .select('*')
    .eq('status', 'available');

  // Filter by type
  if (filters.type && filters.type !== 'all') {
    queryBuilder = queryBuilder.eq('type', filters.type);
  }

  // Price range
  if (filters.minPrice) {
    queryBuilder = queryBuilder.gte('price', filters.minPrice);
  }
  if (filters.maxPrice) {
    queryBuilder = queryBuilder.lte('price', filters.maxPrice);
  }

  // Text search (searches title, description, location)
  if (filters.query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${filters.query}%,` +
      `description.ilike.%${filters.query}%,` +
      `location.ilike.%${filters.query}%`
    );
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching properties:', error);
    return [];
  }

  return data || [];
}
```

**Critical Issue**: Bedrooms/bathrooms filtering done in memory (post-query) because they're inside JSONB `specs` object. Slow for large datasets.

**Better approach** (future):
```sql
WHERE (specs->>'bedrooms')::int >= 3
```

### Get Hot Properties (Most Viewed)

```typescript
export async function getHotProperties() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .order('views_count', { ascending: false })
    .limit(10);

  return data || [];
}
```

### Get New Properties (Last 2 Weeks)

```typescript
export async function getNewProperties() {
  const supabase = createClient();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .gte('created_at', twoWeeksAgo.toISOString())
    .order('created_at', { ascending: false });

  return data || [];
}
```

## Database Functions

### Increment View Count

```sql
CREATE OR REPLACE FUNCTION increment_property_views(property_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET views_count = views_count + 1
  WHERE id = property_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage**:
```typescript
await supabase.rpc('increment_property_views', { property_id_param: 'house-001' });
```

**Critical Issue**: Currently **NOT CALLED** anywhere in the codebase. Views not tracked.

### Update Saves Count (Automatic Trigger)

```sql
CREATE TRIGGER update_property_saves_count
AFTER INSERT OR DELETE ON saved_properties
FOR EACH ROW
EXECUTE FUNCTION update_saves_count();
```

**Behavior**: Automatically increments/decrements `saves_count` when users save/unsave properties.

**Critical Issue**: Trigger exists but saved_properties table not used (using localStorage instead).

## Views (Database Views)

### hot_properties

```sql
CREATE VIEW hot_properties AS
SELECT id, title, views_count
FROM properties
WHERE status = 'available'
ORDER BY views_count DESC
LIMIT 10;
```

### most_liked_properties

```sql
CREATE VIEW most_liked_properties AS
SELECT id, title, saves_count
FROM properties
WHERE status = 'available'
ORDER BY saves_count DESC
LIMIT 10;
```

### new_properties

```sql
CREATE VIEW new_properties AS
SELECT id, title, created_at
FROM properties
WHERE status = 'available'
AND created_at > NOW() - INTERVAL '14 days'
ORDER BY created_at DESC;
```

**Critical Issue**: These views exist but are **NOT USED** in the frontend. Carousels query the full table instead.

## Schema Issues and Fixes

### Issue 1: Missing Spanish Columns

**Problem**: Originally only had `title_en` and `title_ru`, no `title_es`

**Fix**: `database-schema-fixes.sql`
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_es TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS features_es JSONB DEFAULT '[]'::jsonb;
```

### Issue 2: Description Duplication

**Problem**: Upload script saved English description to both `description` and `description_en`

**Fix**: Updated `new_upload.py` to properly separate fields

### Issue 3: 68 vs 62 Properties

**Problem**: 68 properties uploaded, but only 62 showing on frontend

**Likely Cause**: 6 properties have `status != 'available'` (sold or reserved)

**Investigation Query**:
```sql
SELECT status, COUNT(*) as count
FROM properties
GROUP BY status;
```

Expected output:
```
available  | 62
sold       | 6
```

### Issue 4: Unused Columns

**Columns defined but never used**:
- `badge` - Generated dynamically in code (`getPropertyBadge()`)
- `clicks_count` - Never incremented anywhere
- `source_reference` - Populated but never displayed

**Impact**: Wastes storage, confuses developers

**Recommendation**: Remove unused columns or start using them

## Naming Convention Mismatch

**Database**: snake_case (`title_en`, `description_ru`)
**TypeScript**: camelCase (`titleEn`, `descriptionRu`)

**Solution**: `getLocalizedField()` function handles both:

```typescript
export function getLocalizedField<T>(obj: T, field: string, locale: Locale) {
  // Try camelCase first (titleEn)
  const camelKey = `${field}${locale.toUpperCase()}`;
  if (obj[camelKey]) return obj[camelKey];

  // Try snake_case (title_en)
  const snakeKey = `${field}_${locale}`;
  if (obj[snakeKey]) return obj[snakeKey];

  // Fallback chain...
}
```

**Critical**: All database columns use snake_case, but TypeScript interfaces accept both for compatibility with static data.

## Performance Considerations

### Indexes

**Good**:
- Indexes on `type`, `price`, `status`, `created_at` (fast filters)
- GIN indexes on JSONB fields (fast feature searches)

**Missing**:
- No index on `location` LIKE queries (slow text search)
- No full-text search index (slow multi-field searches)

**Future**: Add `tsvector` column for full-text search

### Query Performance

**Fast**:
- Get all properties (~62 rows): <50ms
- Get property by ID: <10ms
- Filter by type: <30ms

**Slow**:
- Text search across title/description: ~200ms (no index)
- Filter by bedrooms (JSONB query): ~150ms (requires JSON parsing)

**Future Optimization**: Extract bedrooms/bathrooms to top-level columns

## Connection Management

### Client-Side (Browser)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Usage**: Client Components (SavePropertyButton, SearchContent, etc.)

### Server-Side (Next.js)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';

export function createServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
        set: (name, value, options) => cookies().set(name, value, options),
        remove: (name) => cookies().delete(name),
      }
    }
  );
}
```

**Usage**: Server Components (app/page.tsx, app/propiedad/[id]/page.tsx, etc.)

**Critical**: Server client handles cookies for auth session. Client cannot.

## Backup and Migration

**Backup**: Supabase provides automatic daily backups (free tier: 7 days retention)

**Manual Backup**:
```bash
# Export to SQL
pg_dump -h db.xxx.supabase.co -U postgres javeareal > backup.sql

# Export to JSON
supabase db dump --json > properties.json
```

**Migration Strategy**:
1. Export current data to JSON
2. Run schema changes
3. Re-import with transformation scripts

## Next Steps

See other documentation for related topics:
- **[DATA_FLOW.md](./DATA_FLOW.md)** - How data flows from DB to UI
- **[TRANSLATION.md](./TRANSLATION.md)** - Translation system using DB fields
- **[TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)** - Database issues to fix
