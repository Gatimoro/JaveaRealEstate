#!/bin/bash
# Full scraper workflow automation
# This script runs the complete scraping, processing, and syncing pipeline

set -e  # Exit on error

echo "🕷️  Javea Real Estate - Full Scraper Pipeline"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if --upload flag is passed
UPLOAD_FLAG=""
if [[ "$*" == *"--upload"* ]]; then
    UPLOAD_FLAG="--upload"
    echo -e "${YELLOW}⚠️  Upload to Supabase: ENABLED${NC}"
else
    echo -e "${YELLOW}ℹ️  Upload to Supabase: DISABLED (use ./scripts/run_scraper.sh --upload to enable)${NC}"
fi
echo ""

# Step 1: Scrape properties
echo -e "${BLUE}📥 Step 1: Scraping properties from javeahomefinders.com...${NC}"
python scripts/scraper.py $UPLOAD_FLAG
echo -e "${GREEN}✅ Scraping complete!${NC}"
echo ""

# Step 2: Process (and optionally upload)
echo -e "${BLUE}🔄 Step 2: Processing (geocoding, translation, deduplication)...${NC}"
python scripts/process_and_upload.py scraped-properties.json $UPLOAD_FLAG
echo -e "${GREEN}✅ Processing complete!${NC}"
echo ""

# Step 3: Sync back to local folder (only if uploading)
if [[ -n "$UPLOAD_FLAG" ]]; then
    echo -e "${BLUE}💾 Step 3: Syncing from Supabase to local folder...${NC}"
    python scripts/process_and_upload.py --sync synced-properties.json
    echo -e "${GREEN}✅ Sync complete!${NC}"
    echo ""
fi

echo -e "${GREEN}✨ All done! Your properties are now:${NC}"
echo "  - Scraped: scraped-properties.json"
echo "  - Processed: processed-properties.json"
echo "  - Deduplicated: unique-properties.json"
if [[ -n "$UPLOAD_FLAG" ]]; then
    echo "  - Synced from DB: synced-properties.json"
    echo "  - Uploaded to Supabase ✓"
else
    echo "  - NOT uploaded (run with --upload to upload to Supabase)"
fi
echo ""
echo "🎉 Pipeline completed successfully!"
