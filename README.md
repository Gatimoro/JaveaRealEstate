# Miraluna - Spain Real Estate Platform

A high-performance, multilingual real estate aggregator for Spain, built with Next.js 14, Supabase, and TypeScript.

**Current Coverage:** Valencia & Madrid regions
**Target Scale:** 100K+ properties across Spain
**Load Time:** <1s on 3G networks

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000`

---

## Architecture Overview

### Performance-First Design

- **ISR Caching:** Homepage cached for 24 hours (rebuilds after daily scrape)
- **Data Minimization:** 90% reduction in property data transfer
- **Image Optimization:** Automatic WebP conversion + lazy loading
- **Load Time:** 10-50ms homepage (cached), <1s first visit

See [PERFORMANCE.md](./PERFORMANCE.md) for complete architecture details.

### Geographic Coverage

**Valencia Region (Comunidad Valenciana):**
- Alicante Province: Jávea, Alicante, Benidorm, Torrevieja, Denia, Calpe, Altea, etc.
- Valencia Province: Valencia, Gandía, Torrent, Sagunto, Cullera, etc.
- Castellón Province: Castellón, Vila-real, Benicàssim, Peñíscola, etc.

**Madrid Region (Comunidad de Madrid):**
- Madrid city + metropolitan area
- Alcalá de Henares, Móstoles, Getafe, etc.

### Categories

**Main Listing Types:**
- **Sale** (Venta): Apartments, Houses, Commerce, Land Plots
- **Rent** (Alquiler): Apartments, Houses, Commerce
- **New Buildings** (Obra Nueva): New construction projects

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, Server Components, ISR)
- **Database:** Supabase (PostgreSQL + PostGIS for geospatial queries)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Images:** next/image (automatic WebP, lazy loading)
- **Maps:** TBD (evaluating Mapbox GL JS vs Leaflet)
- **i18n:** Spanish (ES), English (EN), Russian (RU)

---

## Project Structure

```
/app/                    # Next.js App Router pages
  page.tsx              # Homepage (ISR: 24h cache)
  categoria/            # Category pages (ISR: 5min cache)
    venta/             # Sale properties
    alquiler/          # Rent properties
    obra-nueva/        # New buildings
  propiedad/[id]/      # Property detail pages
  buscar/              # Search page
  profile/             # User saved properties

/components/            # React components
  CategoryNav.tsx      # Mobile-first navigation
  CategoryPage.tsx     # Reusable category listing
  PropertyCard.tsx     # Optimized property cards
  Footer.tsx
  MiralunaLogo.tsx
  SavePropertyButton.tsx

/lib/                   # Business logic & utilities
  utils.ts            # Shared utilities (formatPrice, etc.)
  i18n.ts             # Translation system
  supabase/
    server-queries.ts  # Server-side data fetching (ISR)
    queries.ts         # Client-side queries
    client.ts          # Supabase client
    server.ts          # Supabase server client

/data/                  # Static data (fallbacks)
  properties.ts        # Fallback property data

/docs/                  # Documentation
  ARCHITECTURE.md      # System design
  DATABASE.md          # Schema & queries
  COMPONENTS.md        # Component patterns
  TRANSLATION.md       # i18n implementation
```

---

## Database Schema

### Core Tables

**properties** - Main property listings
- Location hierarchy: country → region → province → municipality → neighborhood
- Geospatial: latitude, longitude (PostGIS indexed)
- Categories: listing_type (sale/rent/new-building), sub_category (apartment/house/commerce/plot)
- Multilingual: title_*, description_*, features_* for ES/EN/RU
- Analytics: views_count, saves_count, clicks_count

**locations** - Reference data for cities/provinces
- Used for autocomplete and validation
- Population data for sorting

**user_favorites** (coming soon) - Saved properties per user

### Migrations

Run migrations in order:
```bash
# 1. Base schema
psql $DATABASE_URL < database-properties-setup.sql

# 2. Spain expansion (regions, geospatial)
psql $DATABASE_URL < database-spain-expansion.sql

# 3. Additional migrations
psql $DATABASE_URL < database-migrations.sql
```

See [docs/DATABASE.md](./docs/DATABASE.md) for full schema details.

---

## Key Features

### Current (Production-Ready)

✅ Mobile-first responsive design
✅ Multi-language support (ES/EN/RU)
✅ ISR caching for instant page loads
✅ Image optimization (WebP + lazy loading)
✅ Category browsing (Sale, Rent, New Buildings)
✅ Search and filtering (price, bedrooms, location)
✅ Property detail pages with image galleries
✅ User authentication (Google OAuth via Supabase)
✅ Saved properties (client-side)

### In Progress (Week 2)

🚧 Server-side pagination (for 10K+ properties)
🚧 Map view with property clustering
🚧 SEO optimization (metadata, sitemap.xml, JSON-LD)
🚧 Advanced filters (price/m², year built, amenities)

### Planned (Month 2-3)

📋 Persistent saved properties (Supabase table)
📋 Email alerts for new properties
📋 Property comparison (side-by-side)
📋 Mortgage calculator
📋 Admin dashboard
📋 Scraper integration (Idealista, Fotocasa, etc.)

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| First Contentful Paint | <1s | 50-200ms ✅ |
| Largest Contentful Paint | <2.5s | 400-800ms ✅ |
| Time to Interactive | <3s | 500-1000ms ✅ |
| Homepage payload | <30KB | 20KB ✅ |
| Property card data | <1KB | 500 bytes ✅ |

**Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices, SEO)

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed metrics and scaling strategy.

---

## Development Workflow

### Running Locally

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run lint
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

1. Create Supabase project at https://supabase.com
2. Run migrations (see Database Schema section above)
3. Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
4. Configure RLS policies (included in migrations)

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# https://vercel.com/your-project/settings/environment-variables
```

**ISR Functions:** Homepage and category pages use ISR caching (see build output)
**Edge Caching:** Vercel CDN automatically caches static assets
**Database:** Supabase handles scaling, backups, and connection pooling

### Cost Estimate

| Scale | Infrastructure | Monthly Cost |
|-------|---------------|--------------|
| 10K properties | Vercel Pro + Supabase Pro | $45-85 |
| 100K properties | Vercel Pro + Supabase Team | $629 |
| 1M properties | Vercel Enterprise + Supabase Enterprise | $2700-3200 |

---

## Documentation

| Document | Description |
|----------|-------------|
| [PERFORMANCE.md](./PERFORMANCE.md) | Complete performance architecture, caching strategy, scaling plan |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, folder structure, tech decisions |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema, tables, RLS policies, query patterns |
| [docs/TRANSLATION.md](./docs/TRANSLATION.md) | i18n system, formatPrice, getPropertyTitle |
| [docs/COMPONENTS.md](./docs/COMPONENTS.md) | Component patterns, shared utilities |
| [docs/DATA_FLOW.md](./docs/DATA_FLOW.md) | How data moves from DB to UI |

---

## Contributing

Before making changes:
1. Read [PERFORMANCE.md](./PERFORMANCE.md) to understand caching strategy
2. Follow mobile-first design principles
3. Test on 3G network simulation
4. Run `npm run build` to verify no errors

---

## License

Proprietary - All rights reserved

---

## Contact

For questions about the codebase or deployment, see inline code comments or contact the development team.

**Project Status:** Production-ready for Valencia & Madrid regions
**Next Milestone:** Week 2 - Map view + SEO optimization + Pagination
