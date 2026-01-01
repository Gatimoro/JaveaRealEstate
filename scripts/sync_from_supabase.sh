#!/bin/bash
# Force sync properties FROM Supabase TO local JSON file
# This is useful when you want to pull the latest data from the database

set -e  # Exit on error

echo "🔄 Force Syncing from Supabase to Local Folder"
echo "=============================================="
echo ""

# Default output file
OUTPUT_FILE=${1:-"synced-properties.json"}

echo "📡 Pulling all properties from Supabase..."
echo "📁 Output file: $OUTPUT_FILE"
echo ""

python3 scripts/process_and_upload.py --sync "$OUTPUT_FILE"

echo ""
echo "✨ Sync complete! Properties saved to: $OUTPUT_FILE"
echo ""
echo "You can now find your synced properties in:"
echo "  → $(pwd)/$OUTPUT_FILE"
