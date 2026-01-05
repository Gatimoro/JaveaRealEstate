# Badge System Documentation

## Overview

The JaveaRealEstate application uses a dynamic badge system to highlight special properties on the homepage. Each property can display **only one badge** to maintain visual clarity and prioritize the most important classification.

## Current Badge Types

### 1. **HOT** Badge 🔥
- **Definition**: Top 10 most viewed properties (all-time)
- **Data Source**: `views_count` field (cumulative total)
- **Query**: `ORDER BY views_count DESC LIMIT 10`
- **Visual**: Primary color badge, top-left corner
- **Priority**: **HIGHEST** (1st in hierarchy)

### 2. **NEW** Badge ✨
- **Definition**: Properties listed within the last 14 days
- **Data Source**: `created_at` field
- **Query**: `WHERE created_at > (NOW() - INTERVAL '14 days')`
- **Visual**: Primary color badge, top-left corner
- **Priority**: **MEDIUM** (2nd in hierarchy)

### 3. **MOST-LIKED** Badge ❤️
- **Definition**: Top 10 most saved properties (all-time)
- **Data Source**: `saves_count` field (cumulative total)
- **Query**: `ORDER BY saves_count DESC LIMIT 10`
- **Visual**: Primary color badge, top-left corner
- **Priority**: **LOW** (3rd in hierarchy)

### 4. **Static Badges** (Fallback)
- **Definition**: Hardcoded badge values from database `badge` field
- **Examples**: "Destacado", "Exclusivo", "Oportunidad", etc.
- **Priority**: **LOWEST** (4th in hierarchy)

## Badge Priority System

The system uses a **strict hierarchy** to ensure only one badge per property:

```typescript
// Priority order (first match wins):
1. HOT        - If property is in top 10 by views_count
2. NEW        - If property is < 14 days old (and not hot)
3. MOST-LIKED - If property is in top 10 by saves_count (and not hot/new)
4. STATIC     - Fallback to database badge field value (if set)
```

**Example Decision Flow:**
```
Property A: views_count=500, created_at=2 days ago, saves_count=50
  → Check HOT: YES (top 10 views) → Badge = "hot" ✓
  → Skip NEW, MOST-LIKED, STATIC

Property B: views_count=20, created_at=2 days ago, saves_count=5
  → Check HOT: NO
  → Check NEW: YES (< 14 days) → Badge = "new" ✓
  → Skip MOST-LIKED, STATIC

Property C: views_count=100, created_at=30 days ago, saves_count=80
  → Check HOT: NO
  → Check NEW: NO
  → Check MOST-LIKED: YES (top 10 saves) → Badge = "most-liked" ✓
  → Skip STATIC

Property D: views_count=10, created_at=60 days ago, saves_count=3, badge="Destacado"
  → Check HOT: NO
  → Check NEW: NO
  → Check MOST-LIKED: NO
  → STATIC: Badge = "Destacado" ✓
```

## Implementation Architecture

### File Structure

```
/lib/supabase/server-queries.ts   - Badge generation logic (server-side)
/app/page.tsx                      - Badge application to properties
/components/PropertyCard.tsx       - Badge display (houses)
/components/InvestmentCard.tsx     - Badge display (investments + ROI)
/components/PlotCard.tsx           - Badge display (plots)
/database-properties-setup.sql     - Database schema with analytics fields
```

### Database Schema

```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,

  -- Analytics for dynamic badges
  views_count INTEGER DEFAULT 0,     -- For "hot" badge
  saves_count INTEGER DEFAULT 0,     -- For "most-liked" badge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- For "new" badge

  -- Static badge (fallback)
  badge TEXT,

  -- Other fields...
  status TEXT DEFAULT 'available',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scraped_at TIMESTAMP WITH TIME ZONE
);
```

### Badge Generation Process

**Step 1: Fetch Badge Data (Server-Side)**

`/lib/supabase/server-queries.ts:189-220`

```typescript
export async function getPropertyBadges(): Promise<Record<string, string>> {
  const badges: Record<string, string> = {};

  // Fetch all badge categories in parallel
  const [hotProps, newProps, likedProps] = await Promise.all([
    getHotProperties(),      // Top 10 by views_count
    getNewProperties(),      // created_at < 14 days
    getMostLikedProperties() // Top 10 by saves_count
  ]);

  // Apply priority system (hot > new > most-liked)
  hotProps.forEach(p => {
    badges[p.id] = 'hot';
  });

  newProps.forEach(p => {
    if (!badges[p.id]) {  // Don't override "hot"
      badges[p.id] = 'new';
    }
  });

  likedProps.forEach(p => {
    if (!badges[p.id]) {  // Don't override "hot" or "new"
      badges[p.id] = 'most-liked';
    }
  });

  return badges; // { "h1": "hot", "h2": "new", "h3": "most-liked", ... }
}
```

**Step 2: Apply Badges to Properties**

`/app/page.tsx:49-58`

```typescript
const applyBadges = (properties: Property[]) =>
  properties.map(p => ({
    ...p,
    badge: badges[p.id] || p.badge,  // Dynamic badge OR static fallback
  }));

const housesWithBadges = applyBadges(houses);
const investmentsWithBadges = applyBadges(investments);
const plotsWithBadges = applyBadges(plots);
```

**Step 3: Display Badges in UI**

All card components render badges identically:

```typescript
{property.badge && (
  <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-sm font-semibold rounded-full">
    {property.badge}
  </div>
)}
```

**Exception**: `InvestmentCard` can display TWO badges (property badge + ROI badge)

## Analytics Tracking

### Required Analytics Events

For the badge system to work correctly, the following analytics must be tracked:

1. **View Tracking** (`views_count`)
   - Event: User views property detail page
   - Action: Increment `views_count` by 1
   - Implementation: Currently tracked via analytics API

2. **Save Tracking** (`saves_count`)
   - Event: User saves/favorites a property
   - Action: Increment `saves_count` by 1
   - Implementation: Currently tracked via analytics API

3. **Creation Date** (`created_at`)
   - Event: Property first inserted into database
   - Action: Automatically set to NOW() by database
   - Persistence: **NEVER changes** (preserved during updates)

### Analytics API Integration

The analytics are tracked through Edge Functions (see `/supabase/functions/`):

```typescript
// Increment view count
POST /api/analytics/view
Body: { propertyId: "h1" }

// Increment save count
POST /api/analytics/save
Body: { propertyId: "h1" }
```

## Date Field Behavior (Scraper Integration)

### Three Date Fields Explained

| Field | Purpose | Set On Insert | Set On Update | Notes |
|-------|---------|---------------|---------------|-------|
| **created_at** | Original listing date | NOW() | **PRESERVED** | Used for "new" badge, never changes |
| **updated_at** | Last modification | NOW() | **NOW()** (trigger) | Auto-updated on any field change |
| **scraped_at** | Last scrape time | Scrape time | **Scrape time** | Overwritten each scrape cycle |

### Scraper Update Behavior

When the scraper runs (`scripts/new_scraper.py` → `scripts/process_and_upload.py`):

**For EXISTING properties** (matched by `id`):
```python
# Upsert operation
result = supabase.table('properties').upsert(db_property).execute()
```

**What happens to dates:**
- ✅ `created_at`: **PRESERVED** (original date retained)
- ⚠️ `updated_at`: **AUTO-UPDATED** (PostgreSQL trigger sets to NOW())
- ⚠️ `scraped_at`: **OVERWRITTEN** (set to current scrape time)

**Example Timeline:**
```
Property "h1" First Scraped (2026-01-05):
  created_at:  2026-01-05 10:00:00  ← Set once, locked forever
  updated_at:  2026-01-05 10:00:00
  scraped_at:  2026-01-05 10:00:00
  Badge: "new" (< 14 days old)

Property "h1" Re-Scraped (2026-01-12, price changed):
  created_at:  2026-01-05 10:00:00  ← UNCHANGED (original date)
  updated_at:  2026-01-12 14:30:00  ← UPDATED by trigger
  scraped_at:  2026-01-12 14:30:00  ← UPDATED by scraper
  Badge: "new" (still < 14 days since created_at)

Property "h1" Re-Scraped (2026-01-25, no changes):
  created_at:  2026-01-05 10:00:00  ← UNCHANGED (original date)
  updated_at:  2026-01-25 09:00:00  ← UPDATED by trigger
  scraped_at:  2026-01-25 09:00:00  ← UPDATED by scraper
  Badge: (none) - NO LONGER "new" (> 14 days since created_at)
```

**Database Trigger (Auto-Update):**
```sql
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Current Limitations & Improvement Opportunities

### Limitation 1: All-Time Metrics Only

**Problem**: "Hot" and "most-liked" badges use cumulative all-time counts
- Old properties with high historical views may permanently occupy "hot" slots
- Recently trending properties may never get recognized
- No temporal context (trending today vs. popular overall)

**Impact Example:**
```
Property A: views_count=1000 (800 views in 2025, 200 in 2026)
Property B: views_count=150 (150 views this week)

Current System: Property A gets "hot" badge
Better System: Property B is actually trending NOW
```

### Limitation 2: No Time-Windowed Analytics

**Missing Capabilities:**
- Most viewed TODAY
- Most viewed THIS WEEK
- Trending properties (velocity of views)
- Recently saved properties

### Limitation 3: Single Language Badges

**Problem**: Badge text is not localized
- Display value: "hot", "new", "most-liked" (English only)
- Shown regardless of user's language preference (ES/EN/RU)

**Suggested Fix**: Add translation support in components:
```typescript
const badgeTranslations = {
  hot: { es: 'Popular', en: 'Hot', ru: 'Популярное' },
  new: { es: 'Nuevo', en: 'New', ru: 'Новое' },
  'most-liked': { es: 'Más Guardado', en: 'Most Saved', ru: 'Избранное' }
};
```

## Proposed Improvements

### Enhancement 1: Time-Windowed Badge System

Add new badge types with temporal context:

**TRENDING** Badge (Replaces "Hot")
- **Definition**: Top properties by views in last 7 days
- **Query**: Requires `recent_views_count` or view events table
- **Advantage**: Highlights currently popular properties

**RISING** Badge
- **Definition**: Properties with highest view velocity (% increase)
- **Formula**: `(views_last_7_days / views_previous_7_days) - 1`
- **Advantage**: Discovers emerging hot properties early

**Implementation Requirements:**
```sql
-- Option A: Add recent view count fields
ALTER TABLE properties ADD COLUMN views_today INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN views_this_week INTEGER DEFAULT 0;

-- Option B: Create view events table (better for analytics)
CREATE TABLE property_views (
  id SERIAL PRIMARY KEY,
  property_id TEXT REFERENCES properties(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_fingerprint TEXT  -- For deduplication
);

-- Query for trending (last 7 days)
SELECT property_id, COUNT(*) as recent_views
FROM property_views
WHERE viewed_at > NOW() - INTERVAL '7 days'
GROUP BY property_id
ORDER BY recent_views DESC
LIMIT 10;
```

### Enhancement 2: Configurable Badge Priority

Allow dynamic badge priority based on business goals:

```typescript
// Configuration-driven priority
const BADGE_PRIORITY = [
  { type: 'trending', enabled: true },   // Most important
  { type: 'new', enabled: true },
  { type: 'most-saved', enabled: true },
  { type: 'hot', enabled: false }        // Deprecated
];
```

### Enhancement 3: Multiple Badge Display (Optional)

For Investment cards, consider showing multiple badges:
- Primary badge (hot/new/trending)
- Secondary badge (ROI, yield percentage)
- Tertiary badge (high profitability)

**Visual Layout:**
```
┌─────────────────┐
│ [HOT] [12% ROI] │  ← Multiple badges, top-left
│                 │
│   Property      │
│   Image         │
└─────────────────┘
```

### Enhancement 4: Badge Refresh Strategy

**Current**: Badges refresh on every page load (no caching)
**Consideration**: Add short-lived cache (5-15 minutes) to reduce DB load

```typescript
// In server-queries.ts
export const revalidate = 300; // 5 minutes

export async function getPropertyBadges() {
  // ... badge logic
}
```

## Testing Badge Logic

### Manual Testing

1. **Test "new" badge:**
   ```sql
   -- Create a test property
   INSERT INTO properties (id, type, title, price, location, created_at)
   VALUES ('test-new', 'house', 'Test New Property', 500000, 'Javea', NOW());

   -- Verify it appears with "new" badge (< 14 days)
   ```

2. **Test "hot" badge:**
   ```sql
   -- Increment view count
   UPDATE properties SET views_count = 1000 WHERE id = 'h1';

   -- Verify top 10 by views_count get "hot" badge
   ```

3. **Test priority:**
   ```sql
   -- Create property that qualifies for multiple badges
   INSERT INTO properties (id, type, title, price, location, created_at, views_count, saves_count)
   VALUES ('test-all', 'house', 'Test All Badges', 500000, 'Javea', NOW(), 1000, 100);

   -- Should show "hot" badge (highest priority)
   ```

### Automated Testing (Suggested)

```typescript
// tests/badge-system.test.ts
describe('Badge Priority System', () => {
  it('should prioritize "hot" over "new"', () => {
    const property = {
      id: 'test',
      views_count: 1000,
      created_at: new Date(),
      saves_count: 10
    };

    const badge = determineBadge(property);
    expect(badge).toBe('hot');
  });

  it('should show "new" when not hot', () => {
    const property = {
      id: 'test',
      views_count: 10,
      created_at: new Date(),
      saves_count: 5
    };

    const badge = determineBadge(property);
    expect(badge).toBe('new');
  });
});
```

## FAQ

### Q: Can a property have multiple badges?
**A**: No. The system enforces **one badge per property** using the priority hierarchy (hot > new > most-liked > static).

**Exception**: InvestmentCard components can display both a primary badge AND an ROI badge simultaneously.

### Q: Do new properties automatically get the "new" badge?
**A**: Yes. Any property with `created_at` within the last 14 days automatically qualifies for the "new" badge (unless it already has "hot" badge).

### Q: When I update a property via scraper, does it reset the "new" badge?
**A**: No. The `created_at` date is **preserved** during updates, so properties retain their original listing date. The "new" badge will naturally expire after 14 days from the ORIGINAL created_at date.

### Q: How are view counts and save counts tracked?
**A**: Through analytics API endpoints that increment the respective counters in the database when users interact with properties.

### Q: Can I customize badge text?
**A**: Yes. Badge text comes from the database and can be any string. Consider adding translation support for multilingual badges.

### Q: What happens if analytics tracking fails?
**A**: Properties will fall back to static badges (if defined) or show no badge. The badge system gracefully handles errors without breaking the UI.

### Q: How often do badges update?
**A**: Currently on every page load (no caching). Consider adding a 5-15 minute cache to reduce database load while keeping badges relatively fresh.

## Conclusion

The current badge system provides a solid foundation with dynamic badge generation based on analytics. Key strengths:
- ✅ Single badge per property (clear visual hierarchy)
- ✅ Dynamic generation from real analytics data
- ✅ Preserves original creation dates during updates
- ✅ Graceful fallback to static badges

Recommended next steps:
1. Implement time-windowed "trending" badges (most viewed last 7 days)
2. Add badge text localization (ES/EN/RU)
3. Create view events table for better temporal analytics
4. Consider short-lived caching to reduce DB load

---

**Last Updated**: 2026-01-05
**Maintainer**: Development Team
**Related Docs**: `docs/SCRAPER.md`, `docs/ANALYTICS.md`
