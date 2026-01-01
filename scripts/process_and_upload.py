#!/usr/bin/env python3
"""
Property Data Processor - Deduplication & Translation

Processes scraped properties by:
1. Finding geolocation coordinates for deduplication
2. Deduplicating based on location proximity
3. Translating descriptions to EN/RU
4. Uploading to Supabase

Requirements:
    pip install requests python-dotenv supabase geopy translatepy

Usage:
    python scripts/process_and_upload.py scraped-properties.json
"""

import os
import json
import sys
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import time

import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from translatepy import Translator

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Initialize services
geolocator = Nominatim(user_agent="javea-real-estate-scraper")
translator = Translator()

# Cache for geocoding results
geocode_cache = {}

# ============================================================================
# GEOLOCATION FUNCTIONS
# ============================================================================

def get_coordinates(address: str, location: str) -> Optional[Tuple[float, float]]:
    """Get latitude and longitude for an address."""
    # Create a cache key
    cache_key = f"{address}_{location}"

    if cache_key in geocode_cache:
        return geocode_cache[cache_key]

    # Try full address first
    search_queries = [
        f"{address}, {location}, Jávea, Spain",
        f"{location}, Jávea, Spain",
        f"{location}, Alicante, Spain",
    ]

    for query in search_queries:
        try:
            print(f"  🌍 Geocoding: {query}")
            location_data = geolocator.geocode(query)

            if location_data:
                coords = (location_data.latitude, location_data.longitude)
                geocode_cache[cache_key] = coords
                print(f"  ✅ Found: {coords}")
                return coords
            
            # Add small delay to respect rate limits
            time.sleep(0.5)
        except Exception as e:
            print(f"  ⚠️  Geocoding error: {e}")
            continue

    print(f"  ❌ Could not geocode: {cache_key}")
    return None


def are_properties_duplicate(prop1: Dict, prop2: Dict, max_distance_m: float = 50) -> bool:
    """Check if two properties are duplicates based on location proximity."""
    # If we have coordinates, check distance
    coords1 = prop1.get('coordinates')
    coords2 = prop2.get('coordinates')

    if coords1 and coords2:
        distance = geodesic(coords1, coords2).meters

        # If within 50 meters and similar price (within 10%), likely duplicate
        price_diff = abs(prop1['price'] - prop2['price']) / max(prop1['price'], prop2['price'])

        if distance < max_distance_m and price_diff < 0.1:
            return True

    # Fallback: check if same reference or very similar titles
    if prop1.get('source_reference') == prop2.get('source_reference'):
        return True

    # Check if titles are very similar (simple check)
    title1 = prop1['title'].lower()
    title2 = prop2['title'].lower()

    if title1 == title2 and prop1['price'] == prop2['price']:
        return True

    return False

# ============================================================================
# TRANSLATION FUNCTIONS
# ============================================================================

def detect_language(text: str) -> str:
    """Detect the language of the text."""
    try:
        result = translator.language(text)
        # Get the language code (e.g., 'en', 'es', 'ru')
        lang_code = result.alpha2
        return lang_code.lower()
    except Exception as e:
        print(f"  ⚠️  Language detection error: {e}")
        return 'unknown'


def translate_text(text: str, target_lang: str, source_lang: Optional[str] = None) -> str:
    """Translate text to target language using translatepy."""
    if not text or len(text.strip()) == 0:
        return text

    try:
        # Detect source language if not provided
        if not source_lang:
            source_lang = detect_language(text)
            print(f"    📝 Detected language: {source_lang}")
        
        # Skip translation if source and target are the same
        if source_lang == target_lang:
            print(f"    ⏭️  Skipped {target_lang} (already in {source_lang})")
            return text
        
        # Truncate if too long (API limits)
        if len(text) > 4500:
            text = text[:4500] + '...'
        
        # Translate using translatepy (supports multiple services)
        result = translator.translate(text, target_lang)
        
        # Small delay to respect rate limits
        time.sleep(0.3)
        
        print(f"    ✅ Translated {source_lang}→{target_lang}")
        return result.result
            
    except Exception as e:
        print(f"  ⚠️  Translation error ({target_lang}): {e}")
        return text  # Return original if translation fails


def translate_property(prop: Dict) -> Dict:
    """Translate property title and description to EN and RU."""
    print(f"  🌐 Translating: {prop['id']}")

    # Translate title
    if prop.get('title'):
        try:
            # Detect source language once
            title_lang = detect_language(prop['title'])
            
            # Translate to EN and RU
            prop['title_en'] = translate_text(prop['title'], 'en', title_lang)
            prop['title_ru'] = translate_text(prop['title'], 'ru', title_lang)
            
            # Set Spanish as default if source is Spanish, otherwise use EN
            if title_lang == 'es':
                # Spanish is already the original
                pass
            elif title_lang == 'en':
                # English is original, set ES as translation
                prop['title'] = translate_text(prop['title'], 'es', title_lang)
            else:
                # Unknown language, translate to all three
                prop['title'] = translate_text(prop['title'], 'es', title_lang)
                
        except Exception as e:
            print(f"    ⚠️  Title translation failed: {e}")

    # Translate description
    if prop.get('description'):
        try:
            desc = prop['description']

            # Truncate very long descriptions
            if len(desc) > 4500:
                desc = desc[:4500] + '...'

            # Detect source language
            desc_lang = detect_language(desc[:200])  # Use first 200 chars for detection
            
            # Translate to EN and RU
            prop['description_en'] = translate_text(desc, 'en', desc_lang)
            prop['description_ru'] = translate_text(desc, 'ru', desc_lang)
            
            # Set Spanish description
            if desc_lang == 'es':
                # Spanish is already the original
                pass
            elif desc_lang == 'en':
                # English is original, translate to Spanish
                prop['description'] = translate_text(desc, 'es', desc_lang)
            else:
                # Unknown language, translate to Spanish
                prop['description'] = translate_text(desc, 'es', desc_lang)

        except Exception as e:
            print(f"    ⚠️  Description translation failed: {e}")

    return prop

# ============================================================================
# PROCESSING FUNCTIONS
# ============================================================================

def process_property(prop: Dict) -> Dict:
    """Process a single property: geocode and translate."""
    print(f"\n📍 Processing: {prop['id']}")

    # Get coordinates
    coords = get_coordinates(
        prop.get('title', ''),
        prop.get('location', '')
    )

    if coords:
        prop['coordinates'] = coords
        # Store as separate fields for Supabase
        prop['latitude'] = coords[0]
        prop['longitude'] = coords[1]

    # Translate
    prop = translate_property(prop)

    return prop


def deduplicate_properties(properties: List[Dict]) -> List[Dict]:
    """Remove duplicate properties based on location proximity."""
    print(f"\n🔍 Deduplicating {len(properties)} properties...")

    unique_properties = []
    duplicates_found = 0

    for prop in properties:
        is_duplicate = False

        for unique_prop in unique_properties:
            if are_properties_duplicate(prop, unique_prop):
                print(f"  ⚠️  Duplicate found: {prop['id']} ~ {unique_prop['id']}")
                duplicates_found += 1
                is_duplicate = True
                break

        if not is_duplicate:
            unique_properties.append(prop)

    print(f"\n✨ Removed {duplicates_found} duplicates")
    print(f"📊 Unique properties: {len(unique_properties)}")

    return unique_properties

# ============================================================================
# SUPABASE FUNCTIONS
# ============================================================================

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError(
            'Missing Supabase credentials. Add SUPABASE_SERVICE_ROLE_KEY to .env.local'
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upload_to_supabase(properties: List[Dict]) -> None:
    """Upload properties to Supabase database."""
    supabase = get_supabase_client()

    print(f"\n📤 Uploading {len(properties)} properties to Supabase...")

    success_count = 0
    error_count = 0

    for prop in properties:
        try:
            # Prepare data for Supabase
            db_property = {
                'id': prop['id'],
                'type': prop['type'],
                'title': prop['title'],
                'title_en': prop.get('title_en'),
                'title_ru': prop.get('title_ru'),
                'price': prop['price'],
                'location': prop['location'],
                'description': prop.get('description'),
                'description_en': prop.get('description_en'),
                'description_ru': prop.get('description_ru'),
                'images': prop['images'],
                'features': prop.get('features', []),
                'specs': prop['specs'],
                'source_url': prop.get('source_url'),
                'source_reference': prop.get('source_reference'),
                'status': prop.get('status', 'available'),
                'scraped_at': prop.get('scraped_at'),
            }

            # Add coordinates if available
            if 'latitude' in prop:
                db_property['specs']['latitude'] = prop['latitude']
                db_property['specs']['longitude'] = prop['longitude']

            # Upsert (insert or update if exists)
            result = supabase.table('properties').upsert(db_property).execute()
            print(f"  ✅ {prop['id']}")
            success_count += 1
        except Exception as e:
            print(f"  ❌ Error uploading {prop['id']}: {e}")
            error_count += 1

    print(f"\n📊 Upload Summary:")
    print(f"  ✅ Success: {success_count}")
    print(f"  ❌ Errors: {error_count}")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main processing function."""
    if len(sys.argv) < 2:
        print("Usage: python process_and_upload.py <json-file>")
        print("Example: python process_and_upload.py scraped-properties.json")
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)

    print(f"🚀 Processing properties from: {input_file}\n")

    # Load properties
    with open(input_file, 'r', encoding='utf-8') as f:
        properties = json.load(f)

    print(f"📋 Loaded {len(properties)} properties")

    # Process each property (geocode + translate)
    processed_properties = []

    for i, prop in enumerate(properties):
        print(f"\n[{i + 1}/{len(properties)}]")
        try:
            processed_prop = process_property(prop)
            processed_properties.append(processed_prop)
        except Exception as e:
            print(f"❌ Error processing {prop.get('id', 'unknown')}: {e}")
            # Still add it, just without geocoding/translation
            processed_properties.append(prop)

    # Save processed properties
    processed_file = 'processed-properties.json'
    with open(processed_file, 'w', encoding='utf-8') as f:
        json.dump(processed_properties, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Saved processed properties to: {processed_file}")

    # Deduplicate
    unique_properties = deduplicate_properties(processed_properties)

    # Save deduplicated properties
    deduped_file = 'unique-properties.json'
    with open(deduped_file, 'w', encoding='utf-8') as f:
        json.dump(unique_properties, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved unique properties to: {deduped_file}")

    # Upload to Supabase
    try:
        upload_to_supabase(unique_properties)
        print("\n✨ Processing complete!")
    except ValueError as e:
        print(f"\n⚠️  {e}")
        print("Properties saved to JSON files only.")


if __name__ == '__main__':
    main()
