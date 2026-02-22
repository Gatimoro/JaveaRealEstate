# Architecture Overview

**Last Updated:** 2026-02-22
**Stack:** Next.js 14 (App Router), Supabase (PostgreSQL), TypeScript, Tailwind CSS, Vercel

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 — App Router, Server Components, ISR |
| Database | Supabase — PostgreSQL with RLS, materialized views |
| Auth | Supabase Auth (OAuth + magic link) |
| Styling | Tailwind CSS (dark mode, custom theme) |
| Icons | Lucide React |
| Deployment | Vercel (edge network, ISR) |

---

## Folder Structure

```
app/
  page.tsx                              # Homepage (ISR: 5min)
  layout.tsx                            # Root layout + metadata
  sitemap.ts                            # Dynamic sitemap generation
  robots.ts                             # Robots.txt
  [region]/[province]/[municipality]/
    [category]/[slug]/
      page.tsx                          # SEO property detail (ISR)
      PropertyDetailClient.tsx          # Client interactivity
  propiedad/[id]/page.tsx               # Legacy property detail fallback
  categoria/
    venta/page.tsx                      # Sale listings (ISR: 5min)
    alquiler/page.tsx                   # Rent listings (ISR: 5min)
    obra-nueva/page.tsx                 # New buildings (ISR: 5min)
  buscar/page.tsx                       # Search (force-dynamic)
  profile/page.tsx                      # User profile (client)
  auth/callback/page.tsx                # Supabase auth callback
  api/
    revalidate/route.ts                 # Cache invalidation + view refresh
    track-view/route.ts                 # Property view tracking (beacon)

components/
  CategoryNav.tsx                       # Top navigation + mobile menu
  CategoryPage.tsx                      # Listing page (filters, sort, pagination)
  HomePageContent.tsx                   # All homepage sections (client)
  PropertyCarousel.tsx                  # Horizontal scroll carousel
  PropertyCard.tsx                      # House/apartment card
  InvestmentCard.tsx                    # Commerce property card
  PlotCard.tsx                          # Land plot card
  SavePropertyButton.tsx               # Favourite toggle (localStorage + DB)
  SearchContent.tsx                     # Search page content + filters
  ListingStatistics.tsx                 # Market stats display
  Footer.tsx                            # Multilingual footer
  StructuredData.tsx                    # JSON-LD schema components

lib/
  i18n.tsx                              # Language context + translation helpers
  seo.ts                                # SEO utilities (getPropertyHref, metadata)
  utils.ts                              # formatPrice, slugify, cn(), etc.
  savedProperties.tsx                   # Saved properties context (localStorage)
  types.ts                              # Shared types (PaginatedResult, filters)
  supabase/
    client.ts                           # Browser Supabase client
    server.ts                           # Server Supabase client (cookies)
    queries.ts                          # Client-side DB queries (JS SDK)
    server-queries.ts                   # Server-side DB queries (fetch + ISR)

data/
  properties.ts                         # Property interface + static fallback data

scripts/
  SCRAPER_FIELD_GUIDE.md                # Scraper upload format reference
```

---

## Property Type System

Two orthogonal fields — **never use the old `type` field** (removed):

| Field | Values | Meaning |
|-------|--------|---------|
| `listing_type` | `sale` \| `rent` \| `new-building` | Transaction type |
| `sub_category` | `apartment` \| `house` \| `commerce` \| `plot` | Property kind |

UI labels map to DB values:
- "Inversiones" → `sub_category = 'commerce'`
- "Parcelas" → `sub_category = 'plot'`

---

## SEO URL Architecture

All property links use locality-based URLs:

```
/{region}/{province}/{municipality}/{category}/{slug}
```

**Examples:**
```
/comunidad-valenciana/alicante/javea/venta/villa-luminosa-idealista-12345
/comunidad-valenciana/valencia/valencia/alquiler/piso-centro-idealista-67890
```

**Generation:** `getPropertyHref(property)` in `lib/seo.ts`
- Falls back to `/propiedad/{id}` when region/province/municipality are missing
- Slug format: `{title-slug}-{property-id}` (ID extracted via `.split('-').pop()`)

**Route:** `app/[region]/[province]/[municipality]/[category]/[slug]/page.tsx`

---

## Rendering Strategy

| Page | Strategy | Revalidate | Why |
|------|----------|------------|-----|
| Homepage | ISR | 5 min | Fresh featured properties on CDN |
| Category pages | ISR | 5 min | Pagination + filters cacheable per URL |
| SEO property detail | ISR | on-demand | Metadata + structured data per property |
| Legacy `/propiedad/[id]` | ISR | 5 min | Backward compatibility |
| Search `/buscar` | force-dynamic | — | Real-time URL-param filtering |
| Profile | Client Component | — | Requires localStorage/auth |

**ISR invalidation:** POST to `/api/revalidate` with `x-revalidate-secret` header.
The route calls `revalidatePath` for all category pages + homepage, then calls
`refresh_card_properties()` in Supabase to rebuild the materialized view.

---

## Data Fetching

### Two Query Libraries

**`lib/supabase/server-queries.ts`** — For Server Components (ISR-aware)
- Uses native `fetch` with `next: { revalidate }` caching tags
- Called from `app/page.tsx`, category pages, property detail pages

**`lib/supabase/queries.ts`** — For Client Components
- Uses `@supabase/supabase-js` SDK
- Called from `app/buscar/page.tsx` (`getPropertiesPaginated`), profile page

### Pagination

`getPropertiesPaginated()` in `lib/supabase/queries.ts`:
- Reads filters from URL search params
- Supabase `.range()` for offset pagination
- Returns `{ data, pagination: { page, totalPages, totalCount, ... } }`
- Bedroom filter: `gte('specs->>bedrooms', String(n))` (text extraction, works for 1-9)

---

## Translation System

**Two patterns in use:**

**Pattern A — `lib/i18n.tsx` (shared cross-component strings):**
- `PropertyCard` badge labels, carousel "Explorar todos"
- Add keys here only when shared across 2+ components

**Pattern B — Inline objects (page/component-specific):**
- Each component defines `const translations = { es: {...}, en: {...}, ru: {...} }`
- Used by all pages, `CategoryNav`, `Footer`, `HomePageContent`, etc.
- Preferred — avoids coupling to global translation file

**Property translations:**
- Base `properties.title` = English (from scraper)
- `translations` table stores EN/RU override rows
- `getPropertyById` joins translations and flattens into `title_en`, `description_en`, etc.
- Only snake_case fields: `title_en`, `title_ru`, `description_en`, `description_ru`, `features_en`, `features_ru`

---

## Analytics & View Tracking

**`property_analytics` table** — append-only event log (`view`, `save`, `unsave`)

**View tracking flow:**
1. Property detail page mounts → `navigator.sendBeacon('/api/track-view', ...)` (fire-and-forget)
2. `/api/track-view` calls `record_property_view(property_id, user_id, session_id)` DB function
3. Dedup: 1 view per user/session per property per day
4. Increments `properties.views_count` on new unique view

**saves_count:** Kept accurate by `trg_sync_saves_count` trigger on `saved_properties` table.

---

## Authentication

**Provider:** Supabase Auth (OAuth via Google, magic link)

**Flow:**
```
User clicks Sign In → Supabase Auth UI → credentials →
/auth/callback → exchange code for session → session stored in cookies
```

**Protected resources:** `saved_properties` table (RLS: users manage own rows)
**Saved properties:** Also mirrored in localStorage for instant UI response

---

## Styling

**Theme:** Dark mode with orange accents (`primary: #f97316`)

**Key CSS classes** (defined in `app/globals.css`):
- `.gradient-text` — Orange gradient fill
- `.hover-glow` — Orange glow on hover
- `.scrollbar-hidden` — Hides scrollbar for carousel
- `.snap-x` — Horizontal scroll snapping for carousels

---

## Environment Variables

```env
# Required — public
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Required — server-only
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # For /api/revalidate RPC calls
REVALIDATE_SECRET=your-secret          # For /api/revalidate auth

# Optional
NEXT_PUBLIC_SITE_URL=https://miraluna.es
```

---

## Build & Deployment

```bash
npm run build   # Production build
npm run dev     # Development (localhost:3000)
```

**Deployment:** Vercel — automatic builds on `git push main`.

**After bulk data upload:**
1. Run `SELECT refresh_card_properties();` in Supabase SQL editor
2. POST to `/api/revalidate` with secret to flush ISR cache

---

## Component Hierarchy

```
app/layout.tsx
└── Providers (LanguageProvider + SavedPropertiesProvider)
    ├── CategoryNav (mobile menu, language switcher, auth)
    ├── [Page Content]
    │   ├── Homepage → HomePageContent
    │   │   ├── PropertyCarousel (sale, rent, new-building)
    │   │   │   └── PropertyCard / InvestmentCard / PlotCard
    │   │   └── ListingStatistics
    │   ├── Category pages → CategoryPage
    │   │   └── PropertyCard / InvestmentCard / PlotCard (paginated)
    │   ├── Search → SearchContent (with filter sidebar)
    │   │   └── PropertyCard / InvestmentCard / PlotCard (paginated)
    │   ├── Property detail → PropertyDetailClient
    │   │   └── PropertyCarousel (similar properties)
    │   └── Profile → saved properties grid
    └── Footer
```
