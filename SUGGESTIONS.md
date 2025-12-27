# 🚀 Miraluna - Next Steps & Suggestions

**Private Development Roadmap**
**Last Updated:** December 27, 2025

---

## Priority 1: Core Infrastructure (Essential)

### 1. Database Setup & Migration
**Effort:** 2-3 days | **Impact:** Critical

#### PostgreSQL Setup
```bash
# On DigitalOcean Droplet
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb miraluna_prod
sudo -u postgres createuser --interactive
```

#### Recommended ORM: Prisma
```bash
npm install prisma @prisma/client
npx prisma init
```

**Prisma Schema Example:**
```prisma
model Property {
  id            String          @id @default(uuid())
  externalId    String          @unique
  source        String          // idealista, fotocasa, etc.
  sourceUrl     String
  type          PropertyType
  title         String
  titleEn       String?
  titleRu       String?
  description   String?
  descriptionEn String?
  descriptionRu String?
  price         Decimal
  location      String
  latitude      Float?
  longitude     Float?
  bedrooms      Int?
  bathrooms     Int?
  sizeM2        Decimal
  plotSizeM2    Decimal?
  roi           Decimal?
  features      Json?
  images        Json?
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  lastSeenAt    DateTime        @default(now())
  priceHistory  PriceHistory[]

  @@index([type])
  @@index([price])
  @@index([location])
  @@index([updatedAt])
}

model PriceHistory {
  id         String   @id @default(uuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id])
  price      Decimal
  recordedAt DateTime @default(now())

  @@index([propertyId])
  @@index([recordedAt])
}

enum PropertyType {
  HOUSE
  INVESTMENT
  PLOT
}
```

---

### 2. Web Scraping System
**Effort:** 1-2 weeks | **Impact:** Critical

#### Recommended Stack:
- **Scraping:** Puppeteer or Playwright for JavaScript-heavy sites
- **Parser:** Cheerio for HTML parsing
- **Queue:** Bull (Redis-based) for job queue
- **Scheduling:** node-cron for daily scraping

#### Implementation Strategy:

**File Structure:**
```
/scraper
  /sources
    - idealista.ts
    - fotocasa.ts
    - habitaclia.ts
  /utils
    - parser.ts
    - geocoder.ts
    - imageDownloader.ts
  /queue
    - scrapeQueue.ts
  - scheduler.ts
  - index.ts
```

**Example Scraper (Idealista):**
```typescript
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScrapedProperty {
  externalId: string;
  title: string;
  price: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeM2: number;
  images: string[];
  sourceUrl: string;
}

async function scrapeIdealista(searchUrl: string): Promise<ScrapedProperty[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set realistic user agent
  await page.setUserAgent('Mozilla/5.0 ...');

  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  // Extract listings
  const properties = await page.evaluate(() => {
    const listings = document.querySelectorAll('.item-info-container');
    return Array.from(listings).map(listing => {
      return {
        externalId: listing.getAttribute('data-adid') || '',
        title: listing.querySelector('.item-link')?.textContent?.trim() || '',
        price: parseFloat(listing.querySelector('.item-price')?.textContent?.replace(/[^0-9]/g, '') || '0'),
        // ... extract more fields
      };
    });
  });

  await browser.close();
  return properties;
}

async function updateOrCreateProperty(scraped: ScrapedProperty) {
  // Check if property exists
  const existing = await prisma.property.findUnique({
    where: { externalId: scraped.externalId }
  });

  if (existing) {
    // Update and track price change
    if (existing.price !== scraped.price) {
      await prisma.priceHistory.create({
        data: {
          propertyId: existing.id,
          price: scraped.price,
        }
      });
    }

    await prisma.property.update({
      where: { id: existing.id },
      data: {
        ...scraped,
        lastSeenAt: new Date(),
      }
    });
  } else {
    // Create new property
    const newProperty = await prisma.property.create({
      data: {
        ...scraped,
        source: 'idealista',
      }
    });

    // Create initial price history
    await prisma.priceHistory.create({
      data: {
        propertyId: newProperty.id,
        price: scraped.price,
      }
    });
  }
}
```

**Daily Cron Job:**
```typescript
import cron from 'node-cron';

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily scrape...');

  const sources = [
    'https://www.idealista.com/venta-viviendas/javea-xabia/',
    'https://www.fotocasa.es/es/comprar/viviendas/javea/todas-las-zonas/',
    // Add more sources
  ];

  for (const url of sources) {
    try {
      const properties = await scrapeIdealista(url);
      for (const prop of properties) {
        await updateOrCreateProperty(prop);
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
  }

  // Mark properties not seen in 7 days as inactive
  await prisma.property.updateMany({
    where: {
      lastSeenAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    data: { isActive: false }
  });

  console.log('Daily scrape completed');
});
```

**Important Considerations:**
- Use proxies to avoid IP bans (Bright Data, Oxylabs)
- Respect robots.txt and rate limiting
- Add random delays between requests
- Handle pagination
- Error handling and retry logic
- Store raw HTML for debugging

---

### 3. Price Tracking System
**Effort:** 3-4 days | **Impact:** High

**Key Features:**
1. Automatic price tracking when scraping
2. Historical price chart display
3. Price drop alerts
4. Average price trends

**Implementation:**

**Price History Chart Component:**
```typescript
'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceHistoryChartProps {
  priceHistory: { date: string; price: number }[];
}

export default function PriceHistoryChart({ priceHistory }: PriceHistoryChartProps) {
  const data = {
    labels: priceHistory.map(h => new Date(h.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Price (EUR)',
        data: priceHistory.map(h => h.price),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Price History',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) => `€${value.toLocaleString()}`,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}
```

**Add to property detail page:**
```typescript
// In app/propiedad/[id]/page.tsx
import PriceHistoryChart from '@/components/PriceHistoryChart';

// In component:
{property.priceHistory && property.priceHistory.length > 1 && (
  <div className="mt-8">
    <h2 className="text-2xl font-bold mb-4">Price History</h2>
    <PriceHistoryChart priceHistory={property.priceHistory} />
  </div>
)}
```

---

## Priority 2: User Experience Enhancements

### 4. Statistics Dashboard with Graphs
**Effort:** 4-5 days | **Impact:** High

**Install Chart Library:**
```bash
npm install chart.js react-chartjs-2
```

**Market Statistics Component:**
```typescript
'use client';

import { Bar, Pie, Line } from 'react-chartjs-2';
import { useLanguage } from '@/lib/i18n';

export default function MarketDashboard() {
  const { locale } = useLanguage();

  // Fetch from API
  const stats = {
    avgPriceByType: [
      { type: 'house', avgPrice: 450000 },
      { type: 'investment', avgPrice: 850000 },
      { type: 'plot', avgPrice: 250000 },
    ],
    priceDistribution: {
      '<200k': 45,
      '200k-400k': 120,
      '400k-600k': 85,
      '600k-1M': 55,
      '>1M': 25,
    },
    dailyListings: [
      { date: '2025-01-01', count: 12 },
      { date: '2025-01-02', count: 8 },
      // ... last 30 days
    ],
  };

  const barData = {
    labels: stats.avgPriceByType.map(s => s.type),
    datasets: [{
      label: 'Average Price (EUR)',
      data: stats.avgPriceByType.map(s => s.avgPrice),
      backgroundColor: 'rgba(249, 115, 22, 0.7)',
    }],
  };

  const pieData = {
    labels: Object.keys(stats.priceDistribution),
    datasets: [{
      data: Object.values(stats.priceDistribution),
      backgroundColor: [
        '#60a5fa',
        '#34d399',
        '#fbbf24',
        '#f87171',
        '#a78bfa',
      ],
    }],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Average Price by Type</h3>
        <Bar data={barData} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Price Distribution</h3>
        <Pie data={pieData} />
      </div>
    </div>
  );
}
```

---

### 5. Interactive Map Integration
**Effort:** 3-4 days | **Impact:** Medium-High

**Option 1: Google Maps (Paid but familiar):**
```bash
npm install @react-google-maps/api
```

**Option 2: Mapbox (Better pricing, better features):**
```bash
npm install react-map-gl mapbox-gl
```

**Mapbox Example:**
```typescript
'use client';

import Map, { Marker, Popup } from 'react-map-gl';
import { useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  properties: Property[];
}

export default function PropertyMap({ properties }: MapViewProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <Map
      initialViewState={{
        longitude: 0.1767,
        latitude: 38.7897,
        zoom: 12,
      }}
      style={{ width: '100%', height: 600 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
    >
      {properties.map(property => (
        property.coordinates && (
          <Marker
            key={property.id}
            longitude={property.coordinates.lng}
            latitude={property.coordinates.lat}
            onClick={() => setSelectedProperty(property)}
          >
            <div className="bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
              €{(property.price / 1000).toFixed(0)}k
            </div>
          </Marker>
        )
      ))}

      {selectedProperty && selectedProperty.coordinates && (
        <Popup
          longitude={selectedProperty.coordinates.lng}
          latitude={selectedProperty.coordinates.lat}
          onClose={() => setSelectedProperty(null)}
        >
          <div className="p-2">
            <h4 className="font-bold">{selectedProperty.title}</h4>
            <p className="text-sm">{formatPrice(selectedProperty.price)}</p>
            <Link href={`/propiedad/${selectedProperty.id}`} className="text-primary text-sm">
              View Details →
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  );
}
```

---

### 6. User Saved Properties & Alerts
**Effort:** 5-6 days | **Impact:** Medium

**Database Schema:**
```prisma
model User {
  id              String            @id @default(uuid())
  email           String            @unique
  name            String?
  image           String?
  savedProperties SavedProperty[]
  searchAlerts    SearchAlert[]
  createdAt       DateTime          @default(now())
}

model SavedProperty {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id])
  createdAt  DateTime @default(now())

  @@unique([userId, propertyId])
}

model SearchAlert {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  filters     Json     // Store search criteria
  isActive    Boolean  @default(true)
  frequency   String   @default("daily") // daily, weekly
  lastSent    DateTime?
  createdAt   DateTime @default(now())
}
```

**Save Property Button:**
```typescript
'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function SavePropertyButton({ propertyId }: { propertyId: string }) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/api/auth/signin';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/saved-properties', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className={`p-3 rounded-full border transition-colors ${
        isSaved
          ? 'bg-red-50 border-red-500 text-red-500'
          : 'bg-white border-gray-300 text-gray-600 hover:border-red-500'
      }`}
    >
      <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
    </button>
  );
}
```

---

## Priority 3: Advanced Features

### 7. AI-Powered Features
**Effort:** 2-3 weeks | **Impact:** High

**a) Automatic Property Title Translation:**
Use OpenAI API to translate titles if not provided:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function translatePropertyTitle(title: string, targetLang: 'en' | 'ru'): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a professional real estate translator. Translate property titles naturally and professionally.',
      },
      {
        role: 'user',
        content: `Translate this property title to ${targetLang === 'en' ? 'English' : 'Russian'}: "${title}"`,
      },
    ],
    max_tokens: 100,
  });

  return completion.choices[0].message.content || title;
}

// Use in scraper:
if (!property.titleEn) {
  property.titleEn = await translatePropertyTitle(property.title, 'en');
}
if (!property.titleRu) {
  property.titleRu = await translatePropertyTitle(property.title, 'ru');
}
```

**b) Property Recommendations:**
```typescript
async function getRecommendations(userId: string): Promise<Property[]> {
  // Get user's saved properties and search history
  const userPreferences = await getUserPreferences(userId);

  // Use OpenAI embeddings to find similar properties
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: userPreferences.description,
  });

  // Query database for similar properties using vector similarity
  // (Requires pgvector extension in PostgreSQL)
  const similar = await prisma.$queryRaw`
    SELECT * FROM properties
    ORDER BY embedding <-> ${embedding.data[0].embedding}::vector
    LIMIT 10
  `;

  return similar;
}
```

---

### 8. Performance Optimizations
**Effort:** 3-4 days | **Impact:** Medium

**a) Image Optimization:**
```typescript
// Use Next.js Image component everywhere
import Image from 'next/image';

<Image
  src={property.images[0]}
  alt={property.title}
  width={800}
  height={500}
  quality={85}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**b) Redis Caching:**
```bash
npm install redis
```

```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

// Cache search results
export async function searchProperties(filters: SearchFilters) {
  const cacheKey = `search:${JSON.stringify(filters)}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  const results = await prisma.property.findMany({
    where: buildWhereClause(filters),
  });

  // Cache for 5 minutes
  await redis.setEx(cacheKey, 300, JSON.stringify(results));

  return results;
}
```

**c) Database Query Optimization:**
- Add proper indexes
- Use connection pooling
- Implement pagination
- Use SELECT only needed fields

---

## Priority 4: Business Features

### 9. Property Comparison Tool
**Effort:** 2-3 days | **Impact:** Medium

```typescript
'use client';

import { useState } from 'react';

export default function PropertyComparison() {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);

  const addToComparison = (property: Property) => {
    if (selectedProperties.length < 3) {
      setSelectedProperties([...selectedProperties, property]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {selectedProperties.map(property => (
        <div key={property.id} className="bg-card border border-border rounded-xl p-6">
          <img src={property.images[0]} alt={property.title} />
          <h3 className="font-bold mt-4">{property.title}</h3>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-bold">{formatPrice(property.price)}</span>
            </div>
            <div className="flex justify-between">
              <span>Size:</span>
              <span>{property.specs.size}m²</span>
            </div>
            <div className="flex justify-between">
              <span>Bedrooms:</span>
              <span>{property.specs.bedrooms || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Price/m²:</span>
              <span>€{(property.price / property.specs.size).toFixed(0)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 10. Lead Generation & CRM
**Effort:** 1-2 weeks | **Impact:** Medium (for business)

**Contact Form with Lead Capture:**
```typescript
model Lead {
  id            String   @id @default(uuid())
  name          String
  email         String
  phone         String?
  propertyId    String?
  property      Property? @relation(fields: [propertyId], references: [id])
  message       String
  source        String   // website, email, etc.
  status        String   @default("new") // new, contacted, qualified, converted
  createdAt     DateTime @default(now())
}
```

---

## Recommended Timeline

### Month 1: Core Infrastructure
- Week 1: Database setup, migrations
- Week 2-3: Web scraping system
- Week 4: Price tracking implementation

### Month 2: User Features
- Week 1: Statistics dashboard with graphs
- Week 2: Map integration
- Week 3: User saved properties & alerts
- Week 4: Testing and bug fixes

### Month 3: Advanced Features
- Week 1-2: AI translations
- Week 2-3: Performance optimizations
- Week 3-4: Property comparison, CRM basics

### Month 4: Polish & Launch
- Week 1-2: Final testing
- Week 2-3: Marketing prep
- Week 3-4: Soft launch

---

## Estimated Costs

### Development (If hiring):
- Backend Developer: €3,000-5,000/month
- Frontend Developer: €2,500-4,000/month
- Total 3-month MVP: €16,500-27,000

### Operational (Monthly):
- DigitalOcean Droplet (4GB RAM): €20
- PostgreSQL Database: €15-25
- Redis Cache: €10-15
- Proxies for scraping: €50-100
- OpenAI API (translations): €20-50
- Mapbox/Google Maps: €0-50 (depending on usage)
- Domain & SSL: €2
**Total Monthly: €117-262**

### Year 1:
- Development: €20,000
- Operations (12 months): €1,500-3,000
- Marketing: €5,000-10,000
**Total: €26,500-33,000**

---

## Key Success Metrics

1. **Properties in Database:** Target 500+ in first month
2. **Daily Active Users:** Target 100 in first 3 months
3. **Search Queries:** Target 500/day
4. **Saved Properties:** Target 20% of users
5. **Property Leads:** Target 50/month
6. **Page Load Time:** < 2 seconds
7. **Uptime:** 99.9%

---

## Risk Mitigation

1. **Scraping Blocks:**
   - Use rotating proxies
   - Implement fallback sources
   - Add manual submission option

2. **Legal Issues:**
   - Add Terms of Service
   - Include data source attribution
   - Respect robots.txt
   - Consider API partnerships

3. **Performance:**
   - Implement caching early
   - Use CDN for images
   - Optimize database queries
   - Monitor with tools like Sentry

4. **Competition:**
   - Focus on UX/UI excellence
   - Add unique features (AI recommendations)
   - Build community features
   - Excellent multilingual support

---

## Final Recommendations

1. **Start Small:** MVP with basic scraping + database
2. **Iterate Fast:** Weekly releases with user feedback
3. **Monitor Everything:** Analytics from day 1
4. **Focus on Quality:** Better to have 100 perfect listings than 1000 messy ones
5. **Build Community:** Local connections in Jávea
6. **Mobile First:** 70%+ users will be on mobile
7. **SEO from Day 1:** Structured data, sitemap, fast loading

**Success depends on:**
- Data quality and freshness
- User experience
- SEO optimization
- Local market knowledge
- Reliable scraping infrastructure

Good luck with the launch! 🚀
