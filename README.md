# Javea Real Estate Platform

A multilingual real estate platform for Javea properties built with Next.js 14, Supabase, and TypeScript.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Documentation Index

This documentation is designed for rapid developer onboarding. Each section is self-contained with code examples.

### Core Documentation

1. **[Architecture Overview](./docs/ARCHITECTURE.md)** - System design, folder structure, tech stack
2. **[Database](./docs/DATABASE.md)** - Schema, tables, RLS policies, queries
3. **[Translation System](./docs/TRANSLATION.md)** - i18n implementation, formatPrice, getPropertyTitle
4. **[Components](./docs/COMPONENTS.md)** - Card components, shared utilities, patterns
5. **[Data Flow](./docs/DATA_FLOW.md)** - How data moves from DB to UI
6. **[Technical Debt](./docs/TECHNICAL_DEBT.md)** - Known issues, bad practices, future improvements

### Quick Reference

- **Languages Supported**: Spanish (es), English (en), Russian (ru)
- **Database**: Supabase PostgreSQL with snake_case naming
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Rendering**: Dynamic (no caching) for fresh data
- **Authentication**: Supabase (optional, saved properties feature)

## Project Status

**Current State**: MVP with core features working
- 62+ properties listed
- Multi-language support (ES/EN/RU)
- Property search and filtering
- Property detail pages with smart recommendations
- Save properties feature

**Recent Improvements**:
- Fixed translation display bugs
- Eliminated ~60 lines of code redundancy
- Added 4 smart property recommendation carousels
- Centralized formatPrice and translation utilities

## Key Concepts

### Property Types
- **Houses & Apartments**: Treated as same category for recommendations
- **Investments**: Special treatment (ROI badge, different carousels)
- **Plots**: Land parcels with buildable/zone info

### Translation Strategy
- **Database**: Uses snake_case (title_en, description_ru)
- **Static Data**: Uses camelCase (titleEn, descriptionRu)
- **System**: Supports both formats with intelligent fallback
- **Fallback Chain**: Requested locale → Spanish → English → base field

### Data Fetching
- **Server Components**: Fetch data directly from Supabase
- **Client Components**: Use queries.ts functions
- **Force Dynamic**: All pages set `export const dynamic = 'force-dynamic'`

## Common Tasks

### Add a New Property Type
1. Update `Property` interface in `data/properties.ts`
2. Add translation keys to `lib/i18n.tsx`
3. Create specialized card component (or extend existing)
4. Update property filters

### Add a New Language
1. Add locale to `lib/i18n.tsx` locales array
2. Add translation object to `translations` constant
3. Add columns to database: `title_xx`, `description_xx`, `features_xx`
4. Update upload scripts to handle new language

### Modify Property Card Design
- **Quick Changes**: Edit individual card components (PropertyCard, InvestmentCard, PlotCard)
- **Shared Changes**: Modify styles in all three files (cards are 95% identical)
- **Future**: Consider creating BasePropertyCard component (see TECHNICAL_DEBT.md)

## Critical Files

```
/app
  /propiedad/[id]/page.tsx    # Property detail page with carousels
  /page.tsx                   # Homepage with property listings
/components
  /PropertyCard.tsx           # House/apartment card
  /InvestmentCard.tsx         # Investment property card
  /PlotCard.tsx               # Land plot card
/lib
  /i18n.tsx                   # Translation system + formatPrice utility
  /supabase/queries.ts        # Client-side DB queries
  /supabase/server-queries.ts # Server-side DB queries
/data
  /properties.ts              # Property type definitions
```

## Environment Setup

Required environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Workflow

1. **Local Development**: `npm run dev`
2. **Type Checking**: `npm run type-check` (if configured)
3. **Build**: `npm run build`
4. **Production**: `npm start`

## Known Issues and Quirks

See [TECHNICAL_DEBT.md](./docs/TECHNICAL_DEBT.md) for detailed list.

**Quick Summary**:
- Card components have 95% identical code (refactor opportunity)
- Query logic duplicated in queries.ts and server-queries.ts (~400 lines)
- No error boundaries on pages
- Database has unused columns (badge, clicks_count)

## Getting Help

1. Check the relevant documentation section above
2. Review code examples in each doc file
3. Look at existing components for patterns
4. Check TECHNICAL_DEBT.md for known issues

## Contributing

When adding features:
1. Follow existing patterns (see COMPONENTS.md)
2. Add translations to lib/i18n.tsx for all three languages
3. Update type definitions in data/properties.ts
4. Use shared utilities (formatPrice, getPropertyTitle)
5. Document new features in appropriate doc file
