# Data Flow

This document explains how data moves through the application, from database to UI and back.

## Overview

The application follows a straightforward data flow pattern:

```
Database (Supabase PostgreSQL)
    ↓
Query Functions (lib/supabase/queries.ts or server-queries.ts)
    ↓
Server/Client Components (app/*.tsx, components/*.tsx)
    ↓
Translation Layer (lib/i18n.tsx)
    ↓
UI Rendering (Browser)
```

## Data Flow by Page

### Homepage (app/page.tsx)

**Type**: Server Component
**Data Needed**: All available properties, grouped by type

**Flow**:

1. **Server Component Fetches Data**
```typescript
// app/page.tsx
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch directly from database
  const allProperties = await getProperties();

  // Group by type (done in memory)
  const houses = allProperties.filter(p => p.type === 'house' || p.type === 'apartment');
  const investments = allProperties.filter(p => p.type === 'investment');
  const plots = allProperties.filter(p => p.type === 'plot');

  return <HomeContent houses={houses} investments={investments} plots={plots} />;
}
```

2. **Query Function Executes**
```typescript
// lib/supabase/server-queries.ts
export async function getProperties() {
  const supabase = createServerClient();
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

3. **Supabase Client Queries Database**
   - Connects to PostgreSQL
   - Executes SQL: `SELECT * FROM properties WHERE status = 'available' ORDER BY created_at DESC`
   - Returns rows as JSON

4. **Data Passes to Client Component**
```typescript
// components/HomeContent.tsx
'use client';

export default function HomeContent({ houses, investments, plots }) {
  const { locale } = useLanguage();

  return (
    <>
      <PropertyCarousel title="Houses" properties={houses} />
      <PropertyCarousel title="Investments" properties={investments} />
      <PropertyCarousel title="Plots" properties={plots} />
    </>
  );
}
```

5. **Translation Layer Processes Data**
```typescript
// components/PropertyCard.tsx
const title = getPropertyTitle(property, locale);
const price = formatPrice(property.price, locale);
```

6. **UI Renders**
   - PropertyCard displays translated title, formatted price
   - User sees localized content

**Critical**: Data fetched once on server, passed down as props. No client-side fetching.

### Search Page (app/buscar/page.tsx)

**Type**: Server Component (filters applied server-side)
**Data Needed**: Filtered properties based on search params

**Flow**:

1. **URL Contains Search Params**
```
/buscar?type=house&minPrice=200000&maxPrice=500000&q=villa
```

2. **Server Component Reads Params**
```typescript
// app/buscar/page.tsx
export default async function SearchPage({ searchParams }) {
  const filters = {
    type: searchParams.type || 'all',
    minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
    query: searchParams.q || '',
  };

  const results = await searchProperties(filters);

  return <SearchContent results={results} initialFilters={filters} />;
}
```

3. **Query Function Filters Data**
```typescript
// lib/supabase/server-queries.ts
export async function searchProperties(filters) {
  const supabase = createServerClient();
  let queryBuilder = supabase
    .from('properties')
    .select('*')
    .eq('status', 'available');

  // Apply filters
  if (filters.type && filters.type !== 'all') {
    queryBuilder = queryBuilder.eq('type', filters.type);
  }

  if (filters.minPrice) {
    queryBuilder = queryBuilder.gte('price', filters.minPrice);
  }

  if (filters.maxPrice) {
    queryBuilder = queryBuilder.lte('price', filters.maxPrice);
  }

  // Text search (searches multiple fields)
  if (filters.query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,location.ilike.%${filters.query}%`
    );
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false });
  return data || [];
}
```

4. **Database Executes Filtered Query**
```sql
SELECT * FROM properties
WHERE status = 'available'
  AND type = 'house'
  AND price >= 200000
  AND price <= 500000
  AND (title ILIKE '%villa%' OR description ILIKE '%villa%' OR location ILIKE '%villa%')
ORDER BY created_at DESC
```

5. **Results Displayed in Client Component**
```typescript
// components/SearchContent.tsx
'use client';

export default function SearchContent({ results, initialFilters }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

**Critical**: Filtering happens on server (database query), not client-side JavaScript.

**Bad Practice**: Bedrooms/bathrooms filtering done in-memory because they're in JSONB `specs` object.

### Property Detail Page (app/propiedad/[id]/page.tsx)

**Type**: Server Component initially, then client-side updates
**Data Needed**: Single property + all properties (for recommendations)

**Flow**:

1. **URL Contains Property ID**
```
/propiedad/house-001
```

2. **Server Component Fetches Data**
```typescript
// app/propiedad/[id]/page.tsx
export default async function PropertyPage({ params }) {
  const { id } = params;

  // Fetch in parallel
  const [property, allProperties] = await Promise.all([
    getPropertyById(id),
    getProperties(),
  ]);

  if (!property) {
    return <div>Property not found</div>;
  }

  return <PropertyDetailContent property={property} allProperties={allProperties} />;
}
```

3. **Query Functions Execute**
```typescript
// Get single property
export async function getPropertyById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();  // Returns single object, not array

  return data || null;
}

// Get all properties (for recommendations)
export async function getProperties() {
  // Same as before
}
```

4. **Recommendation Carousels Calculated Client-Side**
```typescript
// app/propiedad/[id]/page.tsx
const getSimilarNearbyProperties = () => {
  // Filter allProperties by type and location
  // Calculate distances if coordinates exist
  // Return top 4
};

const getBiggerProperties = () => {
  // Filter by same type and larger size
  // Sort by closest bigger size
  // Return top 4
};
```

**Critical**: All properties fetched once, filtering happens in-memory. Inefficient but acceptable for <100 properties.

**Better Approach** (future):
```sql
-- Database function for similar properties
SELECT * FROM properties
WHERE type = $1
  AND id != $2
  AND ST_DWithin(coordinates, $3, 10000)  -- Within 10km
ORDER BY ST_Distance(coordinates, $3)
LIMIT 4
```

## Data Flow for User Actions

### Saving a Property

**Type**: Client-side only (localStorage)

**Flow**:

1. **User Clicks Save Button**
```typescript
// components/SavePropertyButton.tsx
const handleClick = (e) => {
  e.preventDefault();
  toggleSave(propertyId);
};
```

2. **SavedPropertiesContext Updates**
```typescript
// lib/savedProperties.tsx
const toggleSave = (propertyId: string) => {
  setSavedProperties(prev => {
    const isCurrentlySaved = prev.includes(propertyId);
    if (isCurrentlySaved) {
      // Remove
      return prev.filter(id => id !== propertyId);
    } else {
      // Add
      return [...prev, propertyId];
    }
  });
};
```

3. **localStorage Updated**
```typescript
useEffect(() => {
  localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
}, [savedProperties]);
```

4. **UI Re-renders**
   - SavePropertyButton heart fills/unfills
   - Profile page updates

**Critical**: No database interaction. Saved properties not synced across devices.

**Future**: Will use `saved_properties` table with authentication.

### Changing Language

**Type**: Client-side only (Context + localStorage)

**Flow**:

1. **User Clicks Language Button**
```typescript
// Navbar.tsx
<button onClick={() => setLocale('en')}>EN</button>
```

2. **LanguageContext Updates**
```typescript
// lib/i18n.tsx
const setLocale = (newLocale: Locale) => {
  setLocaleState(newLocale);
  localStorage.setItem('locale', newLocale);
};
```

3. **All Components Re-render**
   - `useLanguage()` hook triggers re-render
   - `translations[locale]` resolves to new language
   - `getPropertyTitle(property, locale)` returns new translation

4. **UI Updates**
   - Property titles change
   - UI text changes
   - Prices reformatted

**Critical**: Entire page re-renders. No page reload needed.

## Data Flow Patterns

### Pattern 1: Server → Client Props

Most common pattern for displaying data:

```typescript
// Server Component (app/page.tsx)
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// Client Component (components/ClientComponent.tsx)
'use client';
export default function ClientComponent({ data }) {
  const { locale } = useLanguage();
  // Process and display
}
```

**Advantages**:
- Data fetched once on server
- Fast initial render
- Automatic caching (if enabled)

**Disadvantages**:
- Can't update without page reload (unless using client-side fetching)

### Pattern 2: Client-Side Fetch (Not Currently Used)

Future pattern for dynamic updates:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getProperties } from '@/lib/supabase/queries';

export default function DynamicComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const result = await getProperties();
      setData(result);
    }
    fetchData();
  }, []);

  return <div>{/* Render data */}</div>;
}
```

**Advantages**:
- Can refresh without page reload
- Can poll for updates

**Disadvantages**:
- Slower initial render
- Extra client-side JavaScript

### Pattern 3: Optimistic Updates (Not Implemented)

Future pattern for better UX:

```typescript
const handleSave = async () => {
  // Update UI immediately
  setSaved(true);

  try {
    // Then save to server
    await saveToDB();
  } catch (error) {
    // Revert if failed
    setSaved(false);
  }
};
```

## Error Handling in Data Flow

### Current Approach

**Database Errors**:
```typescript
const { data, error } = await supabase.from('properties').select();
if (error) {
  console.error(error);
  return [];  // Return empty array, don't crash
}
return data;
```

**Missing Data**:
```typescript
if (!property) {
  return <div>Property not found</div>;
}
```

### What's Missing

- No error boundaries (app crashes on component errors)
- No retry logic
- No loading states in many components
- No user-facing error messages

**Example of Better Approach**:
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function BetterComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchData();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <div>{/* Render data */}</div>;
}
```

## Caching Strategy

### Current

**All pages**: `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`

**Effect**: No caching, always fetch fresh data from database

**Why**: Properties change frequently (prices, availability), stale data is worse than slow loads

### Future Optimization

**Static paths for properties**:
```typescript
export async function generateStaticParams() {
  const properties = await getProperties();
  return properties.map(p => ({ id: p.id }));
}

export const revalidate = 3600;  // Revalidate every hour
```

**Effect**: Property pages generated at build time, cached for 1 hour

**Trade-off**: Faster loads, but potentially stale data for up to 1 hour

## Real-Time Updates (Future)

Supabase supports real-time subscriptions:

```typescript
'use client';

useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel('properties-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'properties',
      },
      (payload) => {
        console.log('Change detected:', payload);
        // Update local state
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

**Use case**: Update property list when admin adds new listing

## Performance Considerations

### Current Performance

**Homepage**:
- ~62 properties fetched
- Single database query
- ~200-500ms server-side rendering
- ~50KB page size

**Search Page**:
- Filtered query
- ~50-200ms database query
- Results vary by filters

**Property Detail**:
- 2 parallel queries (single property + all properties)
- ~300-700ms total
- Recommendation filtering in-memory

### Bottlenecks

1. **Fetching all properties for recommendations** - Inefficient at scale
2. **In-memory filtering for bedrooms/bathrooms** - Slow JSONB queries
3. **No pagination** - Homepage loads all carousels at once
4. **No image optimization** - Using raw URLs

### Optimizations (Future)

1. **Database functions for recommendations**
```sql
CREATE FUNCTION get_similar_properties(property_id TEXT, limit_count INT)
RETURNS TABLE (...) AS $$
  -- Complex query here
$$ LANGUAGE sql;
```

2. **Pagination**
```typescript
const { data } = await supabase
  .from('properties')
  .select('*')
  .range(0, 19);  // First 20 results
```

3. **Image optimization**
```typescript
import Image from 'next/image';
<Image src={property.images[0]} width={400} height={300} alt={title} />
```

## Data Transformation

### Database to Frontend

**Database format** (snake_case):
```json
{
  "id": "house-001",
  "title": "Beautiful Villa",
  "title_en": "Beautiful Villa",
  "title_es": "Villa Hermosa",
  "title_ru": "Красивая вилла",
  "specs": {"bedrooms": 3, "bathrooms": 2}
}
```

**Frontend format** (camelCase + snake_case):
```typescript
interface Property {
  id: string;
  title: string;
  titleEn?: string;
  title_en?: string;  // Also supported
  specs: {
    bedrooms?: number;
    bathrooms?: number;
  };
}
```

**Transformation**: None needed - TypeScript interface accepts both

**Translation resolution**:
```typescript
const title = getLocalizedField(property, 'title', 'es');
// Checks: titleEs → title_es → titleEn → title_en → title
```

## Summary

**Data Flow Characteristics**:
- Server-first: Most data fetched on server
- Prop drilling: Data passed from server → client components
- No global state: Each page fetches own data
- localStorage for user preferences: Language, saved properties
- Force-dynamic rendering: No caching for fresh data

**Strengths**:
- Simple and predictable
- Server-side filtering (fast)
- TypeScript safety

**Weaknesses**:
- No real-time updates
- Inefficient recommendation queries
- No pagination
- Saved properties not synced

## Next Steps

See other documentation:
- **[DATABASE.md](./DATABASE.md)** - Query functions and schema
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Server vs Client Components
- **[TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)** - Data flow improvements
