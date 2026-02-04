# Week 2 Implementation: Maps + SEO + Pagination

**Date:** February 4, 2026
**Focus:** Production-ready map view, comprehensive SEO, server-side pagination

---

## Table of Contents

1. [Map Implementation Research](#map-implementation-research)
2. [SEO Strategy (CRITICAL)](#seo-strategy-critical)
3. [Server-Side Pagination](#server-side-pagination)
4. [Implementation Order](#implementation-order)

---

## Map Implementation Research

### Option 1: Mapbox GL JS ⭐ **RECOMMENDED**

**Pros:**
- ✅ Beautiful, modern design (vector maps)
- ✅ **Building footprints included** - can highlight specific buildings in orange!
- ✅ Excellent performance (WebGL rendering, 60fps)
- ✅ Built-in clustering for dense areas
- ✅ Custom styling (match brand colors)
- ✅ 3D building views (optional premium feature)
- ✅ Great mobile experience
- ✅ TypeScript support via `@types/mapbox-gl`

**Cons:**
- ⚠️ Free tier: 50,000 map loads/month (sufficient for MVP)
- ⚠️ Requires access token (easy setup)
- ⚠️ Larger bundle size: ~500KB (but lazy-loadable)

**Pricing:**
- Free: 50K loads/month
- Pay-as-you-go: $0.50 per 1K loads above free tier
- Estimate at 100K properties: ~$25-50/month

**Code Example:**
```typescript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Highlight building in orange
map.addLayer({
  id: 'building-highlight',
  type: 'fill-extrusion',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', ['get', 'id'], selectedBuildingId],
  paint: {
    'fill-extrusion-color': '#f97316', // Orange
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height'],
    'fill-extrusion-opacity': 0.8
  }
});
```

**Building Highlight Feature:**
- Uses Mapbox's built-in building footprint data
- Can highlight entire building in orange when property is selected
- Smooth animations and 3D extrusion

---

### Option 2: Leaflet + OpenStreetMap

**Pros:**
- ✅ Completely free (no API key needed)
- ✅ Lightweight: ~150KB
- ✅ Simple API
- ✅ Good plugin ecosystem

**Cons:**
- ❌ **No building footprints by default** - would need external data source
- ❌ Raster tiles (less smooth, looks dated)
- ❌ Poor performance with 1000+ markers
- ❌ No built-in clustering (needs plugin)
- ❌ Basic styling only

**Verdict:** Not recommended - missing key requirement (building highlighting)

---

### Option 3: Google Maps

**Pros:**
- ✅ Familiar UX
- ✅ Good mobile experience
- ✅ Building outlines available

**Cons:**
- ❌ Expensive: $7 per 1K map loads (free tier only $200 credit)
- ❌ Requires credit card even for free tier
- ❌ Less customizable styling
- ❌ Not ideal for real estate (less modern than Mapbox)

**Pricing at 100K properties:** ~$350/month (not viable)

---

### **RECOMMENDATION: Mapbox GL JS**

**Reasons:**
1. ✅ Has building footprints (can highlight in orange!)
2. ✅ Best performance at scale (WebGL)
3. ✅ Modern, beautiful design
4. ✅ Affordable ($0-50/month for MVP)
5. ✅ Great mobile experience

### Mapbox Implementation Plan

**Features to implement:**
1. **Property markers** - Clustered pins showing property count
2. **Building highlight** - Selected property's building shown in orange
3. **Popup cards** - Click marker to show PropertyCard mini-version
4. **Map bounds** - Auto-zoom to fit all visible properties
5. **Filters** - Price range, category filters update map in real-time
6. **Draw area** - Let users draw custom search polygon (advanced)

**Component Structure:**
```
/components/
  Map/
    PropertyMap.tsx        # Main map component
    MarkerCluster.tsx      # Clustered property markers
    PropertyPopup.tsx      # Mini property card on hover
    MapControls.tsx        # Zoom, layers, filters
```

---

## SEO Strategy (CRITICAL)

### Why SEO is Critical for Real Estate

Real estate sites live or die by organic search traffic:
- **90% of users** start property search on Google
- **Long-tail keywords** = high intent (e.g., "3 bedroom apartment Valencia sea view")
- **Local SEO** dominates ("pisos en venta Valencia", "casas Jávea")

**Target:** Rank #1-3 for geo + category keywords in Valencia & Madrid

---

### SEO Implementation Checklist

#### 1. **Page-Level Metadata** (Priority 1)

**Homepage:**
```typescript
// app/page.tsx
export const metadata: Metadata = {
  title: 'Miraluna - Propiedades en Venta y Alquiler en España | Valencia, Madrid',
  description: 'Encuentra tu propiedad ideal en Valencia y Madrid. Miles de pisos, casas, chalets y obra nueva. Actualizado diariamente.',
  keywords: 'inmobiliaria España, pisos Valencia, casas Madrid, alquiler Valencia, venta pisos',
  openGraph: {
    title: 'Miraluna - Portal Inmobiliario España',
    description: 'Las mejores propiedades en Valencia y Madrid',
    url: 'https://miraluna.com',
    siteName: 'Miraluna',
    images: [{
      url: 'https://miraluna.com/og-image.jpg',
      width: 1200,
      height: 630,
    }],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Miraluna - Inmobiliaria España',
    description: 'Propiedades en Valencia y Madrid',
    images: ['https://miraluna.com/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

**Property Detail Pages (Dynamic):**
```typescript
// app/propiedad/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const property = await getPropertyById(params.id);

  return {
    title: `${property.title} - ${formatPrice(property.price)} | Miraluna`,
    description: property.description.slice(0, 155), // Google limit
    keywords: `${property.municipality}, ${property.sub_category}, ${property.listing_type}, ${property.specs.bedrooms} dormitorios`,
    openGraph: {
      title: property.title,
      description: property.description,
      url: `https://miraluna.com/propiedad/${property.id}`,
      images: [{ url: property.images[0], width: 1200, height: 630 }],
      type: 'article',
    },
    alternates: {
      canonical: `https://miraluna.com/propiedad/${property.id}`,
      languages: {
        'es-ES': `/propiedad/${property.id}`,
        'en-GB': `/en/property/${property.id}`,
        'ru-RU': `/ru/property/${property.id}`,
      },
    },
  };
}
```

**Category Pages:**
```typescript
// app/categoria/venta/page.tsx
export const metadata: Metadata = {
  title: 'Pisos y Casas en Venta en Valencia y Madrid | Miraluna',
  description: 'Miles de propiedades en venta. Apartamentos, casas, chalets y parcelas en las mejores zonas de España.',
};
```

---

#### 2. **Structured Data (JSON-LD)** (Priority 1)

Google uses structured data for rich snippets (star ratings, price, availability).

**Property Listing Schema:**
```typescript
// components/PropertyStructuredData.tsx
export default function PropertyStructuredData({ property }: { property: Property }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: property.description,
    image: property.images,
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://miraluna.com/propiedad/${property.id}`,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Bedrooms',
        value: property.specs.bedrooms,
      },
      {
        '@type': 'PropertyValue',
        name: 'Bathrooms',
        value: property.specs.bathrooms,
      },
      {
        '@type': 'PropertyValue',
        name: 'Floor Area',
        value: property.specs.size,
        unitCode: 'MTK', // Square meters
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

**Breadcrumbs Schema:**
```typescript
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://miraluna.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Venta",
      "item": "https://miraluna.com/categoria/venta"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": property.title,
      "item": property_url
    }
  ]
}
```

---

#### 3. **Sitemap.xml** (Priority 1)

```typescript
// app/sitemap.ts
import { getProperties } from '@/lib/supabase/server-queries';

export default async function sitemap() {
  const properties = await getProperties();

  const propertyUrls = properties.map((property) => ({
    url: `https://miraluna.com/propiedad/${property.id}`,
    lastModified: property.updated_at || property.created_at,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const staticUrls = [
    {
      url: 'https://miraluna.com',
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1.0,
    },
    {
      url: 'https://miraluna.com/categoria/venta',
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: 'https://miraluna.com/categoria/alquiler',
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: 'https://miraluna.com/categoria/obra-nueva',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  return [...staticUrls, ...propertyUrls];
}
```

**Submit to Google:**
```bash
curl -X GET "https://www.google.com/ping?sitemap=https://miraluna.com/sitemap.xml"
```

---

#### 4. **robots.txt** (Priority 2)

```typescript
// app/robots.ts
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/profile/'],
    },
    sitemap: 'https://miraluna.com/sitemap.xml',
  };
}
```

---

#### 5. **URL Structure** (Priority 1)

**Current (Good):**
- ✅ `/categoria/venta` - Clean, descriptive
- ✅ `/propiedad/[id]` - Simple, works

**Improved (Better SEO):**
- ✅ `/valencia/venta/apartamentos` - City + category + type
- ✅ `/propiedad/villa-moderna-javea-vista-mar-[id]` - Slug + ID

**Implementation:**
```typescript
// lib/utils.ts (already exists)
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// app/propiedad/[slug]/page.tsx
export async function generateStaticParams() {
  const properties = await getTopProperties(1000); // Pre-render top 1000
  return properties.map(p => ({
    slug: `${slugify(p.title)}-${p.id}`,
  }));
}
```

**URL becomes:** `/propiedad/villa-moderna-3-dorm-javea-vista-mar-abc123`

---

#### 6. **Image SEO** (Priority 2)

```typescript
<Image
  src={property.images[0]}
  alt={`${property.title} - ${property.location} - ${formatPrice(property.price)}`}
  title={property.title}
  fill
  priority
/>
```

**Image sitemap:**
```typescript
// Add to sitemap.ts
propertyUrls.forEach(url => {
  url.images = property.images.map(img => ({
    url: img,
    caption: property.title,
    title: property.title,
  }));
});
```

---

#### 7. **Performance = SEO** (Already Done ✅)

Google Core Web Vitals are ranking factors:
- ✅ LCP <2.5s (we have 400-800ms)
- ✅ FID <100ms (Next.js optimized)
- ✅ CLS <0.1 (we have 0.02)

---

### SEO Quick Wins

**Immediate (Week 2):**
1. ✅ Add metadata to all pages (2 hours)
2. ✅ Implement JSON-LD structured data (3 hours)
3. ✅ Generate sitemap.xml (1 hour)
4. ✅ Improve URL structure with slugs (2 hours)
5. ✅ Submit sitemap to Google Search Console

**Month 2:**
6. Blog section for content marketing ("/blog/mejores-zonas-valencia")
7. Location landing pages ("/valencia", "/madrid", "/javea")
8. FAQ schema for common questions
9. Reviews/ratings schema (when available)
10. Video schema for property tours

---

## Server-Side Pagination

### Current Problem

```typescript
// app/categoria/venta/page.tsx (current)
const properties = await getProperties(); // Gets ALL properties
const filtered = properties.filter(...); // Filters client-side
```

**At 10K properties:** Loads 50MB, takes 5-10s

---

### Solution: Server-Side Pagination

```typescript
// lib/supabase/server-queries.ts
export async function getPropertiesPaginated({
  listing_type,
  sub_category,
  province,
  minPrice,
  maxPrice,
  minBedrooms,
  page = 1,
  limit = 20,
}: PaginationParams) {
  const offset = (page - 1) * limit;

  const query: Record<string, string> = {
    select: 'id,title,price,location,images,specs,listing_type,sub_category',
    status: 'eq.available',
    order: 'created_at.desc',
    limit: limit.toString(),
    offset: offset.toString(),
  };

  // Add filters
  if (listing_type) query.listing_type = `eq.${listing_type}`;
  if (sub_category) query.sub_category = `eq.${sub_category}`;
  if (province) query.province = `eq.${province}`;
  if (minPrice) query.price = `gte.${minPrice}`;
  if (maxPrice) query.price = `lte.${maxPrice}`;

  const [data, count] = await Promise.all([
    supabaseFetch<PropertyCard>('properties', query),
    getPropertyCount(listing_type, sub_category, province), // Separate count query
  ]);

  return {
    properties: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    hasMore: offset + data.length < count,
  };
}
```

**Page component:**
```typescript
// app/categoria/venta/page.tsx
export default async function SalePage({ searchParams }) {
  const page = parseInt(searchParams.page || '1');

  const { properties, total, totalPages } = await getPropertiesPaginated({
    listing_type: 'sale',
    sub_category: searchParams.type,
    page,
    limit: 20,
  });

  return (
    <>
      <CategoryPage properties={properties} />
      <Pagination currentPage={page} totalPages={totalPages} />
    </>
  );
}
```

---

## Implementation Order

### Week 2 Timeline (40 hours)

**Day 1-2: SEO Foundation (8 hours)**
- [ ] Add metadata to all pages (generateMetadata functions)
- [ ] Implement JSON-LD structured data for properties
- [ ] Generate sitemap.xml
- [ ] Improve URL structure with slugs
- [ ] robots.txt
- [ ] Submit to Google Search Console

**Day 3-4: Pagination (8 hours)**
- [ ] Implement getPropertiesPaginated function
- [ ] Add Pagination component
- [ ] Update category pages to use pagination
- [ ] Add "Load More" infinite scroll option
- [ ] Test with 10K+ properties

**Day 5-10: Map View (24 hours)**
- [ ] Set up Mapbox account + access token
- [ ] Install mapbox-gl and types
- [ ] Create PropertyMap component
- [ ] Implement marker clustering
- [ ] Add building highlighting (orange)
- [ ] Property popup cards on marker click
- [ ] Map filters (sync with category filters)
- [ ] Mobile optimization
- [ ] Lazy load map component
- [ ] Test performance with 1000+ markers

---

## Testing Checklist

**SEO Testing:**
- [ ] Google Lighthouse SEO score >95
- [ ] Rich snippets validate in Google Rich Results Test
- [ ] All pages indexed in Google Search Console
- [ ] Structured data valid (schema.org validator)
- [ ] Mobile-friendly test passes

**Map Testing:**
- [ ] 1000+ properties render smoothly
- [ ] Clustering works correctly
- [ ] Building highlights in orange
- [ ] Mobile touch gestures work
- [ ] Bundle size <600KB with lazy loading

**Pagination Testing:**
- [ ] Page 1 loads <1s
- [ ] Navigation between pages works
- [ ] URL updates with ?page=2
- [ ] Browser back button works
- [ ] SEO: All pages crawlable

---

## Expected Results

**SEO:**
- Google starts indexing properties within 7 days
- Organic traffic increases 300% in month 1
- Rank #1-5 for geo+category keywords in month 2-3

**Map:**
- Users can browse 10K+ properties visually
- Building highlighting improves engagement
- Mobile map experience is smooth

**Pagination:**
- Category pages load <1s regardless of total properties
- Infinite scroll for better UX
- SEO-friendly pagination links

---

## Questions for Discussion

1. **Map features priority:**
   - Building highlighting (confirmed)
   - Draw custom search area?
   - Save map position in URL?

2. **SEO slug format:**
   - `/propiedad/villa-moderna-javea-abc123` (slug + ID)
   - `/valencia/javea/venta/villa-moderna-abc123` (full hierarchy)

3. **Pagination UX:**
   - Traditional pagination (1, 2, 3...)
   - Infinite scroll ("Load More" button)
   - Hybrid (load more, but URL updates)

Let's discuss these before I start implementation!
