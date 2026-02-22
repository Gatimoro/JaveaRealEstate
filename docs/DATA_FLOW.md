# Data Flow

**Last Updated:** 2026-02-22

Explains how data moves through the application — from database to UI and back.

---

## Overview

```
Supabase PostgreSQL
    ↓
lib/supabase/server-queries.ts   (ISR-cached fetch)
lib/supabase/queries.ts          (JS SDK, client-side)
    ↓
Server/Client Components (app/*.tsx, components/*.tsx)
    ↓
Translation Layer (lib/i18n.tsx)
    ↓
UI (Browser)
```

---

## Homepage (`app/page.tsx`)

**Strategy:** ISR, 5-minute revalidation

```typescript
export const revalidate = 300;

export default async function HomePage() {
  // ISR-cached fetch — served from CDN after first build
  const [saleProps, rentProps, newProps, counts] = await Promise.all([
    getFeaturedPropertiesForCards('sale', 6),
    getFeaturedPropertiesForCards('rent', 6),
    getFeaturedPropertiesForCards('new-building', 6),
    getPropertyCounts(),
  ]);

  return <HomePageContent saleProperties={saleProps} rentProperties={rentProps} ... />;
}
```

`getFeaturedPropertiesForCards` queries `card_properties` (materialized view) and returns
a minimal `PropertyCard` type with `id, title, price, images, specs, listing_type, ...`.

---

## Category Pages (`app/categoria/*/page.tsx`)

**Strategy:** ISR, 5-minute revalidation. Each unique URL (`?page=2`, `?type=apartment`) is a
separate cache entry. Filter changes navigate to a new URL → new ISR cache entry.

```typescript
export const revalidate = 300;

export default async function VentaPage({ searchParams }) {
  const result = await getPropertiesPaginated({
    page: parseInt(searchParams.page || '1'),
    pageSize: ITEMS_PER_PAGE,
    filters: {
      listingType: 'sale',
      subCategory: searchParams.type,
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
      // ...
    },
    sortBy: searchParams.sortBy || 'newest',
  });

  return <CategoryPage properties={result.data} pagination={result.pagination} ... />;
}
```

---

## Search Page (`app/buscar/page.tsx`)

**Strategy:** `force-dynamic` — always server-rendered with fresh URL params.

```typescript
export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }) {
  const result = await getPropertiesPaginated({
    filters: {
      search: searchParams.q,
      subCategory: searchParams.type,
      minPrice: ..., maxPrice: ..., minBedrooms: ...,
    },
    sortBy: ...,
    page: ...,
  });

  return <SearchContent properties={result.data} pagination={result.pagination} />;
}
```

---

## Property Detail (`app/[region]/[province]/[municipality]/[category]/[slug]/page.tsx`)

**Strategy:** ISR, revalidated on demand via `/api/revalidate`.

1. Extract `id` from slug: `params.slug.split('-').pop()`
2. Fetch property with translations: `getPropertyById(id)` — joins `translations` table,
   flattens into `title_en`, `description_en`, `features_en` snake_case fields
3. Fetch similar properties from same municipality
4. Fire view tracking beacon (non-blocking)

```typescript
// View tracking — fire-and-forget, never blocks rendering
useEffect(() => {
  navigator.sendBeacon('/api/track-view', JSON.stringify({
    propertyId: property.id,
    sessionId: localStorage.getItem('vid') || generateVid(),
  }));
}, []);
```

---

## Pagination Data Flow

```
User visits /categoria/venta?minPrice=200000&page=2
    ↓
Server Component reads searchParams
    ↓
getPropertiesPaginated({ filters: { minPrice: 200000 }, page: 2 })
    ↓
Supabase query: SELECT * FROM card_properties
  WHERE listing_type = 'sale' AND price >= 200000
  ORDER BY created_at DESC
  LIMIT 24 OFFSET 24
    ↓
Returns { data: Property[], pagination: { page: 2, totalPages: 12, ... } }
    ↓
CategoryPage renders grid + pagination controls
    ↓
User clicks page 3 → router.push('?...&page=3') → ISR serves cached or rebuilds
```

---

## User Actions

### Saving a Property

1. `SavePropertyButton` calls `toggleSave(propertyId)` from `useSavedProperties()`
2. `saved_properties` table updated (INSERT or DELETE) via Supabase JS SDK
3. `trg_sync_saves_count` trigger fires → `saves_count` updated on `properties` row
4. `savedProperties` array in localStorage also updated for instant UI response

### View Tracking

1. Property detail page mounts → `navigator.sendBeacon('/api/track-view', ...)`
2. `/api/track-view` calls `record_property_view(property_id, user_id, session_id)` RPC
3. DB checks for duplicate (same user/session, same property, same day)
4. If new: inserts `property_analytics` row + increments `properties.views_count`

### Language Change

1. User clicks language button → `setLocale('en')` from `useLanguage()`
2. `LanguageContext` updates → localStorage updated
3. All components re-render with new locale
4. `getPropertyTitle(property, locale)` checks `title_en` / `title_ru` fields
5. `formatPrice(price, locale)` reformats currency for locale

---

## Translation Data Flow

**DB property (English from scraper):**
```json
{ "title": "Bright apartment in city center", "title_ru": "Светлая квартира...", "title_en": null }
```
(EN title matches base title, so no EN row in translations table is needed)

**`getPropertyById` joins translations:**
```typescript
// Flattens translations array into snake_case fields on the property object
for (const t of property.translations) {
  property[`title_${t.locale}`] = t.title;
  property[`description_${t.locale}`] = t.description;
}
```

**`getPropertyTitle(property, locale)` resolves:**
```
locale = 'ru' → property.title_ru → property.title (fallback)
locale = 'en' → property.title_en → property.title (fallback)
locale = 'es' → property.title
```

---

## Cache Invalidation Flow

```
Scraper uploads new properties
    ↓
SELECT refresh_card_properties(); (Supabase SQL)
    ↓
POST /api/revalidate { x-revalidate-secret }
    ↓
revalidatePath('/'), revalidatePath('/categoria/venta'), ...
    ↓
Next request to those pages → ISR rebuilds in background
    ↓
CDN serves fresh HTML to all users
```

---

## Error Handling

- **DB errors** → return `[]` or `null`, show empty state / "not found"
- **Missing property** → redirect or show 404 page
- **View tracking failure** → silently swallowed (sendBeacon is fire-and-forget)
- **Fallback data** → `data/properties.ts` static array used if Supabase is unreachable
