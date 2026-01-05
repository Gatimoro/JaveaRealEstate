# Badge System Implementation Summary

## Overview

This document summarizes the badge system implementation for the JaveaRealEstate application, answering all your questions and providing a roadmap for deployment.

---

## Your Questions - Answered ✅

### 1. How do badges currently work?

**Current Badge System:**
- ✅ **Dynamic badge generation** based on real analytics data
- ✅ **One badge per property** (strict priority hierarchy)
- ✅ **Three badge types**:
  - **"hot"** - Top 10 by all-time views (`views_count`)
  - **"new"** - Properties < 14 days old (`created_at`)
  - **"most-liked"** - Top 10 by all-time saves (`saves_count`)
- ✅ **Priority order**: hot > new > most-liked > static badge
- ✅ **Static fallback**: Database `badge` field as last resort

**Location**: `/lib/supabase/server-queries.ts:189-220`

---

### 2. How to implement "top viewed", "saved", and "hot" for most viewed today/recently?

**✅ IMPLEMENTED - Enhanced Time-Based Badge System**

The new implementation adds:

**New Badge Types:**
1. **TRENDING** (replaces "hot")
   - Top 10 by views in **last 7 days**
   - Shows what's popular **RIGHT NOW**
   - Uses `property_analytics_events` table

2. **RECENTLY-SAVED** (replaces "most-liked")
   - Top 10 by saves in **last 7 days**
   - Shows what users want **CURRENTLY**
   - Uses `property_analytics_events` table

3. **UPDATED** (new)
   - Properties modified in **last 3 days**
   - Highlights price changes, new photos, etc.
   - Uses `updated_at` timestamp

4. **NEW** (unchanged)
   - Properties < 14 days old
   - Uses `created_at` timestamp

**New Priority System:**
```
1. TRENDING        → Top 10 by views (last 7 days)
2. NEW             → Listed < 14 days ago
3. RECENTLY-SAVED  → Top 10 by saves (last 7 days)
4. UPDATED         → Modified < 3 days ago
5. STATIC          → Database badge field (fallback)
```

**Files Modified:**
- `/lib/supabase/server-queries.ts` - Added trending/recently-saved/updated functions
- `/database-analytics-events-setup.sql` - New events table schema

---

### 3. Make sure one property has only one badge

**✅ ALREADY IMPLEMENTED - Strict Priority Hierarchy**

The system uses a **first-match-wins** approach:

```typescript
// Priority 1: TRENDING (most important)
trendingProps.forEach(p => {
  badges[p.id] = 'trending';
});

// Priority 2: NEW (only if not already trending)
newProps.forEach(p => {
  if (!badges[p.id]) {  // ← Only assign if no badge yet
    badges[p.id] = 'new';
  }
});

// Priority 3: RECENTLY-SAVED (only if not trending/new)
recentlySavedProps.forEach(p => {
  if (!badges[p.id]) {
    badges[p.id] = 'recently-saved';
  }
});

// And so on...
```

**Example Decision Flow:**
```
Property A: 150 views (last 7d), 2 days old, 20 saves (last 7d)
  → Qualifies for: TRENDING, NEW, RECENTLY-SAVED
  → Gets: "trending" (highest priority) ✓
  → Other badges ignored

Property B: 10 views (last 7d), 5 days old, 50 saves (last 7d)
  → Qualifies for: NEW, RECENTLY-SAVED
  → Gets: "new" (higher priority than recently-saved) ✓
  → Recently-saved ignored

Property C: 50 views (last 7d), 30 days old, 80 saves (last 7d)
  → Qualifies for: RECENTLY-SAVED
  → Gets: "recently-saved" ✓
```

**Guarantee**: Every property has **at most one badge**. No exceptions.

---

### 4. Are badges for new properties included?

**✅ YES - "NEW" Badge Fully Implemented**

**How it works:**
- Properties with `created_at < 14 days` automatically get "new" badge
- Only if they don't already have a higher-priority badge (trending)
- Badge countdown starts from **original listing date** (`created_at`)
- **Does NOT reset** when property is updated (see question 5)

**Example Timeline:**
```
Day 1 (Jan 5):  Property listed → Badge: "new" ✅
Day 7 (Jan 12): Price updated   → Badge: "new" ✅ (still < 14 days)
Day 14 (Jan 19): Still listed   → Badge: "new" ✅ (14 days exactly)
Day 15 (Jan 20): Still listed   → Badge: REMOVED ❌ (> 14 days)
```

**Location**: `/lib/supabase/server-queries.ts:115-131` (getNewProperties)

---

### 5. About the scraper: When I update data, does the inclusion date remain the same or change to today?

**✅ INCLUSION DATE REMAINS THE SAME (Preserved)**

**Three Date Fields - Different Behaviors:**

| Field | On First Insert | On Update | Purpose |
|-------|----------------|-----------|---------|
| **created_at** | NOW() | **PRESERVED** ✅ | Original listing date (NEVER changes) |
| **updated_at** | NOW() | **NOW()** ⚠️ | Last modification (auto-updated by trigger) |
| **scraped_at** | Scrape time | **Scrape time** ⚠️ | Last scrape time (overwritten) |

**Why This Matters:**

**✅ GOOD - "NEW" Badge Countdown NOT Reset:**
```python
# Scraper uses UPSERT (insert or update on conflict)
result = supabase.table('properties').upsert(db_property).execute()

# Payload does NOT include created_at (it's excluded)
db_property = {
    'id': 'h1',
    'price': 480000,  # Updated price
    'scraped_at': NOW()  # New scrape time
    # ⚠️ created_at is NOT in payload → preserves original value
}
```

**Database Behavior:**
1. If property ID exists → **UPDATE** (created_at untouched)
2. If property ID is new → **INSERT** (created_at = NOW())

**Trigger Auto-Updates `updated_at`:**
```sql
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Real Example:**
```
Property "h1" First Scraped:
  created_at: 2026-01-05 10:00 ← LOCKED (never changes)
  updated_at: 2026-01-05 10:00
  scraped_at: 2026-01-05 10:00
  Badge: "new" (< 14 days)

Property "h1" Re-Scraped (price changed):
  created_at: 2026-01-05 10:00 ← UNCHANGED ✅
  updated_at: 2026-01-12 14:30 ← UPDATED (trigger)
  scraped_at: 2026-01-12 14:30 ← UPDATED (scraper)
  Badge: "new" (still < 14 days from created_at)

Property "h1" Re-Scraped (20 days later):
  created_at: 2026-01-05 10:00 ← STILL UNCHANGED ✅
  updated_at: 2026-01-25 09:00 ← UPDATED
  scraped_at: 2026-01-25 09:00 ← UPDATED
  Badge: (none) - NO LONGER "new" (> 14 days from created_at)
```

**Conclusion**: Original listing date is **permanently preserved** ✅

**Location**: `/database-properties-setup.sql:49-50, 101-114`

---

## Implementation Files Created

### 1. Documentation Files

#### `/docs/BADGE_SYSTEM.md` (Comprehensive Guide)
**Content:**
- Current badge types and definitions
- Badge priority system
- Implementation architecture
- Database schema
- Badge generation process
- Analytics tracking
- Date field behavior
- Limitations and improvements
- Testing badge logic
- FAQ

#### `/docs/SCRAPER_DATE_HANDLING.md` (Date Fields Deep Dive)
**Content:**
- Three date fields explained (created_at, updated_at, scraped_at)
- Scraper update vs insert logic
- Date preservation behavior
- Impact on badge system
- Edge cases and gotchas
- Monitoring and health checks
- Best practices
- SQL quick reference

#### `/docs/BADGE_ENHANCEMENT_PROPOSAL.md` (Implementation Plan)
**Content:**
- Problem statement (why current badges are limited)
- Proposed solution (time-windowed analytics)
- Implementation options (simple vs event-based vs hybrid)
- New badge logic and priority
- Implementation steps
- Performance benchmarks
- Localization strategy
- Success criteria
- Future enhancements

---

### 2. Database Schema

#### `/database-analytics-events-setup.sql`
**Content:**
- `property_analytics_events` table schema
- Indexes for performance
- Helper functions (get_trending_properties, get_rising_star_properties, etc.)
- RLS policies
- Maintenance tasks
- Optional: Table partitioning
- Optional: Materialized views
- Migration guide

**Key Features:**
```sql
CREATE TABLE property_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  property_id TEXT REFERENCES properties(id),
  event_type TEXT CHECK (event_type IN ('view', 'save', 'click', ...)),
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_fingerprint TEXT,  -- For deduplication
  session_id TEXT,
  source TEXT,
  metadata JSONB
);

-- Database functions for badge queries
CREATE FUNCTION get_trending_properties(...);
CREATE FUNCTION get_recently_saved_properties(...);
CREATE FUNCTION get_rising_star_properties(...);
CREATE FUNCTION cleanup_old_analytics_events(...);
```

---

### 3. Code Changes

#### `/lib/supabase/server-queries.ts`
**Changes:**
- ✅ Added `getTrendingProperties()` - Top 10 by views (last 7 days)
- ✅ Added `getRecentlySavedProperties()` - Top 10 by saves (last 7 days)
- ✅ Added `getUpdatedProperties()` - Modified in last 3 days
- ✅ Updated `getPropertyBadges()` - New priority system
- ✅ Graceful fallback - Falls back to legacy badges if events table missing

**New Badge Priority:**
```typescript
1. TRENDING        (getTrendingProperties)
2. NEW             (getNewProperties)
3. RECENTLY-SAVED  (getRecentlySavedProperties)
4. UPDATED         (getUpdatedProperties)
5. STATIC          (database badge field)
```

---

## Next Steps - Deployment Checklist

### Phase 1: Database Setup (30 minutes)

**1. Run Analytics Events Schema**
```bash
# In Supabase SQL Editor
# Paste and run: database-analytics-events-setup.sql
```

**2. Verify Tables Created**
```sql
-- Check table exists
SELECT tablename FROM pg_tables WHERE tablename = 'property_analytics_events';

-- Check functions created
SELECT proname FROM pg_proc WHERE proname IN (
  'get_trending_properties',
  'get_recently_saved_properties',
  'get_rising_star_properties'
);
```

---

### Phase 2: Analytics API Integration (2 hours)

**Current Analytics API** (needs update):
```typescript
// OLD: Increment counter
await supabase
  .from('properties')
  .update({ views_count: views_count + 1 })
  .eq('id', propertyId);
```

**NEW: Insert event + increment counter** (backwards compatible):
```typescript
// Insert event for time-windowed analytics
await supabase
  .from('property_analytics_events')
  .insert({
    property_id: propertyId,
    event_type: 'view',
    user_fingerprint: hashFingerprint(req),
    event_timestamp: new Date().toISOString()
  });

// ALSO increment legacy counter (for backwards compatibility)
await supabase
  .from('properties')
  .update({ views_count: views_count + 1 })
  .eq('id', propertyId);
```

**Files to Update:**
- `/supabase/functions/analytics/*` (or wherever analytics tracking is)
- Add user fingerprinting logic (hash of IP + User Agent)
- Add deduplication (check if recent event exists before inserting)

---

### Phase 3: Badge Display (Optional - Localization)

**Current Badge Display:**
```typescript
// PropertyCard.tsx, InvestmentCard.tsx, PlotCard.tsx
{property.badge && (
  <div className="...">
    {property.badge}  ← Displays "trending", "new", etc. as-is
  </div>
)}
```

**Optional: Add Translations**
```typescript
// Create /lib/badge-translations.ts
export const BADGE_TRANSLATIONS = {
  trending: {
    es: 'Tendencia',
    en: 'Trending',
    ru: 'В тренде'
  },
  'recently-saved': {
    es: 'Popular',
    en: 'Popular',
    ru: 'Популярное'
  },
  updated: {
    es: 'Actualizado',
    en: 'Updated',
    ru: 'Обновлено'
  },
  new: {
    es: 'Nuevo',
    en: 'New',
    ru: 'Новое'
  }
};

// In PropertyCard.tsx
import { BADGE_TRANSLATIONS } from '@/lib/badge-translations';
import { useLocale } from '@/lib/locale'; // Your locale hook

const locale = useLocale();
const badgeText = BADGE_TRANSLATIONS[property.badge]?.[locale] || property.badge;

{property.badge && (
  <div className="...">
    {badgeText}  ← Translated based on user's language
  </div>
)}
```

---

### Phase 4: Testing (1 hour)

**1. Seed Test Events**
```sql
-- Insert test view events for property 'h1'
INSERT INTO property_analytics_events (property_id, event_type, event_timestamp)
SELECT 'h1', 'view', NOW() - (random() * INTERVAL '7 days')
FROM generate_series(1, 100);  -- 100 views in last 7 days

-- Insert test save events
INSERT INTO property_analytics_events (property_id, event_type, event_timestamp)
SELECT 'h2', 'save', NOW() - (random() * INTERVAL '7 days')
FROM generate_series(1, 50);  -- 50 saves in last 7 days
```

**2. Test Badge Functions**
```sql
-- Test trending
SELECT * FROM get_trending_properties(7, 10);

-- Test recently saved
SELECT * FROM get_recently_saved_properties(7, 10);

-- Test rising star
SELECT * FROM get_rising_star_properties(10);
```

**3. Test Badge Assignment**
```bash
# Restart Next.js dev server
npm run dev

# Visit homepage
# Verify badges appear correctly
```

**4. Verify Badge Priority**
```sql
-- Create property with multiple badge qualifications
INSERT INTO properties (id, type, title, price, location, created_at, views_count, saves_count)
VALUES ('test-multi', 'house', 'Test Multi Badge', 500000, 'Javea', NOW(), 1000, 100);

-- Insert trending events
INSERT INTO property_analytics_events (property_id, event_type, event_timestamp)
SELECT 'test-multi', 'view', NOW() - INTERVAL '1 day'
FROM generate_series(1, 150);

-- Check badge (should be "trending" not "new")
```

---

### Phase 5: Monitoring (Ongoing)

**1. Badge Distribution**
```sql
-- Count properties by badge type
SELECT badge, COUNT(*) as count
FROM (
  SELECT id, badge FROM properties WHERE status = 'available'
) p
GROUP BY badge
ORDER BY count DESC;
```

**Expected:**
```
trending       | 10
new            | 5-15 (varies)
recently-saved | 10
updated        | 5-20 (varies)
NULL           | 30-50 (no badge)
```

**2. Events Per Day**
```sql
SELECT
  DATE(event_timestamp) as date,
  event_type,
  COUNT(*) as count
FROM property_analytics_events
WHERE event_timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(event_timestamp), event_type
ORDER BY date DESC;
```

**3. Storage Size**
```sql
SELECT
  pg_size_pretty(pg_total_relation_size('property_analytics_events')) as events_table_size,
  COUNT(*) as total_events
FROM property_analytics_events;
```

**4. Badge Query Performance**
```sql
EXPLAIN ANALYZE
SELECT * FROM get_trending_properties(7, 10);

-- Should show: < 100ms execution time
```

---

### Phase 6: Cleanup & Maintenance

**1. Set Up Monthly Cleanup Cron**
```sql
-- Delete events older than 6 months
SELECT cleanup_old_analytics_events(6);

-- Run via cron or scheduled job
-- Recommended: First day of each month
```

**2. Vacuum & Analyze**
```sql
-- After large deletes
VACUUM ANALYZE property_analytics_events;
```

**3. Monitor Index Bloat**
```sql
-- Check index sizes
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE tablename = 'property_analytics_events';
```

---

## Migration Strategy

### Option A: Quick Cutover (Recommended for Small Sites)

1. ✅ Deploy database schema (events table + functions)
2. ✅ Deploy updated code (`server-queries.ts`)
3. ✅ Code gracefully falls back if events table empty
4. ✅ Update analytics API to insert events
5. ✅ After 1 week, badges will be based on real time-windowed data

**Pros**: Simple, fast, clean
**Cons**: No historical data, badges may be sparse initially

---

### Option B: Backfill Historical Data (Optional)

```sql
-- Backfill synthetic events from current counters
-- NOTE: Timestamps will be random (not accurate)

-- Backfill views (max 100 per property)
INSERT INTO property_analytics_events (property_id, event_type, event_timestamp, user_fingerprint)
SELECT
  id,
  'view',
  NOW() - (random() * INTERVAL '30 days'),
  md5(random()::TEXT)
FROM properties
CROSS JOIN generate_series(1, LEAST(views_count, 100))
WHERE views_count > 0;

-- Backfill saves (max 100 per property)
INSERT INTO property_analytics_events (property_id, event_type, event_timestamp, user_fingerprint)
SELECT
  id,
  'save',
  NOW() - (random() * INTERVAL '30 days'),
  md5(random()::TEXT)
FROM properties
CROSS JOIN generate_series(1, LEAST(saves_count, 100))
WHERE saves_count > 0;
```

**Pros**: Immediate badge coverage
**Cons**: Synthetic data, not 100% accurate

---

## Performance Expectations

### Query Performance (with indexes)

| Query | Expected Time | Notes |
|-------|---------------|-------|
| get_trending_properties | < 50ms | With 100k events |
| get_recently_saved_properties | < 50ms | With 100k events |
| get_rising_star_properties | < 100ms | More complex (2 time windows) |
| getPropertyBadges (all) | < 200ms | Runs 4 queries in parallel |

### Storage Growth

| Metric | Size | Notes |
|--------|------|-------|
| Event row | ~100 bytes | Including indexes |
| 10k events/day | ~1 MB/day | ~30 MB/month |
| 1 year | ~365 MB | With daily traffic |
| After 6-month cleanup | ~180 MB | Stable size |

**Conclusion**: Very manageable even at high scale.

---

## Success Metrics

**Track these to measure badge system effectiveness:**

1. **Badge Coverage**
   - Goal: > 30% of properties have a badge
   - Measure: `COUNT(CASE WHEN badge IS NOT NULL THEN 1 END) / COUNT(*)`

2. **Badge Freshness**
   - Goal: "Trending" properties change daily
   - Measure: Compare trending list day-over-day

3. **User Engagement**
   - Goal: Badged properties have 2x CTR vs unbadged
   - Measure: Track clicks on badged vs unbadged properties

4. **Query Performance**
   - Goal: Badge generation < 200ms (p95)
   - Measure: Application performance monitoring

---

## Future Enhancements

Once event-based system is stable:

1. **Advanced Badges**
   - "Rising Star" - Highest view velocity (growth rate)
   - "Hot Deal" - Recently price-reduced properties
   - "Selling Fast" - High conversion rate (views → contact)

2. **Analytics Dashboard**
   - Heatmaps (when properties get most views)
   - Trend graphs (view/save history)
   - User behavior insights

3. **Personalized Badges**
   - "Recommended for You" based on user preferences
   - Different badges for different user segments

4. **Predictive Badges**
   - ML-based "Likely to Sell Soon"
   - Seasonal trend predictions

---

## Troubleshooting

### Issue: Badges not showing

**Check:**
1. Is events table created? `SELECT COUNT(*) FROM property_analytics_events;`
2. Are events being inserted? (Check analytics API logs)
3. Are database functions working? `SELECT * FROM get_trending_properties(7, 10);`
4. Check browser console for errors

### Issue: Badges always the same

**Check:**
1. Are new events being inserted daily?
2. Run `SELECT MAX(event_timestamp) FROM property_analytics_events;`
3. Should be recent (< 1 day old)

### Issue: Slow badge queries

**Check:**
1. Are indexes created? `\d property_analytics_events` (in psql)
2. Run `EXPLAIN ANALYZE` on slow queries
3. Consider materialized views (see database schema comments)

---

## Summary - What's Been Implemented

### ✅ Documentation Created
1. **BADGE_SYSTEM.md** - Comprehensive guide to current and new badge system
2. **SCRAPER_DATE_HANDLING.md** - Deep dive on date fields and preservation
3. **BADGE_ENHANCEMENT_PROPOSAL.md** - Implementation plan and options
4. **BADGE_IMPLEMENTATION_SUMMARY.md** (this file) - Complete deployment guide

### ✅ Database Schema Created
1. **property_analytics_events** table - Event tracking for time-windowed analytics
2. **Helper functions** - get_trending_properties, get_recently_saved_properties, etc.
3. **Indexes** - Optimized for badge query performance
4. **Maintenance functions** - cleanup_old_analytics_events

### ✅ Code Updated
1. **server-queries.ts** - New trending/recently-saved/updated functions
2. **getPropertyBadges()** - New priority system (trending > new > recently-saved > updated)
3. **Graceful fallback** - Falls back to legacy badges if events table empty

### ✅ Your Questions Answered
1. ✅ How badges work - Fully documented
2. ✅ Time-based trending badges - Implemented with event-based system
3. ✅ One badge per property - Guaranteed by priority system
4. ✅ New property badges - Included and working
5. ✅ Scraper date handling - created_at is PRESERVED, fully documented

---

## What You Need to Do

### Required Steps

1. **Deploy Database Schema**
   - Run `database-analytics-events-setup.sql` in Supabase SQL Editor

2. **Update Analytics API**
   - Modify view/save tracking to insert events (not just increment counters)
   - Add user fingerprinting for deduplication

3. **Test Badge System**
   - Seed test events
   - Verify badges appear correctly
   - Check performance

### Optional Steps

1. **Add Badge Translations**
   - Create `badge-translations.ts`
   - Update card components to use localized badge text

2. **Backfill Historical Data**
   - Run backfill SQL (if you want immediate badge coverage)

3. **Set Up Monitoring**
   - Track badge distribution
   - Monitor query performance
   - Set up cleanup cron job

---

**Last Updated**: 2026-01-05
**Status**: Ready for Deployment
**Estimated Deployment Time**: 3-4 hours
**Maintenance**: Monthly cleanup (5 minutes)

**Questions?** Refer to the detailed docs:
- `/docs/BADGE_SYSTEM.md`
- `/docs/SCRAPER_DATE_HANDLING.md`
- `/docs/BADGE_ENHANCEMENT_PROPOSAL.md`

Much love right back! 💙 Happy deploying! 🚀
