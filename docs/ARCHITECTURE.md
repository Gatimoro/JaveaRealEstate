# Architecture Overview

This document explains the system design, folder structure, and key architectural decisions.

## Technology Stack

### Frontend
- **Next.js 14** - App Router (Server + Client Components)
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Supabase** - PostgreSQL database, auth, storage
- **PostgreSQL** - Relational database with PostGIS

### Key Libraries
- `next` - Framework
- `react` - UI library
- `@supabase/supabase-js` - Database client
- `tailwindcss` - Styling

## Folder Structure

```
/app                    # Next.js App Router pages
  /api                  # API routes
    /revalidate         # Cache invalidation endpoint
  /auth                 # Authentication routes
    /callback           # Supabase auth callback
  /buscar               # Search results page
  /propiedad/[id]       # Dynamic property detail pages
  /profile              # User profile page
  page.tsx              # Homepage
  layout.tsx            # Root layout

/components             # React components
  AboutSection.tsx      # About us section
  AnalyticsSection.tsx  # Market statistics
  AuthCallback.tsx      # Auth callback handler
  CategoryCards.tsx     # Property type filter cards
  ContactSection.tsx    # Contact form section
  CTASection.tsx        # Call-to-action
  Footer.tsx            # Site footer
  HeroSection.tsx       # Homepage hero
  HomeContent.tsx       # Homepage wrapper
  InvestmentCard.tsx    # Investment property card
  ListingStatistics.tsx # Property stats display
  MiralunaLogo.tsx      # Site logo
  Navbar.tsx            # Navigation bar
  PlotCard.tsx          # Land plot card
  PropertyCard.tsx      # House/apartment card
  PropertyCarousel.tsx  # Property carousel slider
  PropertyImage.tsx     # Optimized property image
  Providers.tsx         # Context providers wrapper
  SavePropertyButton.tsx # Favorite button
  SearchContent.tsx     # Search page content

/lib                    # Utilities and helpers
  /supabase             # Supabase integration
    client.ts           # Client-side Supabase client
    server.ts           # Server-side Supabase client
    queries.ts          # Client-side DB queries
    server-queries.ts   # Server-side DB queries
  analytics.ts          # Analytics tracking
  i18n.tsx              # Translation system
  savedProperties.tsx   # Saved properties context

/data
  properties.ts         # Property type definitions

/public                 # Static assets
/scripts                # Upload/scrape scripts (not for frontend)
```

## Architectural Patterns

### Server Components vs Client Components

**Server Components** (default in Next.js 14):
- Fetch data directly from Supabase
- No client-side JavaScript shipped
- Used for: pages, static layouts, data displays

```typescript
// app/page.tsx - Server Component
export default async function HomePage() {
  const properties = await getProperties(); // Direct DB call
  return <div>{properties.map(...)}</div>;
}
```

**Client Components** ('use client'):
- Handle interactivity (clicks, form inputs, state)
- Access browser APIs (localStorage, window)
- Used for: buttons, forms, interactive UI

```typescript
// components/SavePropertyButton.tsx - Client Component
'use client';

export default function SavePropertyButton({ propertyId }) {
  const [isSaved, setIsSaved] = useState(false);
  // Uses localStorage, needs 'use client'
}
```

### Dynamic Rendering

All pages use `export const dynamic = 'force-dynamic'` to ensure fresh data.

**Why**: Properties are constantly updated (prices, availability), so we avoid stale caching.

**Location**: app/page.tsx, app/buscar/page.tsx, app/propiedad/[id]/page.tsx

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Trade-off**: Slower initial load, but always fresh data. Acceptable for MVP.

### Data Fetching Pattern

**Two query libraries** (duplicate code - see TECHNICAL_DEBT.md):

1. **lib/supabase/server-queries.ts** - For Server Components
2. **lib/supabase/queries.ts** - For Client Components

Both have identical query logic but use different clients.

```typescript
// server-queries.ts (Server Components)
export async function getProperties() {
  const supabase = createServerClient();
  const { data } = await supabase.from('properties')...
  return data || [];
}

// queries.ts (Client Components)
export async function getProperties() {
  const supabase = createClient();
  const { data } = await supabase.from('properties')...
  return data || [];
}
```

**Problem**: ~400 lines duplicated. See TECHNICAL_DEBT.md for refactoring options.

## Component Hierarchy

```
App (layout.tsx)
├── Providers (Context wrappers)
│   ├── LanguageProvider (i18n)
│   └── SavedPropertiesProvider (favorites)
├── Navbar
│   ├── LanguageSwitcher
│   └── SearchBar
├── [Page Content]
│   ├── HomePage
│   │   ├── HeroSection
│   │   ├── CategoryCards
│   │   ├── PropertyCarousel
│   │   │   └── PropertyCard/InvestmentCard/PlotCard (multiple)
│   │   ├── AnalyticsSection
│   │   ├── AboutSection
│   │   ├── ContactSection
│   │   └── CTASection
│   ├── SearchPage (buscar)
│   │   ├── SearchFilters
│   │   └── PropertyGrid
│   │       └── PropertyCard/InvestmentCard/PlotCard (multiple)
│   ├── PropertyDetailPage (propiedad/[id])
│   │   ├── PropertyImage (gallery)
│   │   ├── PropertyInfo
│   │   ├── PropertyFeatures
│   │   └── PropertyCarousel (4 different types)
│   └── ProfilePage
│       └── SavedPropertiesGrid
└── Footer
```

## Context Providers

### LanguageProvider (lib/i18n.tsx)

Manages current locale and provides translation utilities.

```typescript
// Provides:
const { locale, setLocale } = useLanguage();
```

**Storage**: localStorage (persists across sessions)
**Default**: Spanish (es), falls back to browser language

### SavedPropertiesProvider (lib/savedProperties.tsx)

Manages user's saved/favorited properties.

```typescript
// Provides:
const { savedProperties, toggleSave, isSaved } = useSavedProperties();
```

**Storage**: localStorage (will migrate to DB)
**Format**: Array of property IDs

## Page Rendering Strategies

| Page | Rendering | Why |
|------|-----------|-----|
| Homepage (/) | Dynamic Server | Fresh property data |
| Search (/buscar) | Dynamic Server | Real-time filtering |
| Property Detail (/propiedad/[id]) | Dynamic Server | Price updates, availability |
| Profile (/profile) | Client Component | Accesses localStorage |

**Note**: No static generation (SSG) or incremental static regeneration (ISR) currently used. Everything is dynamic for simplicity and data freshness.

## Database Connection

### Two Supabase Clients

**Server Client** (lib/supabase/server.ts):
```typescript
import { createServerClient as createClient } from '@supabase/ssr';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get, set, remove // Cookie handling for auth
      }
    }
  );
}
```

**Client Client** (lib/supabase/client.ts):
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**When to use**:
- Server Components → `createServerClient()`
- Client Components → `createClient()`

## Styling Approach

### Tailwind CSS Configuration

**Theme**: Dark mode with orange accents

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#f97316',    // Orange-500
      secondary: '#fb923c',  // Orange-400
      background: '#0a0a0a', // Near-black
      card: '#1a1a1a',       // Dark gray
      border: '#2a2a2a',     // Subtle borders
    }
  }
}
```

### Global Styles

**Location**: app/globals.css

Key features:
- CSS custom properties for colors
- Gradient text utility
- Hover glow effect
- Smooth transitions

```css
.gradient-text {
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hover-glow {
  transition: all 0.3s ease;
}
.hover-glow:hover {
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
}
```

### Component Styling Pattern

All components use inline Tailwind classes (no CSS modules or styled-components).

**Example**:
```tsx
<div className="bg-card border border-border rounded-xl p-5 hover:border-primary transition-all">
  <h3 className="text-lg font-semibold gradient-text">Title</h3>
</div>
```

## Grid System

### Homepage Carousels

**Implementation**: Custom horizontal scroll
**Breakpoints**:
- Mobile: Single column, swipe scroll
- Tablet: 2 columns
- Desktop: 3-4 columns

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {properties.map(property => <PropertyCard key={property.id} property={property} />)}
</div>
```

### Search Results Grid

**Implementation**: CSS Grid with auto-fill
**Min card width**: 260px
**Max card width**: 1fr (fills available space)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Auto-adjusts columns based on screen width */}
</div>
```

**Why auto-fill**: Responsive without breakpoints, cards naturally reflow.

## Authentication Flow

**Provider**: Supabase Auth
**Method**: Email/Password (can extend to OAuth)

### Flow Diagram

```
User clicks "Sign In"
  → Redirected to Supabase Auth UI
  → User enters credentials
  → Supabase validates
  → Redirects to /auth/callback
  → Callback exchanges code for session
  → Redirects to /profile
```

**Session Storage**: Cookies (handled by Supabase)
**Session Duration**: 1 hour (refresh token extends)

### Protected Routes

Currently none - all pages are public.
Saved properties stored in localStorage (no auth required).

**Future**: Migrate saved properties to database, require auth.

## Performance Considerations

### Current Optimizations

1. **Server Components** - Reduce client-side JavaScript
2. **Next.js Image** - Not currently used (using img tags)
3. **CSS Grid** - Efficient layout, no JavaScript
4. **Tailwind Purge** - Removes unused CSS in production

### Known Performance Issues

1. **No image optimization** - Using raw img tags instead of next/image
2. **No lazy loading** - All carousels load immediately
3. **Large initial bundle** - All components loaded upfront
4. **No code splitting** - Dynamic imports not used

**Impact**: Acceptable for MVP with ~60 properties. Will need optimization at scale.

See TECHNICAL_DEBT.md for improvement plan.

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Optional - Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Note**: All Supabase vars are `NEXT_PUBLIC_*` because they're used in client components.

## Build and Deployment

### Build Process

```bash
npm run build
```

**Outputs**:
- `.next/` - Production build
- Static assets
- Server-side code

**Build Time**: ~30-60 seconds for current codebase

### Deployment Targets

**Recommended**: Vercel (zero-config)
- Automatic builds on git push
- Preview deployments for branches
- Edge caching
- Serverless functions for API routes

**Alternative**: Any Node.js host (DigitalOcean, AWS, etc.)

## Error Handling

### Current Approach

**Database errors**: Return empty arrays
```typescript
const { data, error } = await supabase.from('properties').select();
if (error) {
  console.error(error);
  return []; // Fail gracefully
}
return data;
```

**Missing properties**: Return null, show "not found"
```typescript
if (!property) {
  return <div>Property not found</div>;
}
```

### What's Missing

- No error boundaries (app crashes on component errors)
- No retry logic for failed DB queries
- No user-facing error messages
- No error logging/monitoring

See TECHNICAL_DEBT.md for improvements.

## Type Safety

### TypeScript Configuration

**Mode**: Strict
**Key settings**:
- `strict: true` - All strict checks enabled
- `noImplicitAny: true` - No implicit any types
- `strictNullChecks: true` - Handle null/undefined

### Type Definitions

**Property types**: `data/properties.ts`
```typescript
export interface Property {
  id: string;
  type: 'house' | 'apartment' | 'investment' | 'plot';
  title: string;
  titleEn?: string;
  titleEs?: string;
  titleRu?: string;
  // ... (supports both camelCase and snake_case)
}
```

**Locale types**: `lib/i18n.tsx`
```typescript
export type Locale = 'es' | 'en' | 'ru';
```

**Supabase types**: Auto-generated from database schema (not currently used)

## Key Architectural Decisions

### 1. Dynamic Rendering Over Static

**Decision**: Use `force-dynamic` on all pages
**Reason**: Properties change frequently, caching causes stale data
**Trade-off**: Slower initial load, but always fresh

### 2. Duplicate Query Libraries

**Decision**: Separate server-queries.ts and queries.ts
**Reason**: Different Supabase clients for server/client components
**Trade-off**: ~400 lines duplicated, harder to maintain

**Future**: Unify with single implementation (see TECHNICAL_DEBT.md)

### 3. Card Components Not Unified

**Decision**: Three separate card components (PropertyCard, InvestmentCard, PlotCard)
**Reason**: Slight differences in displayed specs
**Trade-off**: ~220 lines duplicated, 95% identical code

**Future**: Create BasePropertyCard component (see TECHNICAL_DEBT.md)

### 4. Translation Fields in Database

**Decision**: Separate columns for each language (title_en, title_es, title_ru)
**Reason**: Simple queries, no joins needed
**Trade-off**: More columns, harder to add new languages

**Alternative**: JSON column with all translations (more flexible but complex queries)

### 5. localStorage for Saved Properties

**Decision**: Store favorites in localStorage
**Reason**: No auth required, works offline, simple
**Trade-off**: Not synced across devices, lost if cleared

**Future**: Migrate to database with auth (see TECHNICAL_DEBT.md)

## Next Steps

See the other documentation files for details on specific areas:

- **[DATABASE.md](./DATABASE.md)** - Database schema and queries
- **[TRANSLATION.md](./TRANSLATION.md)** - i18n system details
- **[COMPONENTS.md](./COMPONENTS.md)** - Component patterns
- **[DATA_FLOW.md](./DATA_FLOW.md)** - How data moves through the app
- **[TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)** - Known issues and improvements
