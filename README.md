# Miraluna Valencia - Real Estate Platform

A high-performance, multilingual real estate aggregator for Valencia and Spain.

**Live:** [miralunavalencia.com](https://miralunavalencia.com)
**Stack:** Next.js 14, Supabase, TypeScript, Tailwind CSS

---

## Features

### Implemented

- **Multi-language Support** (ES/EN/RU) - Full i18n with language selector
- **Server-Side Pagination** - 24 items/page with URL state
- **Search & Filters** - Full-text search, price range, bedrooms, property type
- **Sort Options** - Price, date, size (ascending/descending)
- **Category Navigation** - Sale, Rent, New Buildings with subcategories
- **ISR Caching** - Homepage 24h, category pages 5min
- **Image Optimization** - WebP conversion, lazy loading
- **SEO Ready** - Metadata, sitemap.xml, robots.txt, JSON-LD
- **Mobile-First Design** - Responsive across all devices
- **Dark Mode Support** - System preference detection

### Performance

| Metric | Target | Actual |
|--------|--------|--------|
| First Contentful Paint | <1s | 50-200ms |
| Time to Interactive | <3s | 500ms |
| Homepage payload | <30KB | 20KB |
| Lighthouse Score | 90+ | 95+ |

---

## Quick Start

```bash
# Install
npm install

# Development
npm run dev

# Production build
npm run build && npm start
```

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Project Structure

```
app/
  page.tsx                    # Homepage (ISR: 24h)
  categoria/
    venta/page.tsx           # Sale listings (ISR: 5min)
    alquiler/page.tsx        # Rent listings
    obra-nueva/page.tsx      # New buildings
  propiedad/[id]/page.tsx    # Property detail
  sitemap.ts                  # Dynamic sitemap
  robots.ts                   # Robots.txt

components/
  CategoryNav.tsx            # Navigation with mobile menu
  CategoryPage.tsx           # Listing page with search/sort/filters
  PropertyCard.tsx           # Property card component
  Pagination.tsx             # Load more pagination
  Footer.tsx                 # Multilingual footer

lib/
  i18n.ts                    # Translation system
  utils.ts                   # formatPrice, slugify, etc.
  supabase/
    queries.ts               # Database queries
    client.ts                # Supabase client

docs/
  DATABASE.md                # Schema documentation
  ARCHITECTURE.md            # System design
  TRANSLATION.md             # i18n guide
```

---

## Database Schema

Clean, minimal schema. See `docs/DATABASE.md` for full details.

```sql
-- Main table
properties (id, listing_type, title, price, location, images, specs, ...)

-- Fast search view
card_properties (materialized view with search_vector)

-- Optional translations
translations (property_id, locale, title, description)

-- Category views
properties_for_sale, properties_for_rent, properties_new_building
```

**Setup:**
```bash
psql $DATABASE_URL < database-clean-schema.sql
```

---

## Key Implementation Details

### ISR Caching Strategy

```typescript
// Homepage - rebuild daily after scrape
export const revalidate = 86400;

// Category pages - 5 minute refresh
export const revalidate = 300;
```

### Search & Filters

URL-based state for shareability:
```
/categoria/venta?search=valencia&minPrice=100000&maxPrice=500000&sortBy=price-asc&page=2
```

### Translations

Spanish is primary. EN/RU stored in separate table, loaded on demand.

```typescript
const { locale } = useLanguage();
const title = getPropertyTitle(property, locale);
```

### Domain Configuration

Primary: `miralunavalencia.com`
Redirects: `www.miralunavalencia.com` -> `miralunavalencia.com`

Configure `.es` redirects in Vercel Dashboard > Domains (not in Next.js to avoid loops).

---

## Scraping Integration

Properties are inserted from scrapers (Idealista, Fotocasa, etc.):

```typescript
await supabase.from('properties').upsert({
  id: 'idealista-12345',
  listing_type: 'sale',
  sub_category: 'apartment',
  title: 'Piso en Valencia Centro',
  price: 185000,
  location: 'Valencia, Ciutat Vella',
  municipality: 'Valencia',
  province: 'Valencia',
  images: ['https://...'],
  specs: { bedrooms: 3, bathrooms: 2, size: 95 },
  source: 'idealista',
  source_id: '12345'
}, { onConflict: 'source,source_id' });

// Refresh card view after bulk insert
await supabase.rpc('refresh_card_properties');
```

---

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

Environment variables in Vercel Dashboard.

### Domain Setup

1. Add domains in Vercel Dashboard
2. Configure DNS:
   - `A` record: `@` -> `76.76.21.21`
   - `CNAME` record: `www` -> `cname.vercel-dns.com`
3. Enable HTTPS (automatic)

---

## Documentation

| File | Description |
|------|-------------|
| `docs/DATABASE.md` | Schema, queries, migrations |
| `docs/ARCHITECTURE.md` | System design |
| `docs/TRANSLATION.md` | i18n implementation |
| `docs/COMPONENTS.md` | Component patterns |
| `PERFORMANCE.md` | Caching, optimization |
| `PAGINATION_COMPLETE.md` | Pagination implementation |
| `SEO_SETUP_COMPLETE.md` | SEO configuration |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, Server Components, ISR)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Language:** TypeScript
- **Deployment:** Vercel

---

## License

Proprietary - All rights reserved

---

## Contact

Issues: [GitHub Issues](https://github.com/your-repo/issues)
