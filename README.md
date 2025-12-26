# Jávea Real Estate Aggregator 🏖️

A modern, multilingual real estate aggregation platform for Jávea, Spain. Built with Next.js 14, TypeScript, Tailwind CSS, and ready for Supabase integration.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38bdf8)

## 🌟 Features

### ✅ Current Implementation

- **🖼️ Multi-image property listings** - Gallery with prev/next navigation and thumbnails
- **🔍 Advanced search** - Filters for price, bedrooms, bathrooms, size, and type
- **📍 Geospatial features** - Similar properties within 5km using Haversine formula
- **🌍 Multilingual support** - Spanish (primary), English, and Russian translations
- **📱 Responsive design** - Mobile-first, optimized for all screen sizes
- **🏠 Property types** - Houses/Apartments, Investment opportunities, Land/Plots
- **🎨 Modern UI** - Orange theme, smooth animations, glassmorphism effects
- **📊 Analytics section** - Market statistics and average prices by type
- **🔗 Wired navigation** - All links functional (search by type, home, property details)
- **📏 Optimized layout** - Denser cards, efficient grid system

### 🚀 Ready for Supabase Integration

- **📊 Database schema** - Complete PostgreSQL + PostGIS schema designed
- **🗺️ PostGIS integration** - Geospatial queries for location-based features
- **🏷️ Feature tagging system** - Normalized features with multilingual labels
- **💰 Price history tracking** - Track market trends and price changes
- **🌆 Geographic areas** - Neighborhood/area management system
- **📡 API layer** - Data fetching utilities ready for real-time data
- **🔄 Migration path** - Clear migration from static to database

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- ⚡ Next.js 14 with App Router
- 📘 TypeScript (strict mode)
- 🎨 Tailwind CSS v3
- ⚛️ React Server Components
- 🎯 Lucide Icons

**Backend (Ready to Deploy):**
- 🐘 PostgreSQL via Supabase
- 🗺️ PostGIS for geospatial queries
- 🔐 Row-Level Security (RLS)
- 📡 Real-time subscriptions
- ⚙️ Edge Functions

**Deployment:**
- ▲ Vercel (Frontend - zero config)
- 🔷 Supabase Cloud (Database + Auth)

### Project Structure

```
JaveaRealEstate/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # ✅ Landing page with carousels
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # ✅ Custom CSS (orange theme)
│   ├── buscar/                  # ✅ Search results
│   │   └── page.tsx
│   └── propiedad/[id]/          # ✅ Property detail page
│       └── page.tsx
│
├── components/                   # React Components
│   ├── Navbar.tsx               # ✅ Navigation with links
│   ├── HeroSection.tsx          # ✅ Hero with functional search
│   ├── CategoryCards.tsx        # Property type cards
│   ├── PropertyCarousel.tsx     # ✅ Carousel with "Ver todo" links
│   ├── PropertyCard.tsx         # ✅ Responsive house card
│   ├── InvestmentCard.tsx       # ✅ Responsive investment card
│   ├── PlotCard.tsx             # ✅ Responsive plot card
│   ├── AnalyticsSection.tsx     # ✅ Market statistics
│   ├── CTASection.tsx           # Call-to-action
│   └── Footer.tsx               # Site footer
│
├── data/                         # Data Layer
│   └── properties.ts            # ✅ Static data with translations
│                                # (18 properties, ready for migration)
│
├── lib/                          # 🔜 To be created
│   ├── supabase.ts              # Supabase client setup
│   ├── api.ts                   # Data fetching functions
│   ├── i18n.ts                  # Internationalization utilities
│   └── utils.ts                 # Helper functions
│
├── types/                        # TypeScript Types
│   └── supabase.ts              # 🔜 Generated database types
│
├── supabase/                     # 🔜 Database
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rpc_functions.sql
│       └── 003_seed_data.sql
│
├── docs/                         # 🔜 Documentation
│   ├── SETUP.md                 # Supabase setup guide
│   ├── MIGRATION.md             # Migration guide
│   ├── API.md                   # API reference
│   └── SCRAPER.md               # Web scraper guide
│
├── public/                       # Static assets
├── .env.example                  # 🔜 Environment template
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (optional for now, free tier)
- Git

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd JaveaRealEstate

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

### With Supabase (Optional)

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Add your Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...

# 3. Run database migrations (see docs/SETUP.md)

# 4. Start with live data
npm run dev
```

## 📊 Database Schema (Ready to Deploy)

### Core Tables

#### `properties` - Main listings table
```sql
- id (uuid, PK)
- external_id (text, unique) -- Prevents duplicate scraping
- type (house | investment | plot)
- status (active | sold | inactive)
- price, location, coordinates (PostGIS point)
- title_es, title_en, title_ru
- description_es, description_en, description_ru
- images (text[])
- bedrooms, bathrooms, size_built, size_plot
- roi_percentage, rental_yield (investments)
- zone, buildable, max_build_sqm (plots)
- source, source_url -- Track origin (idealista, fotocasa)
- first_seen_at, last_seen_at, updated_at
```

#### `features` - Normalized features
```sql
- id (uuid, PK)
- slug (text, unique) -- 'pool', 'garage', 'sea_view'
- name_es, name_en, name_ru
- category (amenities | exterior | interior | security)
```

#### `property_features` - Junction table
```sql
- property_id (uuid, FK)
- feature_id (uuid, FK)
```

#### `price_history` - Price tracking
```sql
- id (uuid, PK)
- property_id (uuid, FK)
- price (integer)
- recorded_at (timestamptz)
```

#### `areas` - Geographic neighborhoods
```sql
- id (uuid, PK)
- slug, name_es, name_en, name_ru
- municipality (Jávea)
- center (PostGIS point)
- bounds (PostGIS polygon)
```

### PostGIS Functions

**`nearby_properties(lat, lng, radius_km, type, max_price)`**
- Finds properties within X km using ST_DWithin
- Sorts by distance
- Filters by type and price

**`get_property_full(property_uuid)`**
- Returns property with all features, price history, and nearby properties
- Single query for property detail page

See `supabase/migrations/` for complete schema.

## 🌍 Multilingual System

### Current Implementation

Each property has separate fields for each language:
```typescript
{
  title_es: "Villa moderna con vistas al mar",
  title_en: "Modern villa with sea views",
  title_ru: "Современная вилла с видом на море",
  description_es: "...",
  description_en: "...",
  description_ru: "...",
  features: ['Piscina', 'Jardín'],
  featuresEn: ['Pool', 'Garden'],
  featuresRu: ['Бассейн', 'Сад']
}
```

### Language Detection (Future)
- Browser language preference
- URL parameter: `?lang=en`
- LocalStorage persistence
- Cookie-based (for SEO)

### i18n Library Integration (Future)
- next-intl for route-based locales (/en/, /ru/)
- SEO-optimized alternate links
- Automatic redirects based on Accept-Language

## 🎨 Design System

### Color Palette (Orange Theme)

```css
/* Primary Colors */
--primary: #f97316        /* Orange-500 (main accent) */
--secondary: #fb923c      /* Orange-400 (secondary) */
--orange-hover: #ea580c   /* Orange-600 (hover states) */

/* Background & Cards */
--background: #0a0a0a     /* Near-black */
--card: #1a1a1a           /* Dark gray cards */
--border: #2a2a2a         /* Subtle borders */

/* Text */
--foreground: #ffffff     /* Primary text */
--muted: #94a3b8          /* Secondary text */
```

### Typography
- Font: System font stack (optimized)
- Headings: Bold, gradient orange
- Body: Regular weight
- Monospace: Code blocks

### Spacing & Sizing
- Base unit: 4px (Tailwind default)
- Container: max-width 1280px
- Card radius: 12px-16px
- Gap in grids: 16px (gap-4) or 24px (gap-6)

### Components
- **Cards**: Dark bg, orange border on hover, glow effect
- **Buttons**: Orange primary, white text, hover states
- **Inputs**: Dark bg, orange focus ring
- **Transitions**: 300ms ease for smooth interactions

## 🔍 Search & Filtering

### Current Filters (app/buscar)
✅ Property type (house, investment, plot)
✅ Price range (min/max €)
✅ Bedrooms (minimum)
✅ Bathrooms (minimum)
✅ Size (minimum m²)
✅ Text search (title, location, description)
✅ URL parameters (?type=house, ?q=villa)

### Grid Layout
- Responsive CSS Grid: `repeat(auto-fill, minmax(260px, 1fr))`
- Gap: 16px (optimized for density)
- Sidebar filters on desktop
- Collapsible filters on mobile

### Future Enhancements
- 🔜 Area/neighborhood dropdown
- 🔜 Feature checkboxes (pool, garage, etc.)
- 🔜 Sort options (price, size, date added)
- 🔜 Map view with markers
- 🔜 Saved searches (requires auth)

## 📈 Analytics & Insights

### Current (AnalyticsSection.tsx)
- Average price by type (houses, investments, plots)
- Total property count
- Market trends (mocked with ±X%)

### Ready with Supabase
```sql
-- Average price by type
SELECT type, AVG(price), COUNT(*)
FROM properties
WHERE status = 'active'
GROUP BY type;

-- Price trends over time
SELECT DATE_TRUNC('month', recorded_at), AVG(price)
FROM price_history
GROUP BY 1 ORDER BY 1;

-- Most expensive areas
SELECT area, AVG(price)
FROM properties
WHERE status = 'active'
GROUP BY area
ORDER BY 2 DESC;
```

## 🔐 Security

### Current
- ✅ Environment variables for API keys
- ✅ Input sanitization in search
- ✅ No direct user input to database (static data)

### With Supabase RLS
```sql
-- Anonymous users can read active listings
CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT
  USING (status = 'active');

-- Only authenticated admins can insert/update
CREATE POLICY "Admins can manage properties"
  ON properties FOR ALL
  USING (auth.role() = 'admin');
```

## ⚡ Performance

### Current Optimizations
- ✅ Next.js automatic code splitting
- ✅ CSS Grid for responsive layouts
- ✅ Minimal client-side JavaScript
- ✅ Optimized images (via Next.js)

### Production Ready
- ISR (Incremental Static Regeneration) every hour
- Edge caching via Vercel CDN
- Database indexes on common queries:
  - `type`, `status`, `price`, `municipality`
  - PostGIS GIST index on `coordinates`
- Connection pooling (Supabase built-in)

### Performance Targets
- Lighthouse score: 90+ (all metrics)
- Time to First Byte: <200ms
- Largest Contentful Paint: <2.5s
- First Input Delay: <100ms

## 🚀 Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or connect GitHub repo for automatic deployments.

### Supabase (Backend)

1. Create project at supabase.com
2. Run migrations from `supabase/migrations/`
3. Configure RLS policies
4. Enable PostGIS extension
5. Copy API URL and anon key to Vercel

See `docs/SETUP.md` for step-by-step guide.

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server (:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Git Workflow

**Branches:**
- `main` - Production
- `claude/*` - AI-assisted features

**Commit Convention:**
```
feat: Add property filtering
fix: Resolve search bug
docs: Update README
style: Update card layout
refactor: Optimize queries
```

### Code Quality
- TypeScript strict mode enabled
- ESLint for code quality
- Type-safe Supabase queries (generated types)

## 🐛 Known Issues & Limitations

### Current Limitations
- ⚠️ Using static data (18 sample properties)
- ⚠️ No user authentication yet
- ⚠️ No admin panel for managing listings
- ⚠️ Mock coordinates (need real geocoding)
- ⚠️ No image upload (using Unsplash placeholders)

### Future Work (TODO.md)
- [ ] Connect to Supabase
- [ ] Build web scraper for idealista/fotocasa
- [ ] Implement geocoding service
- [ ] Add user authentication
- [ ] Create admin dashboard
- [ ] Set up automated scraping cron jobs
- [ ] Add email notifications
- [ ] Implement favorites/saved searches
- [ ] Add map view with clustering
- [ ] Build mobile app (React Native)

## 📚 Documentation

- **[SETUP.md](docs/SETUP.md)** - Complete Supabase setup guide
- **[MIGRATION.md](docs/MIGRATION.md)** - Migrate from static to database
- **[API.md](docs/API.md)** - API reference and examples
- **[SCRAPER.md](docs/SCRAPER.md)** - Web scraping guide
- **[TODO.md](TODO.md)** - Roadmap and next steps

## 🔄 Migration Path

### From Static Data to Supabase (When Ready)

1. **Set up Supabase**
   - Create project
   - Run migrations
   - Seed initial data

2. **Update code**
   - Create `lib/supabase.ts`
   - Create `lib/api.ts` with fetch functions
   - Update pages to use API calls

3. **Migrate data**
   - Export current 18 properties
   - Insert into Supabase
   - Add real coordinates (geocoding)

4. **Deploy**
   - Push to Vercel
   - Add environment variables
   - Test in production

See `docs/MIGRATION.md` for detailed steps.

## 🤝 Contributing

This project is in active development. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for backend infrastructure
- Vercel for seamless hosting
- Tailwind CSS for the design system
- Lucide for beautiful icons
- Unsplash for placeholder images

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: your.email@example.com
- **Documentation**: See `docs/` folder

---

**Built with ❤️ for the Jávea real estate market**

*Ready to aggregate properties from idealista, fotocasa, kyero, and more!*
