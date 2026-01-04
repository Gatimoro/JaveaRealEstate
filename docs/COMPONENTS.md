# Component Documentation

This document explains the component architecture, common patterns, and how to modify or create new components.

## Component Categories

### 1. Layout Components
- Navbar.tsx
- Footer.tsx
- Providers.tsx

### 2. Page Sections
- HeroSection.tsx
- CategoryCards.tsx
- AboutSection.tsx
- ContactSection.tsx
- CTASection.tsx
- AnalyticsSection.tsx

### 3. Property Display
- PropertyCard.tsx
- InvestmentCard.tsx
- PlotCard.tsx
- PropertyCarousel.tsx
- PropertyImage.tsx

### 4. Interactive Components
- SavePropertyButton.tsx
- SearchContent.tsx

### 5. Utility Components
- MiralunaLogo.tsx
- ListingStatistics.tsx
- HomeContent.tsx
- AuthCallback.tsx

## Core Components

### PropertyCard.tsx

Displays house/apartment properties.

**Type**: Client Component ('use client')
**Used in**: Homepage carousels, search results, profile page

**Props**:
```typescript
interface PropertyCardProps {
  property: Property;
}
```

**Code Structure**:
```typescript
'use client';

import { Bed, Bath, Maximize, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { Property } from '@/data/properties';
import { useLanguage, getPropertyTitle, formatPrice, translations } from '@/lib/i18n';
import SavePropertyButton from './SavePropertyButton';

export default function PropertyCard({ property }: PropertyCardProps) {
  const { locale } = useLanguage();
  const t = translations[locale];
  const title = getPropertyTitle(property, locale);

  return (
    <Link href={`/propiedad/${property.id}`} className="...">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img src={property.images[0]} alt={title} className="..." />
        {property.badge && <div className="badge">{property.badge}</div>}
        <SavePropertyButton propertyId={property.id} />
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-3">
        {/* Price */}
        <div className="text-2xl font-bold gradient-text">
          {formatPrice(property.price, locale)}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>

        {/* Location */}
        <div className="flex items-center text-muted text-sm">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-muted pt-2 border-t border-border">
          {property.specs.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.specs.bedrooms} {t.bedroomsShort}</span>
            </div>
          )}
          {property.specs.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.specs.bathrooms} {t.bathroomsShort}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" />
            <span>{property.specs.size}m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Key Features**:
- Entire card is a clickable link
- Hover effect: border changes to orange, glow appears
- Badge positioned top-left
- Save button positioned top-right
- Price uses gradient text effect
- Title truncated to 1 line with ellipsis
- Specs only show if available (bedrooms/bathrooms optional)

**Styling**:
- Dark card background (`bg-card`)
- Rounded corners (12px)
- Orange border on hover
- 300ms transitions

**Bad Practice (MVP)**: 95% identical to InvestmentCard and PlotCard - should be unified with BasePropertyCard component.

### InvestmentCard.tsx

Displays investment properties (same as PropertyCard but with ROI badge).

**Differences from PropertyCard**:
1. ROI badge in top-right (next to save button)
2. Save button and ROI badge in flex column

**Code Difference**:
```typescript
{/* Top-right section */}
<div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
  <SavePropertyButton propertyId={property.id} />
  {property.specs.roi && (
    <div className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
      <TrendingUp className="w-4 h-4" />
      {property.specs.roi}% ROI
    </div>
  )}
</div>
```

**Bad Practice**: ~85 lines duplicated from PropertyCard. See TECHNICAL_DEBT.md for refactoring plan.

### PlotCard.tsx

Displays land plots (different specs than houses).

**Differences from PropertyCard**:
1. Different specs section (size, buildable, zone)
2. No bedrooms/bathrooms
3. Yes/No icons for buildable status

**Specs Section**:
```typescript
<div className="space-y-2 pt-2 border-t border-border">
  {/* Size */}
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted flex items-center gap-1">
      <Maximize className="w-4 h-4" />
      {t.sizeLabel}
    </span>
    <span className="font-semibold">{property.specs.size}m²</span>
  </div>

  {/* Buildable */}
  {property.specs.buildable !== undefined && (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{t.buildable}</span>
      <span className="flex items-center gap-1">
        {property.specs.buildable ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-500">{t.yes}</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-500">{t.no}</span>
          </>
        )}
      </span>
    </div>
  )}

  {/* Zone */}
  {property.specs.zone && (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{t.zone}</span>
      <span className="font-semibold">{property.specs.zone}</span>
    </div>
  )}
</div>
```

**Bad Practice**: Layout with `justify-between` instead of inline - inconsistent with other cards.

### SavePropertyButton.tsx

Heart button to save/favorite properties.

**Type**: Client Component (needs state and localStorage)

**Props**:
```typescript
interface SavePropertyButtonProps {
  propertyId: string;
}
```

**Code**:
```typescript
'use client';

import { Heart } from 'lucide-react';
import { useSavedProperties } from '@/lib/savedProperties';

export default function SavePropertyButton({ propertyId }: SavePropertyButtonProps) {
  const { isSaved, toggleSave } = useSavedProperties();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Don't navigate to property page
    e.stopPropagation(); // Don't trigger parent Link
    toggleSave(propertyId);
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      aria-label={isSaved(propertyId) ? 'Remove from saved' : 'Save property'}
    >
      <Heart
        className={`w-5 h-5 transition-all ${
          isSaved(propertyId)
            ? 'fill-primary text-primary'
            : 'text-white'
        }`}
      />
    </button>
  );
}
```

**Key Features**:
- Uses `useSavedProperties()` context hook
- Prevents navigation when clicked (inside Link)
- Heart fills with orange when saved
- Semi-transparent background
- Smooth transitions

**Critical**: Must call `e.preventDefault()` and `e.stopPropagation()` because it's nested inside a Link.

### PropertyCarousel.tsx

Horizontal scrollable carousel for property listings.

**Type**: Client Component (needs ref for scroll)

**Props**:
```typescript
interface PropertyCarouselProps {
  title: string;
  properties: Property[];
  viewAllLink?: string;
}
```

**Code Structure**:
```typescript
'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import PropertyCard from './PropertyCard';
import InvestmentCard from './InvestmentCard';
import PlotCard from './PlotCard';

export default function PropertyCarousel({
  title,
  properties,
  viewAllLink
}: PropertyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-primary hover:underline">
            Ver todo →
          </Link>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Scroll buttons */}
        <button onClick={() => scroll('left')} className="...">
          <ChevronLeft />
        </button>
        <button onClick={() => scroll('right')} className="...">
          <ChevronRight />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar"
        >
          {properties.map((property) => {
            // Render correct card type
            if (property.type === 'investment') {
              return <InvestmentCard key={property.id} property={property} />;
            } else if (property.type === 'plot') {
              return <PlotCard key={property.id} property={property} />;
            } else {
              return <PropertyCard key={property.id} property={property} />;
            }
          })}
        </div>
      </div>
    </div>
  );
}
```

**Key Features**:
- Scroll buttons on left/right
- Smooth scrolling with `scroll-smooth`
- Hidden scrollbar with `hide-scrollbar` CSS
- Automatically picks correct card component based on type

**CSS Required**:
```css
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE/Edge */
  scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;  /* Chrome/Safari */
}
```

### Navbar.tsx

Site navigation bar.

**Type**: Client Component (needs auth state and language)

**Key Features**:
- Logo (links to home)
- Navigation links (Home, About, Contact)
- Language switcher
- User menu (when authenticated)
- Responsive mobile menu

**Code Structure**:
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage, translations } from '@/lib/i18n';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl gradient-text">
            JaveaRealEstate
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-primary">{t.inicio}</Link>
            <Link href="/nosotros" className="hover:text-primary">{t.nosotros}</Link>
            <Link href="/contacto" className="hover:text-primary">{t.contacto}</Link>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            {['es', 'en', 'ru'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`px-2 py-1 rounded ${locale === lang ? 'bg-primary text-white' : ''}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <Link href="/" className="block py-2">{t.inicio}</Link>
            <Link href="/nosotros" className="block py-2">{t.nosotros}</Link>
            <Link href="/contacto" className="block py-2">{t.contacto}</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
```

**Styling Notes**:
- Sticky positioning (`sticky top-0`)
- Semi-transparent background with blur effect
- Border at bottom for separation
- z-index 50 to stay above content

### HeroSection.tsx

Homepage hero with search functionality.

**Type**: Client Component (search interaction)

**Code Structure**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLanguage, translations } from '@/lib/i18n';

export default function HeroSection() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = translations[locale];
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative h-[600px] flex items-center justify-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(...)' }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl px-4">
        <h1 className="text-5xl font-bold mb-6 text-white">
          Find Your Dream Property in Javea
        </h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="flex-1 px-4 py-3 rounded-lg"
          />
          <button type="submit" className="px-6 py-3 bg-primary rounded-lg">
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Key Features**:
- Background image with dark overlay
- Centered content
- Search form redirects to `/buscar?q=...`
- Responsive text sizes

### PropertyImage.tsx

Image component for property detail page (gallery).

**Type**: Client Component (state for current image)

**Props**:
```typescript
interface PropertyImageProps {
  images: string[];
  alt: string;
}
```

**Code**:
```typescript
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PropertyImage({ images, alt }: PropertyImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((i) => (i + 1) % images.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="relative">
      {/* Main image */}
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-4 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
              i === currentIndex ? 'ring-2 ring-primary' : ''
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Key Features**:
- Current image display
- Previous/Next buttons
- Thumbnail strip below
- Active thumbnail highlighted with orange ring
- Circular navigation (wraps around)

## Layout Components

### Providers.tsx

Wraps app with context providers.

**Type**: Client Component

**Code**:
```typescript
'use client';

import { LanguageProvider } from '@/lib/i18n';
import { SavedPropertiesProvider } from '@/lib/savedProperties';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SavedPropertiesProvider>
        {children}
      </SavedPropertiesProvider>
    </LanguageProvider>
  );
}
```

**Usage in app/layout.tsx**:
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

**Critical**: Must be Client Component even though it doesn't use hooks directly (providers require client-side rendering).

## Common Patterns

### Pattern 1: Property Type Switching

When rendering different card types:

```typescript
{properties.map((property) => {
  if (property.type === 'investment') {
    return <InvestmentCard key={property.id} property={property} />;
  } else if (property.type === 'plot') {
    return <PlotCard key={property.id} property={property} />;
  } else {
    return <PropertyCard key={property.id} property={property} />;
  }
})}
```

**Better Pattern** (using object):
```typescript
const CardComponents = {
  house: PropertyCard,
  apartment: PropertyCard,
  investment: InvestmentCard,
  plot: PlotCard,
};

{properties.map((property) => {
  const CardComponent = CardComponents[property.type];
  return <CardComponent key={property.id} property={property} />;
})}
```

### Pattern 2: Conditional Rendering

Always check if optional fields exist:

```typescript
{property.specs.bedrooms && (
  <div>
    <Bed className="w-4 h-4" />
    <span>{property.specs.bedrooms} {t.bedroomsShort}</span>
  </div>
)}
```

**Why**: Plots don't have bedrooms, some properties missing data.

### Pattern 3: Client Component Wrapper

When Server Component needs client interactivity:

```typescript
// app/page.tsx (Server Component)
export default async function HomePage() {
  const properties = await getProperties();
  return <HomeContent properties={properties} />;
}

// components/HomeContent.tsx (Client Component)
'use client';
export default function HomeContent({ properties }) {
  // Can use hooks, state, etc.
  return <PropertyCarousel properties={properties} />;
}
```

### Pattern 4: Link Wrapping Entire Card

Make entire card clickable:

```typescript
<Link href={`/propiedad/${property.id}`} className="...">
  <div className="image-section">...</div>
  <div className="content-section">...</div>
</Link>
```

**Critical**: Nested buttons (SavePropertyButton) must prevent propagation:
```typescript
const handleClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  // actual logic
};
```

## Styling Conventions

### Tailwind Classes

**Card Layout**:
```typescript
className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all hover-glow"
```

**Gradient Text**:
```typescript
className="gradient-text"  // For prices, headings
```

**Spacing**:
```typescript
className="p-5 space-y-3"  // Padding and vertical spacing
className="flex gap-4"     // Flex with gap
```

**Hover Effects**:
```typescript
className="hover:border-primary transition-all duration-300"
```

### CSS Custom Classes

Defined in `app/globals.css`:

```css
.gradient-text {
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

## Responsive Design

### Breakpoints

Tailwind defaults:
- `sm:` - 640px (tablet portrait)
- `md:` - 768px (tablet landscape)
- `lg:` - 1024px (desktop)
- `xl:` - 1280px (large desktop)

### Grid Patterns

**Auto-responsive grid** (search results):
```typescript
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
```

**Carousel** (horizontal scroll):
```typescript
className="flex gap-4 overflow-x-auto"
```

### Mobile Menu

```typescript
<div className="hidden md:flex">Desktop nav</div>
<button className="md:hidden">Mobile menu button</button>
```

## Common Mistakes to Avoid

### 1. Hardcoding Text

**Wrong**:
```typescript
<button>View All</button>
```

**Right**:
```typescript
<button>{t.viewAll}</button>
```

### 2. Not Handling Missing Data

**Wrong**:
```typescript
<span>{property.specs.bedrooms} beds</span>  // Crashes if undefined
```

**Right**:
```typescript
{property.specs.bedrooms && <span>{property.specs.bedrooms} {t.bedroomsShort}</span>}
```

### 3. Using 'use client' Unnecessarily

**Wrong**:
```typescript
'use client';
export default function StaticCard({ property }) {
  return <div>{property.title}</div>;  // No state, no hooks
}
```

**Right**:
```typescript
// No 'use client' - Server Component by default
export default function StaticCard({ property }) {
  return <div>{property.title}</div>;
}
```

### 4. Not Preventing Event Propagation

**Wrong**:
```typescript
<Link href="/property/1">
  <button onClick={saveProperty}>Save</button>  // Navigates AND saves
</Link>
```

**Right**:
```typescript
<Link href="/property/1">
  <button onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    saveProperty();
  }}>Save</button>
</Link>
```

## Creating New Components

### Step-by-Step

1. **Determine if Client or Server Component**
   - Needs state/hooks/browser APIs? → Client Component
   - Static rendering? → Server Component (default)

2. **Create file in `/components`**
   ```typescript
   // components/MyComponent.tsx
   'use client';  // Only if needed

   import { useLanguage, translations } from '@/lib/i18n';

   export default function MyComponent() {
     const { locale } = useLanguage();
     const t = translations[locale];

     return <div>{t.myKey}</div>;
   }
   ```

3. **Add translations if needed**
   ```typescript
   // lib/i18n.tsx
   export const translations = {
     es: { myKey: 'Mi texto' },
     en: { myKey: 'My text' },
     ru: { myKey: 'Мой текст' },
   };
   ```

4. **Import and use**
   ```typescript
   import MyComponent from '@/components/MyComponent';
   ```

## Next Steps

See other documentation:
- **[DATA_FLOW.md](./DATA_FLOW.md)** - How data flows through components
- **[TRANSLATION.md](./TRANSLATION.md)** - Using i18n in components
- **[TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)** - Component refactoring opportunities
