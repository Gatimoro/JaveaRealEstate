# Technical Debt and Known Issues

This document catalogs all known issues, bad practices, code redundancy, and opportunities for improvement. Items are prioritized by impact and effort.

## Critical Issues (High Impact)

### 1. Duplicate Query Logic (~400 Lines)

**Location**: `lib/supabase/queries.ts` and `lib/supabase/server-queries.ts`

**Problem**: Both files contain identical query logic, just using different Supabase clients.

**Functions Duplicated**:
- `getProperties()`
- `getPropertyById()`
- `getPropertiesByType()`
- `getHotProperties()`
- `getNewProperties()`
- `getMostLikedProperties()`
- `searchPropertiesByPrice()`
- `getPropertyBadges()`

**Example**:
```typescript
// queries.ts (client-side)
export async function getProperties() {
  const supabase = createClient();  // Client
  const { data, error } = await supabase.from('properties')...
  return data || [];
}

// server-queries.ts (server-side)
export async function getProperties() {
  const supabase = createServerClient();  // Server
  const { data, error } = await supabase.from('properties')...
  return data || [];
}
```

**Impact**:
- ~400 lines of duplicated code
- Bug fixes must be applied in two places
- Inconsistency risk (implementations can diverge)

**Solution Options**:

**Option A: Unified Functions with Client Parameter**
```typescript
// lib/supabase/queries.ts
export async function getProperties(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available');
  return data || [];
}

// Usage:
// Client: getProperties(createClient())
// Server: getProperties(createServerClient())
```

**Option B: Query Builder Abstraction**
```typescript
// lib/supabase/query-builders.ts
export const propertyQueries = {
  all: () => ({ table: 'properties', filters: { status: 'available' } }),
  byType: (type) => ({ table: 'properties', filters: { type, status: 'available' } }),
};

// Execute with either client
```

**Effort**: 2-3 hours
**Priority**: High
**Risk**: Medium (requires careful testing)

### 2. Card Component Duplication (~220 Lines)

**Location**: `components/PropertyCard.tsx`, `components/InvestmentCard.tsx`, `components/PlotCard.tsx`

**Problem**: Three card components with 95% identical code.

**Identical Sections**:
- Image section (lines 21-35 in each)
- Price display (lines 40-42 in each)
- Title display (line 45 in each)
- Location display (lines 48-51 in each)
- Link wrapper and base styling

**Only Differences**:
- PropertyCard: Shows bedrooms, bathrooms, size
- InvestmentCard: Shows bedrooms, bathrooms, size + ROI badge
- PlotCard: Shows size, buildable status, zone

**Impact**:
- ~220 lines of duplicated code
- Style changes require updating 3 files
- New features must be added to all 3

**Solution**: Create `BasePropertyCard` component

```typescript
// components/BasePropertyCard.tsx
interface BasePropertyCardProps {
  property: Property;
  renderSpecs: (property: Property) => React.ReactNode;
  extraBadges?: React.ReactNode;
}

export default function BasePropertyCard({
  property,
  renderSpecs,
  extraBadges
}: BasePropertyCardProps) {
  const { locale } = useLanguage();
  const title = getPropertyTitle(property, locale);

  return (
    <Link href={`/propiedad/${property.id}`} className="...">
      {/* Shared image, price, title, location */}
      <div className="image-section">
        <img src={property.images[0]} alt={title} />
        <SavePropertyButton propertyId={property.id} />
        {extraBadges}
      </div>

      <div className="content-section">
        <div className="price">{formatPrice(property.price, locale)}</div>
        <h3>{title}</h3>
        <div className="location">{property.location}</div>
        {renderSpecs(property)}
      </div>
    </Link>
  );
}

// Then PropertyCard becomes:
export default function PropertyCard({ property }) {
  return (
    <BasePropertyCard
      property={property}
      renderSpecs={(p) => (
        <div className="specs">
          {p.specs.bedrooms && <span>{p.specs.bedrooms} beds</span>}
          {p.specs.bathrooms && <span>{p.specs.bathrooms} baths</span>}
          <span>{p.specs.size}m²</span>
        </div>
      )}
    />
  );
}
```

**Effort**: 3-4 hours (including testing)
**Priority**: Medium
**Risk**: Low (UI change only)

### 3. No Error Boundaries

**Problem**: If any component throws an error, the entire page crashes.

**Example**:
```typescript
// If this fails, entire app crashes
const price = formatPrice(property.price, locale);  // Uncaught error if property.price is undefined
```

**Impact**:
- Poor user experience
- No graceful degradation
- Hard to debug production issues

**Solution**: Add error boundaries

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component } from 'react';

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-state">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in layout.tsx
<ErrorBoundary fallback={<ErrorPage />}>
  {children}
</ErrorBoundary>
```

**Effort**: 1-2 hours
**Priority**: High
**Risk**: Low

## Database Issues

### 4. Unused Columns

**Problem**: Several columns defined but never used.

**Unused Columns**:

**`badge` (TEXT)**
- Stored in database but never read
- Badges generated dynamically in code
- Wastes storage

**`clicks_count` (INTEGER)**
- Column exists with default 0
- Never incremented anywhere
- Increment function exists but not called

**`source_reference` (TEXT)**
- Populated by upload script
- Never displayed in UI
- Useful for debugging but could be in separate table

**Impact**:
- Wasted storage (~3 columns × 62 properties)
- Developer confusion ("should I use this?")
- Schema clutter

**Solution**:

**Option A: Remove Unused Columns**
```sql
ALTER TABLE properties DROP COLUMN badge;
ALTER TABLE properties DROP COLUMN clicks_count;
```

**Option B: Start Using Them**
```typescript
// Track clicks
await supabase.rpc('increment_property_clicks', { property_id_param: id });

// Show source reference
<a href={property.source_url}>
  Source: {property.source_reference}
</a>
```

**Effort**: 30 minutes (removal) or 2 hours (implementation)
**Priority**: Low
**Risk**: Low (removal), Medium (implementation)

### 5. JSONB Specs Column

**Problem**: Property specifications stored as JSONB, making queries slow.

**Current**:
```sql
specs JSONB  -- {"bedrooms": 3, "bathrooms": 2, "size": 150}
```

**Impact**:
- Can't filter by bedrooms/bathrooms efficiently
- Requires JSON parsing on every query
- No database-level validation

**Query Performance**:
```sql
-- Slow (JSONB parsing)
SELECT * FROM properties WHERE (specs->>'bedrooms')::int >= 3;

-- Would be fast (indexed column)
SELECT * FROM properties WHERE bedrooms >= 3;
```

**Solution**: Extract common fields to top-level columns

```sql
ALTER TABLE properties
ADD COLUMN bedrooms INTEGER,
ADD COLUMN bathrooms INTEGER,
ADD COLUMN size_sqm INTEGER,
ADD COLUMN roi_percentage DECIMAL(5,2);

CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_size ON properties(size_sqm);
```

**Migration**:
```sql
UPDATE properties
SET
  bedrooms = (specs->>'bedrooms')::integer,
  bathrooms = (specs->>'bathrooms')::integer,
  size_sqm = (specs->>'size')::integer,
  roi_percentage = (specs->>'roi')::decimal;
```

**Effort**: 2-3 hours (schema change + code updates)
**Priority**: Medium
**Risk**: Medium (requires data migration)

### 6. Missing Spanish Columns (Fixed)

**Status**: FIXED

**Problem**: Database was missing `title_es`, `description_es`, `features_es`

**Solution Applied**: Ran `database-schema-fixes.sql`

**Lessons Learned**:
- Always add all language columns upfront
- Document schema changes
- Test upload scripts with all languages

### 7. Database Views Not Used

**Problem**: Created database views (`hot_properties`, `most_liked_properties`, `new_properties`) but never queried.

**Created Views**:
```sql
CREATE VIEW hot_properties AS
SELECT id, title, views_count
FROM properties
WHERE status = 'available'
ORDER BY views_count DESC
LIMIT 10;
```

**Current Code**: Queries full table and sorts in-memory

**Impact**:
- Views waste database resources
- Code misses performance optimization opportunity

**Solution**:

**Option A: Remove Views**
```sql
DROP VIEW hot_properties;
DROP VIEW most_liked_properties;
DROP VIEW new_properties;
```

**Option B: Use Views**
```typescript
const { data } = await supabase.from('hot_properties').select('*');
```

**Effort**: 15 minutes (either option)
**Priority**: Low
**Risk**: Very low

## Frontend Issues

### 8. No Image Optimization

**Problem**: Using raw `<img>` tags instead of Next.js `<Image>` component.

**Current**:
```typescript
<img src={property.images[0]} alt={title} className="..." />
```

**Impact**:
- Large image files (1-2 MB each)
- No responsive images
- No lazy loading
- No automatic WebP conversion

**Solution**: Use Next.js Image component

```typescript
import Image from 'next/image';

<Image
  src={property.images[0]}
  alt={title}
  width={400}
  height={300}
  className="..."
  loading="lazy"
/>
```

**Requires**: Configure `next.config.js` for external images

```javascript
module.exports = {
  images: {
    domains: ['images.unsplash.com', 'your-supabase-storage.co'],
  },
};
```

**Effort**: 2-3 hours (update all image uses + config)
**Priority**: Medium
**Risk**: Low

### 9. No Loading States

**Problem**: Many components don't show loading indicators.

**Example**:
```typescript
// PropertyDetailPage - immediately shows content or "not found"
// No "Loading..." state while fetching
```

**Impact**:
- Users see blank page briefly
- Poor perceived performance

**Solution**: Add loading states

```typescript
// Using Suspense (Server Components)
import { Suspense } from 'react';

<Suspense fallback={<PropertySkeleton />}>
  <PropertyContent />
</Suspense>

// Or loading.tsx file
// app/propiedad/[id]/loading.tsx
export default function Loading() {
  return <PropertySkeleton />;
}
```

**Effort**: 1-2 hours
**Priority**: Medium
**Risk**: Low

### 10. Inefficient Recommendation Queries

**Problem**: Fetching all properties to calculate recommendations.

**Current**:
```typescript
// app/propiedad/[id]/page.tsx
const allProperties = await getProperties();  // Fetch all 62 properties

// Then filter in-memory
const similar = allProperties.filter(p => {
  // Distance calculations, type matching, etc.
});
```

**Impact**:
- Fetches unnecessary data (59 properties to show 4)
- Slow at scale (1000+ properties)
- Wasted bandwidth

**Solution**: Database functions or smarter queries

```typescript
// Create database function
CREATE FUNCTION get_similar_properties(
  property_id TEXT,
  property_type TEXT,
  limit_count INT
) RETURNS SETOF properties AS $$
  SELECT * FROM properties
  WHERE id != property_id
    AND type = property_type
    AND status = 'available'
  ORDER BY created_at DESC
  LIMIT limit_count;
$$ LANGUAGE sql;

// Call from frontend
const similar = await supabase.rpc('get_similar_properties', {
  property_id: id,
  property_type: property.type,
  limit_count: 4
});
```

**Effort**: 3-4 hours (create functions + update code)
**Priority**: Low (acceptable for MVP, critical at scale)
**Risk**: Medium

## Translation Issues

### 11. English Title Bug (Fixed)

**Status**: FIXED

**Problem**: English titles showed as generic "House" instead of actual titles.

**Root Cause**: `getPropertyTitle()` had comparison `translatedTitle !== property.title` which failed for English because both were identical.

**Solution Applied**: Removed faulty comparison

See commit: "Fix English titles showing as generic 'House' instead of actual titles"

### 12. Naming Convention Mismatch

**Problem**: Database uses snake_case, TypeScript uses camelCase.

**Examples**:
- Database: `title_en`, `description_ru`
- TypeScript: `titleEn`, `descriptionRu`

**Current Solution**: Support both in interface and utility functions

**Impact**:
- Developer confusion
- Verbose type definitions
- `getLocalizedField()` must check both formats

**Better Solution**: Standardize on one convention

**Option A: All snake_case**
```typescript
interface Property {
  id: string;
  title: string;
  title_en?: string;
  title_es?: string;
  title_ru?: string;
  // ...
}
```

**Option B: Transform on fetch**
```typescript
function transformProperty(dbProperty) {
  return {
    ...dbProperty,
    titleEn: dbProperty.title_en,
    titleEs: dbProperty.title_es,
    titleRu: dbProperty.title_ru,
    // ... transform all fields
  };
}
```

**Effort**: 4-5 hours (breaking change, update all code)
**Priority**: Low
**Risk**: High (breaking change)

## Code Quality Issues

### 13. Hardcoded Values

**Problem**: Magic numbers and strings scattered throughout code.

**Examples**:
```typescript
// Recommendation carousel distance
if (distance <= 10) // 10 km hardcoded

// Cheaper properties limit
const candidates = cheaper.slice(0, 8); // Why 8?

// Pagination
const itemsPerPage = 40; // Hardcoded in component
```

**Solution**: Use constants file

```typescript
// lib/constants.ts
export const RECOMMENDATIONS = {
  NEARBY_RADIUS_KM: 10,
  CHEAPER_CANDIDATES: 8,
  MAX_RESULTS: 4,
};

export const PAGINATION = {
  ITEMS_PER_PAGE_DESKTOP: 40,
  ITEMS_PER_PAGE_MOBILE: 20,
};

// Usage
if (distance <= RECOMMENDATIONS.NEARBY_RADIUS_KM)
```

**Effort**: 1-2 hours
**Priority**: Low
**Risk**: Very low

### 14. Inconsistent Error Handling

**Problem**: Some functions return empty arrays, others return null, some throw.

**Examples**:
```typescript
// Returns empty array
export async function getProperties() {
  if (error) return [];
}

// Returns null
export async function getPropertyById(id) {
  if (error) return null;
}

// Might throw (no try-catch)
const property = await getPropertyById(id);
```

**Impact**:
- Developers must remember which pattern each function uses
- Inconsistent null checks in components

**Solution**: Standardize on Result type

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getProperties(): Promise<Result<Property[]>> {
  const { data, error } = await supabase...
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// Usage
const result = await getProperties();
if (!result.success) {
  console.error(result.error);
  return;
}
const properties = result.data;
```

**Effort**: 3-4 hours (update all query functions)
**Priority**: Low
**Risk**: Medium (changes function signatures)

### 15. No TypeScript Strict Null Checks (In Some Places)

**Problem**: Some code doesn't properly handle undefined/null.

**Examples**:
```typescript
// Assumes specs always exists
property.specs.bedrooms  // Could be undefined

// Assumes images array has items
property.images[0]  // Could be undefined
```

**Solution**: Add proper checks

```typescript
// Safe access
property.specs?.bedrooms
property.images?.[0]

// Or with defaults
const bedrooms = property.specs?.bedrooms ?? 0;
const firstImage = property.images?.[0] ?? '/placeholder.jpg';
```

**Effort**: 2-3 hours (audit all code)
**Priority**: Medium
**Risk**: Low

## Performance Issues

### 16. No Pagination

**Problem**: Homepage loads all properties at once.

**Current**:
```typescript
const allProperties = await getProperties();  // All 62
```

**Impact**:
- Slow initial load (all images, all data)
- Wasted bandwidth
- Will not scale to 1000+ properties

**Solution**: Implement pagination

```typescript
// Database query with pagination
const { data } = await supabase
  .from('properties')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1);

// Or infinite scroll
<InfiniteScroll
  loadMore={fetchNextPage}
  hasMore={hasMore}
  loader={<Spinner />}
>
  {properties.map(...)}
</InfiniteScroll>
```

**Effort**: 3-4 hours
**Priority**: Low (critical at scale)
**Risk**: Medium

### 17. No Memoization

**Problem**: Expensive calculations re-run on every render.

**Example**:
```typescript
// Recalculates distances on every render
const similarProperties = getSimilarNearbyProperties();
```

**Solution**: Use React useMemo

```typescript
const similarProperties = useMemo(() => {
  return getSimilarNearbyProperties();
}, [property.id, allProperties]);
```

**Effort**: 1 hour
**Priority**: Low
**Risk**: Very low

## Security Issues

### 18. No Rate Limiting

**Problem**: No protection against abuse.

**Impact**:
- Database could be overloaded by bot
- Scraping/data extraction easy

**Solution**: Add rate limiting

**Option A: Supabase Edge Functions**
```typescript
// Apply rate limit at API level
if (requests > 100) {
  return new Response('Too many requests', { status: 429 });
}
```

**Option B: Client-side (weak)**
```typescript
// Debounce search queries
const debouncedSearch = debounce(search, 300);
```

**Effort**: 2-3 hours
**Priority**: Medium
**Risk**: Low

### 19. No Input Validation

**Problem**: Search queries not sanitized.

**Current**:
```typescript
const query = searchParams.q;  // Could be malicious
queryBuilder.ilike(`%${query}%`);  // SQL injection risk (low with Supabase)
```

**Impact**:
- Potential SQL injection (mitigated by Supabase parameterization)
- XSS if displayed unsanitized

**Solution**: Validate and sanitize

```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedQuery = DOMPurify.sanitize(searchParams.q || '');
```

**Effort**: 1-2 hours
**Priority**: Medium
**Risk**: Low

## Missing Features (Technical Debt from MVP)

### 20. Saved Properties in localStorage

**Problem**: Saved properties stored in localStorage, not database.

**Impact**:
- Not synced across devices
- Lost if localStorage cleared
- Can't analyze user preferences

**Solution**: Migrate to `saved_properties` table

**Requires**:
1. Authentication implementation
2. Database table setup (already exists)
3. Migration of localStorage data

**Effort**: 4-5 hours
**Priority**: Medium
**Risk**: Medium

### 21. No Admin Dashboard

**Problem**: No way to manage properties without SQL.

**Impact**:
- Can't add/edit/delete properties easily
- Non-technical users blocked

**Solution**: Create admin dashboard

**Features Needed**:
- Property CRUD interface
- Image upload
- Translation management
- Analytics view

**Effort**: 20-30 hours (full dashboard)
**Priority**: Low (can use Supabase dashboard for now)
**Risk**: Low

## Summary

### Quick Wins (High Impact, Low Effort)

1. **Add Error Boundaries** - 1-2 hours, prevents crashes
2. **Create Constants File** - 1 hour, improves maintainability
3. **Remove Unused Views** - 15 minutes, cleans schema
4. **Add Loading States** - 1-2 hours, better UX

### High Priority (Should Fix Soon)

1. **Duplicate Query Logic** - 2-3 hours, reduces ~400 lines
2. **No Error Boundaries** - 1-2 hours, critical for stability
3. **Unused Database Columns** - 30 minutes, reduces confusion

### Medium Priority (Fix Before Scale)

1. **Card Component Duplication** - 3-4 hours, reduces ~220 lines
2. **JSONB Specs Column** - 2-3 hours, improves query performance
3. **No Image Optimization** - 2-3 hours, improves page speed
4. **Inefficient Recommendations** - 3-4 hours, critical at scale

### Low Priority (Nice to Have)

1. **Naming Convention Mismatch** - 4-5 hours, breaking change
2. **Database Views Not Used** - 15 minutes, minor optimization
3. **No Pagination** - 3-4 hours, needed at scale
4. **No Admin Dashboard** - 20-30 hours, convenience feature

## Tracking Technical Debt

**New issues**: Add to this document with priority and effort estimate

**Fixed issues**: Update status to "FIXED" and document solution

**Process**:
1. Identify issue
2. Document in this file
3. Estimate effort and priority
4. Create GitHub issue (if using)
5. Fix when appropriate
6. Update this document

## Related Documentation

- **[CODE_REDUNDANCY_REPORT.md](../CODE_REDUNDANCY_REPORT.md)** - Detailed redundancy analysis
- **[DATABASE.md](./DATABASE.md)** - Database schema issues
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architectural decisions
- **[COMPONENTS.md](./COMPONENTS.md)** - Component improvements
