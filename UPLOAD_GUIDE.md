# 🚀 Property Upload Guide

You've scraped properties and have a `scraped-properties.json` file. Here's how to process and upload them to Supabase.

## ⚡ Quick Start

```bash
# 1. Install Python dependencies
pip install -r scripts/requirements.txt

# 2. Process, deduplicate, translate, and upload
python scripts/process_and_upload.py scraped-properties.json
```

That's it! The script will:
1. ✅ Add geolocation coordinates for deduplication
2. ✅ Deduplicate based on location proximity (within 50m)
3. ✅ Translate titles and descriptions to EN/RU
4. ✅ Upload unique properties to Supabase

## 📋 What the Script Does

### 1. Geolocation (for Deduplication)
Uses the free Nominatim geocoding service to find coordinates for each property:
- Searches: "Address, Location, Jávea, Spain"
- Caches results to avoid duplicate API calls
- Properties within 50 meters with similar prices (±10%) are marked as duplicates

### 2. Translation
Uses Google Translate (free) to translate:
- **Titles** → English & Russian
- **Descriptions** → English & Russian
- Handles long descriptions (splits if needed)
- Falls back to original if translation fails

### 3. Deduplication
Identifies duplicates by:
- **Location**: Within 50 meters
- **Price**: Within 10% difference
- **Reference**: Same source reference
- **Title + Price**: Exact match

### 4. Upload to Supabase
- Uses `upsert` (insert or update if exists)
- Automatically handles conflicts
- Updates existing properties if they've changed

## 📁 Output Files

The script creates these files:

1. **`processed-properties.json`**
   - All scraped properties with geocoding & translations
   - Useful for backup/debugging

2. **`unique-properties.json`**
   - Deduplicated properties only
   - Final dataset that gets uploaded

## 🔧 Advanced Usage

### Process Without Uploading

If you just want to process and deduplicate locally:

```python
# Edit scripts/process_and_upload.py
# Comment out the upload section at the end

# Or just catch the exception:
try:
    upload_to_supabase(unique_properties)
except ValueError:
    print("Skipped upload")
```

### Adjust Deduplication Sensitivity

Edit `scripts/process_and_upload.py`:

```python
# Make deduplication stricter (10 meters instead of 50)
def are_properties_duplicate(prop1, prop2, max_distance_m=10):

# Or looser (100 meters)
def are_properties_duplicate(prop1, prop2, max_distance_m=100):
```

### Skip Translation (Faster Processing)

If you don't need translations, comment out the translation in `process_property()`:

```python
def process_property(prop: Dict) -> Dict:
    # Get coordinates
    coords = get_coordinates(...)

    # Skip translation
    # prop = translate_property(prop)  # <-- Comment this out

    return prop
```

## 🌍 Translation API Alternatives

The script uses **Google Translate (free)**. For production, consider:

### 1. DeepL (Better Quality)
```bash
pip install deepl

# Add to .env.local
DEEPL_API_KEY=your-key-here
```

### 2. Azure Translator
```bash
pip install azure-ai-translation-text

# Add to .env.local
AZURE_TRANSLATOR_KEY=your-key-here
AZURE_TRANSLATOR_REGION=your-region
```

### 3. OpenAI GPT (Most Natural)
```bash
pip install openai

# Add to .env.local
OPENAI_API_KEY=your-key-here
```

## 🐛 Troubleshooting

### "Missing Supabase credentials"
Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get it from: [Supabase API Settings](https://app.supabase.com/project/cqoqbbdypebzawgmtazv/settings/api)

### Geocoding is slow
- First run caches results for future use
- You can pre-populate the cache or skip geocoding for non-critical properties

### Translation fails
- Google Translate has rate limits
- Add delays between translations if needed:
  ```python
  import time
  time.sleep(0.5)  # 500ms delay
  ```

### Duplicates not detected
- Check if properties have coordinates
- Adjust `max_distance_m` parameter
- Verify price similarity threshold (currently 10%)

## 📊 Monitoring Upload

After upload, check Supabase:

1. Go to [Table Editor](https://app.supabase.com/project/cqoqbbdypebzawgmtazv/editor)
2. Select `properties` table
3. Verify properties are there with:
   - ✅ Coordinates in specs
   - ✅ Translated titles (title_en, title_ru)
   - ✅ Translated descriptions

## 🔄 Re-running the Script

Running the script multiple times is safe:
- Uses `upsert` (updates existing properties)
- Won't create duplicates
- Updates properties if source data changed

Good for:
- Daily scraper updates
- Fixing translation issues
- Re-processing after changing settings
