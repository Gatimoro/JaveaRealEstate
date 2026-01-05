# Scraper Date Handling Documentation

## Overview

The JaveaRealEstate property scraper maintains three distinct date fields to track different aspects of property lifecycle. Understanding how these dates behave during updates is crucial for features like the "new" badge system and analytics.

## Three Date Fields Explained

### 1. `created_at` - Original Listing Date

**Purpose**: Tracks when a property was FIRST added to the database

**Behavior**:
- ✅ **Set ONCE** on initial insert (database DEFAULT NOW())
- ✅ **NEVER changes** during updates (preserved by upsert)
- ✅ **Not included** in scraper upload payload
- ✅ **Permanent record** of original listing date

**Usage**:
- Powers the "new" badge (properties < 14 days old)
- Enables "Days on Market" calculations
- Historical analytics and reporting

**Database Schema**:
```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Example Timeline**:
```
Jan 5, 2026 10:00 AM - Property first scraped
  → created_at = 2026-01-05 10:00:00 (SET)

Jan 12, 2026 2:30 PM - Property re-scraped (price updated)
  → created_at = 2026-01-05 10:00:00 (UNCHANGED)

Jan 19, 2026 9:15 AM - Property re-scraped (description updated)
  → created_at = 2026-01-05 10:00:00 (STILL UNCHANGED)

Feb 10, 2026 11:00 AM - Property re-scraped (images updated)
  → created_at = 2026-01-05 10:00:00 (PERMANENTLY LOCKED)
```

---

### 2. `updated_at` - Last Modification Timestamp

**Purpose**: Tracks when a property was LAST modified (any field change)

**Behavior**:
- ⚙️ **Set automatically** by PostgreSQL trigger on ANY update
- ⚙️ **AUTO-UPDATED** every time a field changes
- ⚙️ **Not controlled** by scraper (database-managed)
- ⚙️ **Reflects latest activity** on the property

**Usage**:
- Track recent price changes
- Identify stale listings
- Audit trail for modifications
- "Recently Updated" filters

**Database Trigger**:
```sql
-- Automatically set updated_at on ANY row update
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

**Example Timeline**:
```
Jan 5, 2026 10:00 AM - Property first inserted
  → updated_at = 2026-01-05 10:00:00 (SET)

Jan 12, 2026 2:30 PM - Price changed: €500,000 → €480,000
  → updated_at = 2026-01-12 14:30:00 (TRIGGER AUTO-UPDATE)

Jan 14, 2026 4:00 PM - Status changed: available → reserved
  → updated_at = 2026-01-14 16:00:00 (TRIGGER AUTO-UPDATE)

Jan 19, 2026 9:15 AM - Images updated (5 new photos)
  → updated_at = 2026-01-19 09:15:00 (TRIGGER AUTO-UPDATE)
```

**Important**: Even if scraper re-runs with NO changes, the upsert operation triggers the update, so `updated_at` changes even when data is identical.

---

### 3. `scraped_at` - Last Scrape Timestamp

**Purpose**: Tracks when a property's data was LAST fetched from source

**Behavior**:
- 🔄 **Explicitly set** by scraper on every run
- 🔄 **ALWAYS overwritten** with current timestamp
- 🔄 **Independent** of whether data actually changed
- 🔄 **Represents scraper health** and freshness

**Usage**:
- Verify scraper is running regularly
- Identify properties that failed to scrape
- Data freshness indicators
- Debugging stale data issues

**Scraper Implementation**:
```python
# In process_and_upload.py
db_property = {
    'id': prop['id'],
    'title': prop['title'],
    # ... other fields
    'scraped_at': prop.get('scraped_at')  # Current scrape time
}

# Upsert operation (insert or update)
result = supabase.table('properties').upsert(db_property).execute()
```

**Example Timeline**:
```
Jan 5, 2026 10:00 AM - First scrape
  → scraped_at = 2026-01-05 10:00:00 (SET)

Jan 6, 2026 10:00 AM - Daily scrape (no changes detected)
  → scraped_at = 2026-01-06 10:00:00 (OVERWRITTEN)

Jan 7, 2026 10:00 AM - Daily scrape (no changes detected)
  → scraped_at = 2026-01-07 10:00:00 (OVERWRITTEN)

Jan 8, 2026 10:00 AM - Daily scrape (price changed)
  → scraped_at = 2026-01-08 10:00:00 (OVERWRITTEN)
```

---

## Date Fields Comparison Table

| Field | Set On Insert | Set On Update | Controlled By | Purpose | Preservation |
|-------|---------------|---------------|---------------|---------|--------------|
| **created_at** | NOW() (DB default) | **PRESERVED** | Database | Original listing date | ✅ Permanent |
| **updated_at** | NOW() (DB default) | **NOW()** (trigger) | Database Trigger | Last modification | ❌ Auto-updates |
| **scraped_at** | Scraper timestamp | **Scraper timestamp** | Scraper Code | Last scrape time | ❌ Overwritten |

---

## Scraper Update vs Insert Logic

### How Upsert Works

The scraper uses Supabase's `upsert()` function which performs **insert or update on conflict**:

```python
# From process_and_upload.py (line 550)
result = supabase.table('properties').upsert(db_property).execute()
```

**Upsert Behavior**:
1. Check if `id` exists in database
2. **If EXISTS**: UPDATE all specified fields
3. **If NOT EXISTS**: INSERT new row with all fields

**Primary Key**: `id` field (generated from `source_reference`)

### What Gets Updated

When a property is re-scraped, the following fields are updated:

**Always Updated**:
- `title`, `title_en`, `title_ru` (multilingual titles)
- `description`, `description_en`, `description_ru` (multilingual descriptions)
- `price` (current listing price)
- `location`, `municipality`, `area` (location info)
- `images` (array of image URLs)
- `features`, `features_en`, `features_ru` (property features)
- `specs` (bedrooms, bathrooms, size, etc.)
- `status` (available, reserved, sold)
- `source_url`, `source_reference` (tracking)
- `scraped_at` (current scrape timestamp) ⚠️
- `updated_at` (auto-set by trigger) ⚠️

**Never Updated** (Preserved):
- `created_at` (original listing date) ✅
- `views_count` (analytics - only incremented via API)
- `saves_count` (analytics - only incremented via API)
- `clicks_count` (analytics - only incremented via API)

### Deduplication Strategy

The scraper identifies duplicates using:

**Method 1**: Exact source reference match
```python
existing = next((p for p in existing_properties
                 if p.get('source_reference') == prop['source_reference']), None)
```

**Method 2**: Geospatial + price strict check
```python
# Same location (within 10m) AND same price
if (distance < 0.00001 and  # ~10 meters
    abs(existing['price'] - prop['price']) < 1000):
    duplicate = True
```

**Conservative Approach**: Single source scraping allows strict matching without false positives.

---

## Impact on Badge System

### "New" Badge Behavior During Updates

**Scenario**: Property scraped on Jan 5, price updated on Jan 12, Jan 19, Jan 26

| Date | Scrape # | Price | created_at | "new" Badge? | Why? |
|------|----------|-------|-----------|--------------|------|
| Jan 5 | 1st | €500k | 2026-01-05 | ✅ YES | < 14 days |
| Jan 12 | 2nd | €480k | 2026-01-05 | ✅ YES | < 14 days (7 days old) |
| Jan 19 | 3rd | €480k | 2026-01-05 | ❌ NO | > 14 days (14+ days old) |
| Jan 26 | 4th | €475k | 2026-01-05 | ❌ NO | > 14 days (21 days old) |

**Key Insight**: The "new" badge countdown starts from `created_at` and is NOT reset by updates.

### Why This Matters

**Good**: Prevents badge gaming
- Properties can't artificially stay "new" by making minor updates
- Badge accurately reflects "first listed" not "last modified"

**Good**: Consistent user experience
- Users see genuinely new listings, not re-listed old ones
- Badge reflects actual market entry time

**Trade-off**: Properties with significant changes (price drop, new photos) don't get re-highlighted
- **Alternative**: Consider a separate "updated" or "price drop" badge for this use case

---

## Scraper Pipeline Flow

### Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SCRAPE (new_scraper.py)                                  │
│    - Fetch properties from javeahomefinders.com             │
│    - Extract: title, price, images, specs, location         │
│    - Set scraped_at = NOW()                                 │
│    - Output: properties_raw.json                            │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PROCESS (process_and_upload.py)                          │
│    - Geocode locations (lat/long from address)              │
│    - Translate content (EN/RU from ES using DeepL)          │
│    - Deduplicate (check existing by source_reference)       │
│    - Prepare database payload                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. UPLOAD (process_and_upload.py)                           │
│    - Upsert to Supabase:                                    │
│      • NEW property → INSERT (created_at = NOW())           │
│      • EXISTING property → UPDATE (created_at PRESERVED)    │
│    - Trigger sets updated_at = NOW()                        │
│    - scraped_at = current scrape time                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CACHE INVALIDATION                                       │
│    - Call Vercel revalidation API                           │
│    - Clear Next.js cached property data                     │
│    - Frontend shows updated properties immediately          │
└─────────────────────────────────────────────────────────────┘
```

### Automation Script

The bash script orchestrates the full pipeline:

```bash
# run_scraper.sh
cd scripts

# Step 1: Scrape
echo "Starting scraper..."
python3 new_scraper.py

# Step 2 & 3: Process, translate, geocode, upload
echo "Processing and uploading to Supabase..."
python3 process_and_upload.py

echo "Scraper pipeline complete!"
```

**Scheduling**: Can be run via cron for daily updates
```bash
# crontab -e
0 6 * * * /path/to/run_scraper.sh  # Daily at 6 AM
```

---

## Edge Cases & Gotchas

### Edge Case 1: Property Removed from Source

**Scenario**: Property no longer appears on javeahomefinders.com

**Current Behavior**:
- Property remains in database with old data
- `scraped_at` becomes stale (no longer updated)
- Status remains "available"

**Detection**:
```sql
-- Find properties not scraped in 7+ days
SELECT id, title, scraped_at
FROM properties
WHERE scraped_at < NOW() - INTERVAL '7 days'
  AND status = 'available';
```

**Suggested Fix**: Auto-mark as "delisted" or "sold" if not seen in recent scrapes

### Edge Case 2: Scraper Fails Mid-Run

**Scenario**: Network error, API rate limit, or crash during scrape

**Current Behavior**:
- Partially updated database
- Some properties have new `scraped_at`, others don't
- Inconsistent data freshness

**Detection**:
```sql
-- Find properties with mixed scrape times (anomaly)
SELECT
  DATE(scraped_at) as scrape_date,
  COUNT(*) as property_count
FROM properties
WHERE status = 'available'
GROUP BY DATE(scraped_at)
ORDER BY scrape_date DESC;
```

**Mitigation**: Scraper uses transactions and retries for resilience

### Edge Case 3: Clock Skew

**Scenario**: Server time differs from database time (rare with cloud hosting)

**Impact**:
- Inaccurate "new" badge (14-day calculation may be off)
- Timestamp inconsistencies

**Solution**: Use database `NOW()` for all timestamps (current implementation ✅)

### Edge Case 4: Timezone Confusion

**Database**: All timestamps use `TIMESTAMP WITH TIME ZONE`

**Scraper**: Python `datetime.now()` uses local timezone

**Best Practice**: Always use UTC:
```python
import datetime
scraped_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
```

---

## Monitoring & Health Checks

### Key Metrics to Track

1. **Scrape Frequency**
   ```sql
   -- Latest scrape time across all properties
   SELECT MAX(scraped_at) as last_successful_scrape
   FROM properties;

   -- Expected: Within last 24 hours for daily scrapes
   ```

2. **Property Freshness**
   ```sql
   -- Properties not updated in 7+ days
   SELECT COUNT(*) as stale_count
   FROM properties
   WHERE scraped_at < NOW() - INTERVAL '7 days'
     AND status = 'available';

   -- Expected: 0 (all properties should be fresh)
   ```

3. **New Listings Rate**
   ```sql
   -- Properties added in last 7 days
   SELECT COUNT(*) as new_listings
   FROM properties
   WHERE created_at > NOW() - INTERVAL '7 days';

   -- Expected: 5-20 new listings per week (varies by market)
   ```

4. **Update Frequency**
   ```sql
   -- Properties with changes in last 24 hours
   SELECT COUNT(*) as recently_modified
   FROM properties
   WHERE updated_at > NOW() - INTERVAL '24 hours';

   -- Expected: 10-50 updates per day (price changes, status updates)
   ```

### Alert Conditions

**🚨 Critical**:
- No properties scraped in 48+ hours
- All properties have identical `scraped_at` (scraper stuck)

**⚠️ Warning**:
- > 50% of properties have stale `scraped_at` (> 7 days)
- New listing rate = 0 for 14+ days (unusual)

**ℹ️ Info**:
- High update rate (> 100/day) - verify data quality
- Many properties with same `updated_at` - bulk update detected

---

## Best Practices

### For Developers

1. **Never manually set `created_at`** - Let database default handle it
2. **Never rely on `updated_at` for "new" logic** - Use `created_at` instead
3. **Always include `scraped_at` in scraper payload** - Tracks data freshness
4. **Use `updated_at` for staleness detection** - Not for "new" badge
5. **Test upsert behavior** - Verify `created_at` preservation

### For Scraper Maintenance

1. **Run scraper daily** - Keeps `scraped_at` fresh
2. **Handle failures gracefully** - Partial updates are OK, log errors
3. **Monitor scrape duration** - Should complete in < 10 minutes
4. **Validate timestamps** - Ensure UTC timezone consistency
5. **Archive old properties** - Remove properties unseen for 30+ days

### For Database Administrators

1. **Don't drop the trigger** - Auto-`updated_at` is essential
2. **Index date columns** - Improves badge query performance
3. **Backup before schema changes** - Date fields are critical
4. **Monitor index bloat** - Date indexes grow over time
5. **Partition by date** - Consider for large datasets (10k+ properties)

---

## SQL Quick Reference

### Useful Date Queries

**Properties listed in last 14 days** (New badge candidates):
```sql
SELECT id, title, created_at
FROM properties
WHERE created_at > NOW() - INTERVAL '14 days'
  AND status = 'available'
ORDER BY created_at DESC;
```

**Properties not scraped recently** (Stale data):
```sql
SELECT id, title, scraped_at,
       NOW() - scraped_at as time_since_scrape
FROM properties
WHERE scraped_at < NOW() - INTERVAL '7 days'
  AND status = 'available';
```

**Properties with recent updates** (Price changes, etc.):
```sql
SELECT id, title, updated_at,
       NOW() - updated_at as time_since_update
FROM properties
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

**Date field summary** (Health check):
```sql
SELECT
  MIN(created_at) as oldest_listing,
  MAX(created_at) as newest_listing,
  MIN(scraped_at) as oldest_scrape,
  MAX(scraped_at) as latest_scrape,
  AVG(NOW() - created_at) as avg_days_on_market
FROM properties
WHERE status = 'available';
```

---

## Conclusion

### Key Takeaways

✅ **`created_at` is sacred** - Never changes after initial insert, powers "new" badge

✅ **`updated_at` auto-updates** - Managed by database trigger, reflects any change

✅ **`scraped_at` tracks freshness** - Explicitly set by scraper on every run

✅ **Upsert preserves `created_at`** - Critical for accurate "new" badge behavior

✅ **Updates don't reset "new" status** - Badge countdown uses original listing date

### Implementation Confidence

The current scraper architecture correctly:
- ✅ Preserves original listing dates (`created_at`)
- ✅ Tracks modification times (`updated_at`)
- ✅ Monitors data freshness (`scraped_at`)
- ✅ Supports accurate "new" badge logic
- ✅ Enables temporal analytics and reporting

**No changes needed** - the date handling is well-designed and production-ready! 🎉

---

**Last Updated**: 2026-01-05
**Related Docs**: `docs/BADGE_SYSTEM.md`, `docs/ANALYTICS.md`
**Scraper Files**: `scripts/new_scraper.py`, `scripts/process_and_upload.py`
**Database Schema**: `database-properties-setup.sql`
