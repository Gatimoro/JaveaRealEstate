-- ============================================================================
-- DATABASE SCHEMA FIXES - Javea Real Estate
-- ============================================================================
-- Run this in your Supabase SQL Editor
-- Project: https://app.supabase.com/project/cqoqbbdypebzawgmtazv/sql
-- ============================================================================

-- ============================================================================
-- FIX 1: Add Missing Spanish Translation Columns
-- ============================================================================

-- Add Spanish title column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS title_es TEXT;

-- Add Spanish description column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- Add Spanish features column (for consistency with RU/EN)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS features_es JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for Spanish features (for fast JSONB queries)
CREATE INDEX IF NOT EXISTS idx_properties_features_es
ON properties USING GIN (features_es);

-- ============================================================================
-- FIX 2: Verify All Translation Columns Exist
-- ============================================================================

-- This query shows all translation-related columns
-- Run this to verify the schema is correct:
/*
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name LIKE '%_en'
   OR column_name LIKE '%_es'
   OR column_name LIKE '%_ru'
ORDER BY column_name;

Expected output:
- description_en (text)
- description_es (text) ← NEW
- description_ru (text)
- features_en (jsonb)
- features_es (jsonb) ← NEW
- features_ru (jsonb)
- title_en (text)
- title_es (text) ← NEW
- title_ru (text)
*/

-- ============================================================================
-- INVESTIGATION: Find Missing Properties (68 uploaded vs 62 showing)
-- ============================================================================

-- Check 1: Count properties by status
SELECT
  status,
  COUNT(*) as count
FROM properties
GROUP BY status
ORDER BY count DESC;

-- Expected: If 6 properties are 'sold', they won't show in frontend
-- Frontend queries only show 'available' properties


-- Check 2: Find properties with status != 'available'
SELECT
  id,
  title,
  status,
  price,
  created_at
FROM properties
WHERE status != 'available'
ORDER BY created_at DESC
LIMIT 10;


-- Check 3: Properties with invalid data (price = 0 or NULL)
SELECT
  id,
  title,
  price,
  status,
  CASE
    WHEN price IS NULL THEN 'NULL price'
    WHEN price = 0 THEN 'Zero price'
    ELSE 'Valid'
  END as issue
FROM properties
WHERE price IS NULL OR price = 0;


-- Check 4: Properties with no images
SELECT
  id,
  title,
  status,
  jsonb_array_length(images) as image_count
FROM properties
WHERE jsonb_array_length(images) = 0
   OR images IS NULL
   OR images = '[]'::jsonb
ORDER BY created_at DESC
LIMIT 10;


-- Check 5: Find duplicate source_reference
SELECT
  source_reference,
  COUNT(*) as count,
  array_agg(id) as property_ids
FROM properties
WHERE source_reference IS NOT NULL
GROUP BY source_reference
HAVING COUNT(*) > 1
ORDER BY count DESC;


-- Check 6: Total count verification
SELECT
  'Total properties in DB' as check_name,
  COUNT(*) as count
FROM properties

UNION ALL

SELECT
  'Available properties' as check_name,
  COUNT(*) as count
FROM properties
WHERE status = 'available'

UNION ALL

SELECT
  'Reserved properties' as check_name,
  COUNT(*) as count
FROM properties
WHERE status = 'reserved'

UNION ALL

SELECT
  'Sold properties' as check_name,
  COUNT(*) as count
FROM properties
WHERE status = 'sold';


-- ============================================================================
-- OPTIONAL: Clean Up Unused Columns (DO NOT RUN - FOR REFERENCE ONLY)
-- ============================================================================

-- These columns are defined but not actively used:
-- - badge (TEXT) - Generated dynamically in code
-- - clicks_count (INTEGER) - Never incremented
-- - source_reference (TEXT) - Populated but not displayed

-- If you want to remove them in the future:
/*
ALTER TABLE properties DROP COLUMN IF EXISTS badge;
ALTER TABLE properties DROP COLUMN IF EXISTS clicks_count;
-- Keep source_reference for debugging even if not displayed
*/

-- ============================================================================
-- HELPFUL QUERIES FOR DEVELOPMENT
-- ============================================================================

-- View sample properties with all translation fields
/*
SELECT
  id,
  title,
  title_en,
  title_es,
  title_ru,
  LEFT(description, 50) as description_preview,
  price,
  location,
  status
FROM properties
ORDER BY created_at DESC
LIMIT 5;
*/

-- Count properties by municipality (extracted from location field)
/*
SELECT
  SPLIT_PART(location, ',', 1) as municipality,
  COUNT(*) as count
FROM properties
GROUP BY municipality
ORDER BY count DESC;
*/

-- Find properties without translations
/*
SELECT
  id,
  title,
  CASE WHEN title_en IS NULL THEN '❌' ELSE '✅' END as has_en,
  CASE WHEN title_es IS NULL THEN '❌' ELSE '✅' END as has_es,
  CASE WHEN title_ru IS NULL THEN '❌' ELSE '✅' END as has_ru,
  created_at
FROM properties
WHERE title_es IS NULL
   OR title_ru IS NULL
ORDER BY created_at DESC
LIMIT 20;
*/

-- ============================================================================
-- DEPLOYMENT NOTES
-- ============================================================================

/*
After running these fixes:

1. ✅ Database will have all required Spanish columns
2. ✅ You can now use new_upload.py with --translate flag
3. ✅ All 3 languages (EN, ES, RU) will be stored properly

Next steps:
1. Run this SQL file in Supabase
2. Fix new_upload.py (see CLEANUP_PLAN.md)
3. Re-scrape properties: python scripts/new_scraper.py
4. Upload with translations: python scripts/new_upload.py scraped-properties.json --translate --upload
5. Verify frontend shows all languages correctly
*/
