# Quick Start Guide - After Cleanup

## ✅ What Was Fixed

1. **Database Schema** - Added missing Spanish columns
2. **Upload Script** - Fixed description duplication bug
3. **Codebase** - Removed 1.8 MB of generated files
4. **Git** - Updated .gitignore to prevent committing generated data

---

## 🚀 Quick Commands

### 1. Apply Database Schema Fixes

Run this SQL in Supabase SQL Editor:
```bash
# Open: https://app.supabase.com/project/cqoqbbdypebzawgmtazv/sql
# Then paste the contents of: database-schema-fixes.sql
```

Or use the Supabase CLI:
```bash
cat database-schema-fixes.sql | supabase db execute
```

### 2. Scrape Fresh Properties

```bash
cd /home/user/JaveaRealEstate
python scripts/new_scraper.py
```

**Output:** `scraped-properties.json` (English titles, descriptions, features)

### 3. Translate and Upload

```bash
python scripts/new_upload.py scraped-properties.json --translate --upload
```

**What it does:**
- ✅ Translates titles to Spanish & Russian
- ✅ Translates descriptions to Spanish & Russian
- ✅ Translates features to Spanish & Russian
- ✅ Uploads to Supabase
- ✅ Clears Vercel cache

---

## 📋 SQL Commands to Run in Supabase

### Add Missing Spanish Columns
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_es TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS features_es JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_properties_features_es ON properties USING GIN (features_es);
```

### Investigate Missing Properties (68 → 62)

**Check property status:**
```sql
SELECT status, COUNT(*) as count FROM properties GROUP BY status;
```

**Find non-available properties:**
```sql
SELECT id, title, status, price FROM properties
WHERE status != 'available'
ORDER BY created_at DESC;
```

**Check for invalid data:**
```sql
-- Properties with price = 0
SELECT id, title, price FROM properties WHERE price = 0 OR price IS NULL;

-- Properties with no images
SELECT id, title, jsonb_array_length(images) as image_count
FROM properties WHERE jsonb_array_length(images) = 0;
```

**Find duplicates:**
```sql
SELECT source_reference, COUNT(*) as count
FROM properties
GROUP BY source_reference
HAVING COUNT(*) > 1;
```

---

## 🔍 What Was Deleted

```
✅ scraped-properties.json (269 KB)
✅ scraped-properties-translated.json (364 KB)
✅ processed-properties.json (632 KB)
✅ unique-properties.json (518 KB)
✅ scripts/scraped-properties.json (325 KB)
✅ scripts/scraper.py (13 KB - legacy)
────────────────────────────────────
Total saved: ~2.1 MB
```

---

## 🐛 What Was Fixed

### Bug 1: Description Saved Twice
**Before:**
- `description` = English description ✅
- `description_en` = English description ✅ (duplicate!)

**After:**
- `description` = Original English ✅
- `description_en` = English ✅
- `description_es` = Spanish ✅ (NEW!)
- `description_ru` = Russian ✅

### Bug 2: Missing Spanish Columns
**Before:** Database had no `title_es`, `description_es`, `features_es`

**After:** All 3 languages fully supported (EN, ES, RU)

### Bug 3: Features Not Translated
**Before:** Only titles and descriptions were translated

**After:** Features are also translated to Spanish and Russian

---

## 📊 Updated Workflow

### Recommended: Simple Workflow
```bash
# Step 1: Scrape properties
python scripts/new_scraper.py

# Step 2: Translate and upload
python scripts/new_upload.py scraped-properties.json --translate --upload
```

### Advanced: With Deduplication
```bash
# Step 1: Scrape
python scripts/new_scraper.py

# Step 2: Process with geocoding + deduplication
python scripts/process_and_upload.py scraped-properties.json --upload
```

---

## 🎯 Next Steps

1. **Run SQL schema fixes** in Supabase (see above)
2. **Re-scrape properties** to get fresh data
3. **Upload with translations** using `--translate --upload`
4. **Verify frontend** shows all 3 languages correctly
5. **Investigate missing 6 properties** using SQL commands above

---

## 📁 Project Structure (After Cleanup)

```
JaveaRealEstate/
├── scripts/
│   ├── new_scraper.py ✅ (active - use this)
│   ├── new_upload.py ✅ (active - FIXED)
│   └── process_and_upload.py ⚠️ (optional - advanced)
├── database-schema-fixes.sql ⭐ (run this first!)
├── CLEANUP_PLAN.md 📖 (detailed explanation)
├── QUICK_START.md 🚀 (this file)
└── ... (rest of Next.js app)
```

---

## ❓ FAQ

### Q: Which scraper should I use?
**A:** Use `new_scraper.py` (the old `scraper.py` was deleted)

### Q: Do I need to translate manually?
**A:** No! Use `--translate` flag with `new_upload.py`

### Q: Why are only 62 properties showing instead of 68?
**A:** Run the investigation SQL queries above. Most likely:
- 6 properties have `status = 'sold'` (filtered out by frontend)
- Or 6 properties have invalid data (price = 0, no images, etc.)

### Q: Can I use Spanish as the default language?
**A:** Not recommended without a full data migration. Current setup uses English as original (from scraper) with ES/RU translations.

---

## 🛠️ Troubleshooting

### "Column 'description_es' does not exist"
→ Run the SQL schema fixes first!

### "Translation failed"
→ Check that `deep-translator` is installed: `pip install deep-translator`

### "403 error when pushing to git"
→ Make sure you push to a branch starting with `claude/` and ending with the session ID

### "Vercel cache not clearing"
→ Check that `REVALIDATE_SECRET` is set in `.env.local`

---

## 📚 Related Documentation

- **CLEANUP_PLAN.md** - Full technical details of what was wrong and how it was fixed
- **database-schema-fixes.sql** - SQL commands to update Supabase schema
- **SCRAPER_SETUP.md** - Original scraper documentation
- **UPLOAD_GUIDE.md** - Original upload documentation
