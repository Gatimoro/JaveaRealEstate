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

# Step 1: Scrape properties
echo -e "${BLUE}📥 Step 1: Scraping properties from javeahomefinders.com...${NC}"
python3 scripts/scraper.py
echo -e "${GREEN}✅ Scraping complete!${NC}"
echo ""

# Step 2: Process and upload
echo -e "${BLUE}🔄 Step 2: Processing (geocoding, translation, deduplication)...${NC}"
python3 scripts/process_and_upload.py scraped-properties.json
echo -e "${GREEN}✅ Processing and upload complete!${NC}"
echo ""

# Step 3: Sync back to local folder
echo -e "${BLUE}💾 Step 3: Syncing from Supabase to local folder...${NC}"
python3 scripts/process_and_upload.py --sync synced-properties.json
echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""

echo -e "${GREEN}✨ All done! Your properties are now:${NC}"
echo "  - Scraped: scraped-properties.json"
echo "  - Processed: processed-properties.json"
echo "  - Deduplicated: unique-properties.json"
echo "  - Synced from DB: synced-properties.json"
echo "  - Uploaded to Supabase ✓"
echo ""
echo "🎉 Pipeline completed successfully!"
