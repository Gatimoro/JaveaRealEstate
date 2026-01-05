# Badge System Enhancement Proposal

## Problem Statement

The current badge system uses **all-time cumulative metrics** for "hot" and "most-liked" badges:

```typescript
// Current implementation
getHotProperties()       // Top 10 by views_count (ALL TIME)
getMostLikedProperties() // Top 10 by saves_count (ALL TIME)
```

### Issues with Current Approach

**1. Stagnation Problem**
- Properties listed months ago with high cumulative views permanently occupy "hot" slots
- Actually trending properties (popular RIGHT NOW) never get recognized
- Badge becomes meaningless over time (always the same old properties)

**Example**:
```
Property A: views_count = 1000 (900 in Dec 2025, 100 in Jan 2026)
Property B: views_count = 200  (195 in last 7 days, 5 total before)

Current System: A gets "hot" badge
Reality: B is actually HOT right now, A is historically popular but declining
```

**2. No Temporal Context**
- Can't distinguish between "steady performer" vs "explosive trend"
- No visibility into recent interest spikes
- Missing early signals of emerging hot properties

**3. Limited Badge Variety**
- Only 3 dynamic badge types (hot, new, most-liked)
- No recognition for:
  - Recently price-reduced properties
  - Properties with recent interest spikes
  - Trending properties (velocity-based)
  - Recently updated listings

---

## Proposed Solution

### Approach: Time-Windowed Analytics

Implement **time-based badges** using recent activity windows:

| Badge Type | Time Window | Metric | Purpose |
|------------|-------------|--------|---------|
| **TRENDING** | Last 7 days | Views | Currently popular properties |
| **RISING STAR** | Last 3 days | View velocity | Emerging hot properties |
| **RECENTLY SAVED** | Last 7 days | Saves | Currently desired properties |
| **NEW** | Last 14 days | Age | Newly listed (existing) |
| **UPDATED** | Last 3 days | Modified | Recent changes (price/photos) |

---

## Implementation Options

### Option 1: Simple Approach (Quick Win)

**Add time-windowed count fields to existing table**

**Schema Changes**:
```sql
ALTER TABLE properties
  ADD COLUMN views_last_7_days INTEGER DEFAULT 0,
  ADD COLUMN saves_last_7_days INTEGER DEFAULT 0,
  ADD COLUMN views_last_24_hours INTEGER DEFAULT 0;

CREATE INDEX idx_properties_views_7d ON properties(views_last_7_days DESC);
CREATE INDEX idx_properties_saves_7d ON properties(saves_last_7_days DESC);
```

**Pros**:
- ✅ Fast to implement (1-2 hours)
- ✅ Simple queries (no joins)
- ✅ Low overhead (just add columns)

**Cons**:
- ❌ Requires daily cron job to reset/decay counts
- ❌ No historical analytics (can't query "trending 2 weeks ago")
- ❌ Less flexible (fixed time windows)

**Reset Strategy**:
```sql
-- Run daily via cron
UPDATE properties SET views_last_7_days = 0, saves_last_7_days = 0;
-- Then recalculate from events table or decay values
```

---

### Option 2: Event-Based Approach (Recommended)

**Create separate analytics events table**

**Schema**:
```sql
-- New table for tracking all view/save events
CREATE TABLE property_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'save', 'click')),
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_fingerprint TEXT,  -- For deduplication (hash of IP + user agent)
  session_id TEXT,         -- Optional: track unique sessions
  source TEXT              -- Optional: referrer tracking
);

-- Indexes for fast time-window queries
CREATE INDEX idx_events_property_time ON property_analytics_events(property_id, event_timestamp DESC);
CREATE INDEX idx_events_type_time ON property_analytics_events(event_type, event_timestamp DESC);
CREATE INDEX idx_events_timestamp ON property_analytics_events(event_timestamp DESC);

-- Composite index for common query pattern
CREATE INDEX idx_events_property_type_time ON property_analytics_events(property_id, event_type, event_timestamp DESC);
```

**Pros**:
- ✅ Full historical analytics (query any time window)
- ✅ Flexible (can calculate trends for any period)
- ✅ Accurate (event-level granularity)
- ✅ Enables advanced analytics (velocity, acceleration, seasonality)
- ✅ No data loss (permanent event log)

**Cons**:
- ❌ More complex (requires joins for badge queries)
- ❌ Larger storage (events table grows indefinitely)
- ❌ Needs cleanup strategy (archive old events)

**Query Example** (Trending - Last 7 Days):
```sql
-- Top 10 properties by views in last 7 days
SELECT
  p.id,
  p.title,
  COUNT(e.id) as recent_views
FROM properties p
LEFT JOIN property_analytics_events e
  ON p.id = e.property_id
  AND e.event_type = 'view'
  AND e.event_timestamp > NOW() - INTERVAL '7 days'
WHERE p.status = 'available'
GROUP BY p.id, p.title
ORDER BY recent_views DESC
LIMIT 10;
```

**Performance**: With proper indexes, this query runs in < 50ms even with 100k+ events

---

### Option 3: Hybrid Approach (Best of Both Worlds)

**Combine event tracking with materialized counts**

**Schema**:
```sql
-- Event table (as in Option 2)
CREATE TABLE property_analytics_events (...);

-- Materialized view for fast queries (refreshed hourly)
CREATE MATERIALIZED VIEW property_recent_stats AS
SELECT
  property_id,
  COUNT(*) FILTER (WHERE event_type = 'view' AND event_timestamp > NOW() - INTERVAL '7 days') as views_7d,
  COUNT(*) FILTER (WHERE event_type = 'view' AND event_timestamp > NOW() - INTERVAL '24 hours') as views_24h,
  COUNT(*) FILTER (WHERE event_type = 'save' AND event_timestamp > NOW() - INTERVAL '7 days') as saves_7d
FROM property_analytics_events
WHERE event_timestamp > NOW() - INTERVAL '7 days'
GROUP BY property_id;

CREATE UNIQUE INDEX idx_recent_stats_property ON property_recent_stats(property_id);

-- Refresh every hour via cron
REFRESH MATERIALIZED VIEW CONCURRENTLY property_recent_stats;
```

**Pros**:
- ✅ Fast queries (pre-calculated materialized view)
- ✅ Historical analytics (event table)
- ✅ Flexible time windows
- ✅ Best performance for badge generation

**Cons**:
- ❌ More complex setup
- ❌ Eventual consistency (view refreshed hourly)
- ❌ Additional storage (view + events)

---

## Recommended Implementation: Option 2 (Event-Based)

**Why**:
1. Future-proof (supports any analytics feature)
2. Accurate real-time data
3. Enables advanced features (heatmaps, trend graphs, user behavior)
4. Clean separation of concerns

**Performance Considerations**:
- Partition events table by month (prevents table bloat)
- Archive events older than 6 months to cold storage
- Use connection pooling for high traffic

---

## New Badge Logic

### Badge Priority Hierarchy (Proposed)

```typescript
Priority 1: TRENDING       - Top 10 by views in last 7 days (most urgent signal)
Priority 2: NEW            - Listed < 14 days ago (existing logic)
Priority 3: RISING STAR    - Highest view growth rate last 3 days
Priority 4: RECENTLY SAVED - Top 10 by saves in last 7 days
Priority 5: UPDATED        - Modified within last 3 days (price/photos)
Priority 6: STATIC         - Fallback to database badge field
```

**Rationale**:
- **TRENDING** takes priority: Shows what's hot RIGHT NOW
- **NEW** second: Fresh listings are valuable
- **RISING STAR** third: Early signal of emerging trends
- **RECENTLY SAVED** fourth: Current user interest
- **UPDATED** fifth: Recent changes deserve attention
- **STATIC** last: Legacy/manual badges as fallback

### Badge Definitions

#### 1. TRENDING Badge

**Criteria**: Top 10 properties by view count in last 7 days

**Query**:
```sql
SELECT
  p.id,
  COUNT(e.id) as recent_views
FROM properties p
JOIN property_analytics_events e
  ON p.id = e.property_id
WHERE p.status = 'available'
  AND e.event_type = 'view'
  AND e.event_timestamp > NOW() - INTERVAL '7 days'
GROUP BY p.id
ORDER BY recent_views DESC
LIMIT 10;
```

**Display**: "Trending" | "Popular" | "🔥 Hot"

---

#### 2. RISING STAR Badge

**Criteria**: Highest percentage growth in views (last 3 days vs. previous 3 days)

**Query**:
```sql
WITH recent_views AS (
  SELECT
    property_id,
    COUNT(*) as views_last_3_days
  FROM property_analytics_events
  WHERE event_type = 'view'
    AND event_timestamp > NOW() - INTERVAL '3 days'
  GROUP BY property_id
),
previous_views AS (
  SELECT
    property_id,
    COUNT(*) as views_prev_3_days
  FROM property_analytics_events
  WHERE event_type = 'view'
    AND event_timestamp BETWEEN NOW() - INTERVAL '6 days' AND NOW() - INTERVAL '3 days'
  GROUP BY property_id
)
SELECT
  p.id,
  COALESCE(r.views_last_3_days, 0) as recent,
  COALESCE(pv.views_prev_3_days, 1) as previous,
  (COALESCE(r.views_last_3_days, 0)::FLOAT / COALESCE(pv.views_prev_3_days, 1)::FLOAT) as growth_rate
FROM properties p
LEFT JOIN recent_views r ON p.id = r.property_id
LEFT JOIN previous_views pv ON p.id = pv.property_id
WHERE p.status = 'available'
  AND COALESCE(r.views_last_3_days, 0) >= 5  -- Minimum threshold
ORDER BY growth_rate DESC
LIMIT 10;
```

**Display**: "Rising" | "Trending Up" | "📈 Hot Right Now"

---

#### 3. RECENTLY SAVED Badge

**Criteria**: Top 10 properties by saves in last 7 days

**Query**:
```sql
SELECT
  p.id,
  COUNT(e.id) as recent_saves
FROM properties p
JOIN property_analytics_events e
  ON p.id = e.property_id
WHERE p.status = 'available'
  AND e.event_type = 'save'
  AND e.event_timestamp > NOW() - INTERVAL '7 days'
GROUP BY p.id
ORDER BY recent_saves DESC
LIMIT 10;
```

**Display**: "Popular" | "Most Saved" | "❤️ Favorite"

---

#### 4. UPDATED Badge

**Criteria**: Properties modified within last 3 days (any field change)

**Query**:
```sql
SELECT id, updated_at
FROM properties
WHERE status = 'available'
  AND updated_at > NOW() - INTERVAL '3 days'
  AND updated_at > created_at + INTERVAL '1 day'  -- Exclude brand new properties
ORDER BY updated_at DESC;
```

**Display**: "Updated" | "Recently Changed" | "🔄 Updated"

---

## Implementation Steps

### Phase 1: Database Setup (30 minutes)

1. Create `property_analytics_events` table
2. Add indexes for performance
3. Set up partitioning (optional, for scale)

### Phase 2: Analytics API Integration (1 hour)

1. Update Edge Functions to insert events instead of incrementing counters
2. Add deduplication logic (user fingerprinting)
3. Test event insertion

**Before (Current)**:
```typescript
// Edge Function: increment-view-count
await supabase
  .from('properties')
  .update({ views_count: views_count + 1 })
  .eq('id', propertyId);
```

**After (New)**:
```typescript
// Edge Function: track-view-event
await supabase
  .from('property_analytics_events')
  .insert({
    property_id: propertyId,
    event_type: 'view',
    user_fingerprint: hashFingerprint(request),
    event_timestamp: new Date().toISOString()
  });

// ALSO increment legacy counter for backwards compatibility
await supabase
  .from('properties')
  .update({ views_count: views_count + 1 })
  .eq('id', propertyId);
```

### Phase 3: Badge Query Functions (2 hours)

1. Create new badge query functions in `server-queries.ts`:
   - `getTrendingProperties()` - Last 7 days views
   - `getRisingStarProperties()` - Growth rate calculation
   - `getRecentlySavedProperties()` - Last 7 days saves
   - `getUpdatedProperties()` - Recent modifications

2. Update `getPropertyBadges()` to use new priority system

### Phase 4: Testing & Validation (1 hour)

1. Seed test data (create sample events)
2. Verify badge assignment
3. Test edge cases (ties, no data, etc.)

### Phase 5: Migration Strategy (30 minutes)

**Option A: Hard Cutover**
- Deploy new schema
- Switch badge logic immediately
- Backfill events from recent analytics API logs (if available)

**Option B: Gradual Migration**
- Deploy events table alongside existing counters
- Run both systems in parallel for 1 week
- Validate data consistency
- Switch badge logic after confidence built

---

## Performance Benchmarks

**Expected Query Times** (100k events, 1k properties):

| Query | Without Index | With Index | Materialized View |
|-------|---------------|------------|-------------------|
| Trending (7d) | 250ms | 45ms | 5ms |
| Rising Star | 400ms | 80ms | 10ms |
| Recently Saved | 200ms | 40ms | 5ms |
| Updated | 5ms | 2ms | N/A |

**Storage Estimates**:

| Data | Size/Event | 1 Month | 1 Year |
|------|-----------|---------|--------|
| Events | 100 bytes | 30 MB (10k events/day) | 365 MB |
| Indexes | 50% overhead | 15 MB | 183 MB |
| **Total** | - | **45 MB** | **548 MB** |

**Conclusion**: Very manageable, even at high scale.

---

## Alternative: Simplified Time-Based Badges

If full event tracking is too complex, here's a **minimal viable implementation**:

**Add just 2 fields**:
```sql
ALTER TABLE properties
  ADD COLUMN views_last_7_days INTEGER DEFAULT 0,
  ADD COLUMN last_view_decay_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

**Daily Cron Job** (decay old views):
```sql
-- Run at midnight UTC
UPDATE properties
SET views_last_7_days = GREATEST(0, views_last_7_days - (
  EXTRACT(EPOCH FROM (NOW() - last_view_decay_at)) / 86400  -- Days since last decay
)),
last_view_decay_at = NOW()
WHERE last_view_decay_at < NOW() - INTERVAL '1 day';
```

**Analytics API** (increment recent views):
```typescript
await supabase
  .from('properties')
  .update({
    views_count: views_count + 1,           // All-time (existing)
    views_last_7_days: views_last_7_days + 1  // Recent (new)
  })
  .eq('id', propertyId);
```

**Badge Query**:
```typescript
export async function getTrendingProperties(): Promise<Property[]> {
  const data = await supabaseFetch<Property>('properties', {
    status: 'eq.available',
    order: 'views_last_7_days.desc',
    limit: '10',
    select: '*',
  });
  return data || [];
}
```

**Pros**: Dead simple, no new tables
**Cons**: Approximate (decay-based, not exact), no historical analytics

---

## Recommendation

**For Production**: Use **Option 2 (Event-Based)** with **Hybrid Option** for optimization

**Timeline**:
- Week 1: Implement event tracking table + basic queries
- Week 2: Integrate with analytics API
- Week 3: Update badge logic + test
- Week 4: Monitor performance, optimize if needed

**Quick Win**: Start with **Simplified Approach** (add `views_last_7_days`), migrate to events table later

---

## Localization for New Badges

Add translations for badge display:

```typescript
// In components (PropertyCard, etc.)
const BADGE_TRANSLATIONS = {
  trending: {
    es: 'Tendencia',
    en: 'Trending',
    ru: 'В тренде'
  },
  'rising-star': {
    es: 'En Aumento',
    en: 'Rising',
    ru: 'Растущий'
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
  },
  hot: {
    es: 'Popular',
    en: 'Hot',
    ru: 'Горячее'
  }
};

// Usage in component
const badgeText = BADGE_TRANSLATIONS[property.badge]?.[locale] || property.badge;
```

---

## Monitoring & Alerts

**Metrics to Track**:

1. **Badge Distribution**
   ```sql
   -- Count properties by badge type
   SELECT badge, COUNT(*) as count
   FROM properties
   WHERE status = 'available' AND badge IS NOT NULL
   GROUP BY badge;
   ```

2. **Badge Turnover Rate**
   - % of properties changing badges week-over-week
   - High turnover = dynamic, healthy system
   - Low turnover = stagnation, investigate

3. **Events Per Day**
   ```sql
   SELECT DATE(event_timestamp) as date, COUNT(*) as events
   FROM property_analytics_events
   WHERE event_timestamp > NOW() - INTERVAL '30 days'
   GROUP BY DATE(event_timestamp);
   ```

4. **Zero-Badge Properties**
   ```sql
   -- Properties without any badge (should be < 50%)
   SELECT COUNT(*) FROM properties
   WHERE status = 'available' AND badge IS NULL;
   ```

---

## Success Criteria

**Define success metrics before implementation**:

- ✅ **Badge Freshness**: Top 10 "trending" properties change daily
- ✅ **Coverage**: > 30% of available properties have a badge
- ✅ **User Engagement**: CTR on badged properties > 2x unbadged
- ✅ **Performance**: Badge query time < 100ms (p95)
- ✅ **Accuracy**: Manual validation confirms badges are meaningful

---

## Future Enhancements

Once event-based system is in place, unlock advanced features:

1. **Heatmaps**: Visualize when properties get most views (time of day, day of week)
2. **User Segments**: Different badges for different user types (investors, families, retirees)
3. **Seasonal Trends**: Identify seasonal patterns (summer spike for beach properties)
4. **Predictive Badges**: ML-based "Likely to Sell Soon" badge
5. **Personalized Badges**: "Recommended for You" based on user behavior

---

**Last Updated**: 2026-01-05
**Status**: Proposal (Pending Approval)
**Estimated Effort**: 1 week for full event-based implementation
**Quick Win Effort**: 2-3 hours for simplified time-windowed badges
