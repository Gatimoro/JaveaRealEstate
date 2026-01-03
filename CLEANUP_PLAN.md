# Javea Real Estate - Cleanup & Fix Plan

## Executive Summary

**Issues Found:**
1. ❌ Database schema missing `title_es` and `description_es` columns
2. ❌ `new_upload.py` saves English description to BOTH `description` AND `description_en` (bug)
3. ❌ 1.8 MB of generated JSON files committed to git (should be ignored)
4. ❌ Legacy `scripts/scraper.py` is redundant (replaced by `new_scraper.py`)
5. ⚠️ `process_and_upload.py` overlaps with `new_upload.py` (workflow unclear)

---

## 🗑️ FILES TO DELETE

### 1. Generated Data Files (1.8 MB total)
These are build artifacts and should never be in git:

```bash
# Delete generated JSON files from root
rm -f scraped-properties.json
rm -f scraped-properties-translated.json
rm -f processed-properties.json
rm -f unique-properties.json

# Delete duplicate in scripts/
rm -f scripts/scraped-properties.json
```

### 2. Legacy Scripts
`scripts/scraper.py` (13 KB) - Replaced by `new_scraper.py`

```bash
# Archive or delete the old scraper
rm -f scripts/scraper.py
```

**Reason:** `new_scraper.py` is superior with:
- Better location parsing (municipality + area)
- Valencian spelling support
- More robust feature extraction

### 3. Optional: Workflow Consolidation
You have TWO upload workflows:

**Option A:** Simple workflow (recommended for most use)
```
new_scraper.py → new_upload.py → Supabase
```

**Option B:** Advanced workflow (with deduplication)
```
new_scraper.py → process_and_upload.py → Supabase
```

**Decision needed:** If you don't need geocoding + deduplication, consider removing `process_and_upload.py`

---

## 🗄️ DATABASE SCHEMA FIXES

### Issue 1: Missing Spanish Translation Columns

Your schema has:
- ✅ `title`, `title_en`, `title_ru`
- ✅ `description`, `description_en`, `description_ru`
- ❌ Missing: `title_es`, `description_es`

But `new_upload.py` tries to save `title_es` and `description_es`!

**Fix:** Add the missing columns

```sql
-- Add Spanish translation columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- Also add Spanish features (for consistency)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS features_es JSONB DEFAULT '[]'::jsonb;

-- Create index for Spanish features
CREATE INDEX IF NOT EXISTS idx_properties_features_es
ON properties USING GIN (features_es);
```

### Issue 2: Unused Columns

The following columns are defined but NOT populated or used:

```sql
-- Currently in schema but unused:
-- ❌ badge (TEXT) - Badges are generated dynamically in code
-- ❌ clicks_count (INTEGER) - Never incremented in frontend
-- ⚠️ source_reference - Populated but never displayed in UI
```

**Recommendation:** Keep them for now (future use), but be aware they're not actively used.

### Issue 3: Language Handling Confusion

**Current behavior:**
- `title` = English title (from scraper)
- `description` = English description (from scraper)
- `title_en` = English title (duplicate!)
- `description_en` = English description (duplicate!)

**Proposed behavior (option 1 - Spanish as base):**
- `title` = Spanish title (default language)
- `description` = Spanish description
- `title_en` = English translation
- `title_ru` = Russian translation

**Proposed behavior (option 2 - Keep current, fix bug):**
- `title` = Original title (English from scraper)
- `description` = Original description (English from scraper)
- `title_XX` = Translations to specific languages

**I recommend Option 2** since changing the base language would require:
1. Updating all existing data
2. Changing frontend expectations
3. More complex migration

---

## 🐛 CODE FIXES

### Fix 1: `new_upload.py` - Description Duplication Bug

**Location:** `scripts/new_upload.py:256-257`

**Current code (WRONG):**
```python
return {
    # ... other fields ...
    'description': prop.get('description'),           # ← English
    'description_en': prop.get('description_en') or prop.get('description'),  # ← Also English!
    'description_ru': prop.get('description_ru'),
}
```

**Problem:** English description is saved TWICE to both `description` and `description_en`

**Fix:** Determine the base language strategy

**Option A:** If `description` should be Spanish (base language is Spanish):
```python
'description': prop.get('description_es'),     # Spanish as base
'description_en': prop.get('description_en'),  # English translation
'description_es': prop.get('description_es'),  # Spanish translation
'description_ru': prop.get('description_ru'),  # Russian translation
```

**Option B:** If `description` should be original scraped (English):
```python
'description': prop.get('description'),        # Original (English)
'description_en': prop.get('description_en'),  # English (same as description)
'description_es': prop.get('description_es'),  # Spanish translation
'description_ru': prop.get('description_ru'),  # Russian translation
```

**I recommend Option B** for backward compatibility.

### Fix 2: `new_upload.py` - Add Spanish Translation Support

**Location:** `scripts/new_upload.py:add_translations` function (line 146-188)

**Current code:** Translates EN → ES and EN → RU, but stores ES as `description_es`

**Issue:** The `prepare_for_upload` function doesn't include `title_es` or `features_es`

**Fix:** Update `prepare_for_upload` to include Spanish fields:

```python
def prepare_for_upload(prop: Dict) -> Dict:
    # ... existing code ...

    return {
        'id': prop['id'],
        'type': db_type,
        'title': prop.get('title'),                    # Original (EN)
        'title_en': prop.get('title_en'),              # English
        'title_es': prop.get('title_es'),              # ← ADD THIS
        'title_ru': prop.get('title_ru'),              # Russian
        'price': prop['price'],
        'location': location,
        'description': prop.get('description'),        # Original (EN)
        'description_en': prop.get('description_en'),  # English
        'description_es': prop.get('description_es'),  # ← ADD THIS
        'description_ru': prop.get('description_ru'),  # Russian
        'images': prop.get('images', []),
        'features': prop.get('features', []),          # Original (EN)
        'features_en': prop.get('features_en'),        # ← ADD THIS
        'features_es': prop.get('features_es'),        # ← ADD THIS
        'features_ru': prop.get('features_ru'),        # Russian
        'specs': specs,
        'source_url': prop.get('source_url'),
        'source_reference': prop.get('source_reference'),
        'status': prop.get('status', 'available'),
        'scraped_at': prop.get('scraped_at'),
        'updated_at': datetime.now().isoformat(),
    }
```

### Fix 3: Add Feature Translation in `add_translations`

Currently, `add_translations` only translates titles and descriptions, not features.

**Location:** `scripts/new_upload.py:add_translations` (line 146)

**Add after line 187:**
```python
    # Translate features
    features = prop.get('features', [])
    if features:
        result['features_en'] = features  # Original is English

        # Translate each feature to Spanish
        features_es = []
        for feature in features:
            try:
                translated = translate_text(feature, 'es')
                features_es.append(translated if translated else feature)
            except:
                features_es.append(feature)
        result['features_es'] = features_es

        # Translate each feature to Russian
        features_ru = []
        for feature in features:
            try:
                translated = translate_text(feature, 'ru')
                features_ru.append(translated if translated else feature)
            except:
                features_ru.append(feature)
        result['features_ru'] = features_ru

    return result
```

---

## 📝 RECOMMENDED WORKFLOW

### 1. Scraping Properties
```bash
cd /home/user/JaveaRealEstate
python scripts/new_scraper.py --output scraped-properties.json
```

**Output:** `scraped-properties.json` (English descriptions, features, titles)

### 2. Translate and Upload
```bash
python scripts/new_upload.py scraped-properties.json --translate --upload
```

**What it does:**
1. Translates EN → ES, RU
2. Saves to `scraped-properties-translated.json`
3. Uploads to Supabase
4. Clears Vercel cache

### 3. Optional: Full Pipeline with Deduplication
```bash
python scripts/new_scraper.py
python scripts/process_and_upload.py scraped-properties.json --upload
```

**What it adds:**
- Geocoding (coordinates)
- Deduplication (removes duplicates within 30m)
- Municipality/area extraction

---

## 🔧 .GITIGNORE UPDATES

Add these lines to `.gitignore`:

```gitignore
# Scraped data files (generated, not source code)
scraped-properties.json
scraped-properties-translated.json
processed-properties.json
unique-properties.json
scripts/scraped-properties.json
**/scraped-*.json
```

---

## 🗑️ COMPLETE CLEANUP SCRIPT

Run this to clean up all unnecessary files:

```bash
#!/bin/bash
# Cleanup script for Javea Real Estate

echo "🧹 Cleaning up Javea Real Estate codebase..."

# Delete generated JSON files
echo "📦 Deleting generated JSON files..."
rm -f scraped-properties.json
rm -f scraped-properties-translated.json
rm -f processed-properties.json
rm -f unique-properties.json
rm -f scripts/scraped-properties.json

# Delete legacy scripts
echo "🗑️  Deleting legacy scripts..."
rm -f scripts/scraper.py

echo "✅ Cleanup complete!"
echo ""
echo "📊 File size savings: ~1.8 MB"
echo ""
echo "Next steps:"
echo "  1. Run the SQL commands to add missing Spanish columns"
echo "  2. Fix new_upload.py as described in CLEANUP_PLAN.md"
echo "  3. Update .gitignore"
echo "  4. Commit changes"
```

---

## 📊 MISSING PROPERTIES INVESTIGATION (68 → 62)

You mentioned 68 properties uploaded but only 62 showing. Here are possible causes:

### 1. Check Property Status
```sql
-- Count properties by status
SELECT status, COUNT(*) as count
FROM properties
GROUP BY status;

-- Find non-available properties
SELECT id, title, status, price
FROM properties
WHERE status != 'available'
ORDER BY created_at DESC;
```

### 2. Check for Invalid Data
```sql
-- Properties with price = 0
SELECT id, title, price, status
FROM properties
WHERE price = 0 OR price IS NULL;

-- Properties with no images
SELECT id, title, jsonb_array_length(images) as image_count
FROM properties
WHERE jsonb_array_length(images) = 0;

-- Properties with missing required fields
SELECT id, title, location, type
FROM properties
WHERE location IS NULL
   OR location = ''
   OR type IS NULL;
```

### 3. Check RLS Policies
```sql
-- The RLS policy only shows 'available' or 'reserved' properties
-- Check if 6 properties are marked as 'sold'
SELECT status, COUNT(*)
FROM properties
GROUP BY status;
```

### 4. Check for Duplicates
```sql
-- Find properties with duplicate source_reference
SELECT source_reference, COUNT(*) as count
FROM properties
GROUP BY source_reference
HAVING COUNT(*) > 1;

-- Find properties with duplicate titles
SELECT title, COUNT(*) as count
FROM properties
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

**Most likely cause:** 6 properties are marked as `status = 'sold'` and filtered out by frontend queries (which only show 'available').

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Run SQL commands to add Spanish columns
- [ ] Fix `new_upload.py` prepare_for_upload function
- [ ] Add feature translation to `add_translations` function
- [ ] Delete generated JSON files
- [ ] Delete legacy `scripts/scraper.py`
- [ ] Update `.gitignore`
- [ ] Investigate 68 vs 62 properties discrepancy
- [ ] Re-scrape and upload with fixed scripts
- [ ] Verify all 3 languages (EN, ES, RU) are populated
- [ ] Test frontend displays all languages correctly

---

## 🎯 SUMMARY OF FIXES

| Issue | Fix | Priority |
|-------|-----|----------|
| Missing `title_es`, `description_es` columns | Add SQL columns | 🔴 HIGH |
| Description saved twice (EN) | Fix `prepare_for_upload` | 🔴 HIGH |
| 1.8 MB JSON files in git | Delete + update .gitignore | 🟡 MEDIUM |
| Legacy `scraper.py` | Delete file | 🟡 MEDIUM |
| Features not translated | Add feature translation | 🟢 LOW |
| 68 vs 62 properties | Run investigation SQL | 🔴 HIGH |

