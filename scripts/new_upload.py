#!/usr/bin/env python
"""
Property Upload Script

Uploads scraped properties to Supabase with translation support.
Separated from scraping so you can review the data first.

Features:
- Reads from scraped JSON
- Translates English descriptions to Spanish (ES) and Russian (RU)
- Uploads to Supabase properties table
- Handles upserts (updates existing, inserts new)

Requirements:
    pip install python-dotenv supabase deep-translator

Usage:
    python upload.py scraped-properties.json                    # Preview only (no upload)
    python upload.py scraped-properties.json --upload           # Actually upload
    python upload.py scraped-properties.json --translate        # Translate to ES/RU
    python upload.py scraped-properties.json --translate --upload  # Translate and upload
"""

import os
import json
import sys
import time
from typing import List, Dict, Optional
from datetime import datetime
import requests


from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
REVALIDATE_SECRET = os.getenv('REVALIDATE_SECRET')


# ============================================================================
# TRANSLATION
# ============================================================================

def get_translator():
    """Get a translator instance."""
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator
    except ImportError:
        print("⚠️  deep-translator not installed. Run: pip install deep-translator")
        return None


def translate_text(text: str, target_lang: str, max_chunk_size: int = 4500) -> Optional[str]:
    """
    Translate text to target language.
    
    Args:
        text: Text to translate (assumed to be English)
        target_lang: Target language code ('es' for Spanish, 'ru' for Russian)
        max_chunk_size: Max characters per translation request
    
    Returns:
        Translated text or None if failed
    """
    if not text or len(text.strip()) < 5:
        return text
    
    Translator = get_translator()
    if not Translator:
        return None
    
    try:
        translator = Translator(source='en', target=target_lang)
        
        # If text is short enough, translate directly
        if len(text) <= max_chunk_size:
            result = translator.translate(text)
            return result
        
        # For long texts, split by paragraphs and translate each
        paragraphs = text.split('\n\n')
        translated_paragraphs = []
        
        for para in paragraphs:
            if len(para.strip()) < 5:
                translated_paragraphs.append(para)
                continue
            
            # Further split if paragraph is too long
            if len(para) > max_chunk_size:
                # Split by sentences
                sentences = para.replace('. ', '.|').split('|')
                current_chunk = ""
                translated_chunks = []
                
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) < max_chunk_size:
                        current_chunk += sentence
                    else:
                        if current_chunk:
                            translated_chunks.append(translator.translate(current_chunk))
                            time.sleep(0.3)  # Rate limiting
                        current_chunk = sentence
                
                if current_chunk:
                    translated_chunks.append(translator.translate(current_chunk))
                
                translated_paragraphs.append(' '.join(translated_chunks))
            else:
                translated_paragraphs.append(translator.translate(para))
            
            time.sleep(0.2)  # Rate limiting between paragraphs
        
        return '\n\n'.join(translated_paragraphs)
        
    except Exception as e:
        print(f"    ⚠️ Translation error ({target_lang}): {e}")
        return None


def translate_title(title: str, target_lang: str) -> Optional[str]:
    """
    Translate property title to target language.
    Preserves proper nouns like place names where possible.
    """
    if not title or len(title) < 5:
        return title
    
    Translator = get_translator()
    if not Translator:
        return None
    
    try:
        translator = Translator(source='en', target=target_lang)
        result = translator.translate(title)
        return result
    except Exception as e:
        print(f"    ⚠️ Title translation error ({target_lang}): {e}")
        return None


def add_translations(prop: Dict) -> Dict:
    """
    Add Spanish and Russian translations to property.
    Source is English (the scraped descriptions are in English).

    Args:
        prop: Property dict with 'title', 'description', and 'features' in English

    Returns:
        Property with title_XX, description_XX, features_XX added (XX = en, es, ru)
    """
    result = prop.copy()

    title = prop.get('title', '')
    description = prop.get('description', '')
    features = prop.get('features', [])

    # The original is English, so store as _en
    result['title_en'] = title
    result['description_en'] = description
    result['features_en'] = features

    # Translate title to Spanish
    print(f"    🇪🇸 Translating title to Spanish...")
    result['title_es'] = translate_title(title, 'es')

    # Translate title to Russian
    print(f"    🇷🇺 Translating title to Russian...")
    result['title_ru'] = translate_title(title, 'ru')

    # Translate description to Spanish
    if description and len(description) > 20:
        print(f"    🇪🇸 Translating description to Spanish ({len(description)} chars)...")
        result['description_es'] = translate_text(description, 'es')
    else:
        result['description_es'] = description

    # Translate description to Russian
    if description and len(description) > 20:
        print(f"    🇷🇺 Translating description to Russian...")
        result['description_ru'] = translate_text(description, 'ru')
    else:
        result['description_ru'] = description

    # Translate features to Spanish
    if features:
        print(f"    🇪🇸 Translating {len(features)} features to Spanish...")
        features_es = []
        for feature in features:
            try:
                translated = translate_text(feature, 'es')
                features_es.append(translated if translated else feature)
                time.sleep(0.1)  # Rate limiting
            except Exception as e:
                print(f"      ⚠️ Error translating feature '{feature}': {e}")
                features_es.append(feature)
        result['features_es'] = features_es

    # Translate features to Russian
    if features:
        print(f"    🇷🇺 Translating {len(features)} features to Russian...")
        features_ru = []
        for feature in features:
            try:
                translated = translate_text(feature, 'ru')
                features_ru.append(translated if translated else feature)
                time.sleep(0.1)  # Rate limiting
            except Exception as e:
                print(f"      ⚠️ Error translating feature '{feature}': {e}")
                features_ru.append(feature)
        result['features_ru'] = features_ru

    return result


# ============================================================================
# SUPABASE UPLOAD
# ============================================================================

def get_supabase_client():
    """Create and return a Supabase client."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError(
            'Missing Supabase credentials.\n'
            'Add to .env.local:\n'
            '  NEXT_PUBLIC_SUPABASE_URL=your-url\n'
            '  SUPABASE_SERVICE_ROLE_KEY=your-key'
        )
    
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def prepare_for_upload(prop: Dict) -> Dict:
    """
    Prepare property dict for Supabase upload.
    Maps our scraped structure to database schema.

    Database schema has:
    - type: must be 'house', 'investment', or 'plot' (constraint)
    - location: text field (we'll put municipality + area here)
    - Multilingual support: EN, ES, RU for titles, descriptions, and features
    """
    # Map property type to allowed values in DB constraint
    prop_type = prop.get('type', 'house')
    type_mapping = {
        'apartment': 'house',      # Map apartment -> house
        'townhouse': 'house',      # Map townhouse -> house
        'villa': 'house',
        'house': 'house',
        'finca': 'house',
        'plot': 'plot',
        'land': 'plot',
        'commercial': 'investment',
        'investment': 'investment',
    }
    db_type = type_mapping.get(prop_type.lower(), 'house')

    # Build location string from municipality + area
    municipality = prop.get('municipality', 'Jávea')
    area_display = prop.get('area_display') or prop.get('area', '')
    if area_display:
        location = f"{municipality}, {area_display}"
    else:
        location = prop.get('location_raw') or municipality

    # Build specs - include original type for reference
    specs = prop.get('specs', {}).copy() if prop.get('specs') else {}
    specs['original_type'] = prop_type  # Preserve original type in specs
    if prop.get('area'):
        specs['area_slug'] = prop.get('area')  # Preserve area slug in specs

    return {
        'id': prop['id'],
        'type': db_type,
        # Original title and description (English from scraper)
        'title': prop.get('title'),
        'description': prop.get('description'),
        # English translations (same as original)
        'title_en': prop.get('title_en'),
        'description_en': prop.get('description_en'),
        # Spanish translations
        'title_es': prop.get('title_es'),
        'description_es': prop.get('description_es'),
        # Russian translations
        'title_ru': prop.get('title_ru'),
        'description_ru': prop.get('description_ru'),
        # Basic info
        'price': prop['price'],
        'location': location,
        'images': prop.get('images', []),
        # Features (multilingual)
        'features': prop.get('features', []),
        'features_en': prop.get('features_en'),
        'features_es': prop.get('features_es'),
        'features_ru': prop.get('features_ru'),
        # Specs and metadata
        'specs': specs,
        'source_url': prop.get('source_url'),
        'source_reference': prop.get('source_reference'),
        'status': prop.get('status', 'available'),
        'scraped_at': prop.get('scraped_at'),
        'updated_at': datetime.now().isoformat(),
    }


def upload_properties(properties: List[Dict], dry_run: bool = True) -> Dict:
    """
    Upload properties to Supabase.
    
    Args:
        properties: List of property dicts
        dry_run: If True, don't actually upload (preview mode)
    
    Returns:
        Summary dict with success/error counts
    """
    if dry_run:
        print("\n📋 DRY RUN MODE - No data will be uploaded\n")
        print("Use --upload flag to actually upload data\n")
        
        valid = 0
        invalid = 0
        
        for prop in properties:
            try:
                prepared = prepare_for_upload(prop)
                if prepared['id'] and prepared['price'] > 0:
                    valid += 1
                else:
                    invalid += 1
                    print(f"  ⚠️ Invalid: {prop.get('id', 'unknown')} - missing id or price")
            except Exception as e:
                invalid += 1
                print(f"  ❌ Error validating: {e}")
        
        print(f"\n✅ Would upload: {valid} properties")
        if invalid:
            print(f"⚠️ Would skip: {invalid} invalid properties")
        
        return {'success': valid, 'errors': invalid, 'dry_run': True}
    
    # Actual upload
    print("\n📤 Uploading to Supabase...\n")
    
    try:
        supabase = get_supabase_client()
    except ValueError as e:
        print(f"❌ {e}")
        return {'success': 0, 'errors': len(properties), 'error': str(e)}
    
    success = 0
    errors = 0
    
    for i, prop in enumerate(properties):
        try:
            prepared = prepare_for_upload(prop)
            result = supabase.table('properties').upsert(prepared).execute()
            print(f"  [{i+1}/{len(properties)}] ✅ {prepared['id']}")
            success += 1
        except Exception as e:
            print(f"  [{i+1}/{len(properties)}] ❌ {prop.get('id', 'unknown')}: {e}")
            errors += 1
    
    print(f"\n📊 Upload Summary:")
    print(f"  ✅ Success: {success}")
    print(f"  ❌ Errors: {errors}")
    
    return {'success': success, 'errors': errors, 'dry_run': False}


# ============================================================================
# UTILITIES
# ============================================================================

def load_properties(filename: str) -> List[Dict]:
    """Load properties from JSON file."""
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_properties(properties: List[Dict], filename: str):
    """Save properties to JSON file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(properties, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved to: {filename}")


def print_summary(properties: List[Dict]):
    """Print summary of properties."""
    print(f"\n📊 Property Summary ({len(properties)} total):\n")
    
    # By status
    statuses = {}
    for p in properties:
        s = p.get('status', 'unknown')
        statuses[s] = statuses.get(s, 0) + 1
    
    print("  Status:")
    for s, count in sorted(statuses.items(), key=lambda x: -x[1]):
        print(f"    {s}: {count}")
    
    # By municipality
    municipalities = {}
    for p in properties:
        m = p.get('municipality', 'Unknown')
        municipalities[m] = municipalities.get(m, 0) + 1
    
    print("\n  Municipality:")
    for m, count in sorted(municipalities.items(), key=lambda x: -x[1]):
        print(f"    {m}: {count}")
    
    # By type
    types = {}
    for p in properties:
        t = p.get('type', 'unknown')
        types[t] = types.get(t, 0) + 1
    
    print("\n  Type:")
    for t, count in sorted(types.items(), key=lambda x: -x[1]):
        print(f"    {t}: {count}")
    
    # Price range
    prices = [p.get('price', 0) for p in properties if p.get('price', 0) > 0]
    if prices:
        print(f"\n  Price Range:")
        print(f"    Min: €{min(prices):,}")
        print(f"    Max: €{max(prices):,}")
        print(f"    Avg: €{sum(prices)//len(prices):,}")
    
    # Check for translations
    has_es = sum(1 for p in properties if p.get('description_es'))
    has_ru = sum(1 for p in properties if p.get('description_ru'))
    if has_es or has_ru:
        print(f"\n  Translations:")
        print(f"    Spanish (ES): {has_es}")
        print(f"    Russian (RU): {has_ru}")


def print_sample(properties: List[Dict], n: int = 2):
    """Print sample properties with translations."""
    print(f"\n📝 Sample Properties (first {n}):\n")

    for i, p in enumerate(properties[:n]):
        print(f"{'='*60}")
        print(f"🏠 {p.get('id')} - {p.get('title', 'No title')[:50]}...")
        print(f"   Price: €{p.get('price', 0):,}")
        print(f"   Location: {p.get('municipality')}, {p.get('area_display') or p.get('area')}")

        if p.get('title_es'):
            print(f"\n   🇪🇸 Title ES: {p.get('title_es')[:60]}...")
        if p.get('title_ru'):
            print(f"   🇷🇺 Title RU: {p.get('title_ru')[:60]}...")

        desc = p.get('description', '')[:100]
        if desc:
            print(f"\n   📄 Description EN: {desc}...")

        desc_es = (p.get('description_es') or '')[:100]
        if desc_es:
            print(f"   🇪🇸 Description ES: {desc_es}...")

        desc_ru = (p.get('description_ru') or '')[:100]
        if desc_ru:
            print(f"   🇷🇺 Description RU: {desc_ru}...")

        print()


def clear_vercel_cache():
    """
    Clear Vercel cache after uploading new properties.
    Calls the revalidation API endpoint to invalidate cached data.
    """
    if not REVALIDATE_SECRET:
        print("\n⚠️  REVALIDATE_SECRET not set - skipping cache clear")
        print("   Add REVALIDATE_SECRET to .env.local to enable automatic cache clearing")
        return

    # Determine the API URL based on environment
    deployment_url = os.getenv('NEXT_PUBLIC_DEPLOYMENT_URL') or os.getenv('VERCEL_URL')

    if deployment_url:
        api_url = f"https://{deployment_url}/api/revalidate"
    else:
        # Default to production URL
        api_url = "https://javea-real-estate.vercel.app/api/revalidate"

    print(f"\n🔄 Clearing Vercel cache...")
    print(f"   API URL: {api_url}")

    try:
        response = requests.post(
            api_url,
            headers={
                "Content-Type": "application/json",
                "x-revalidate-secret": REVALIDATE_SECRET
            },
            json={"clearAll": True},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Cache cleared successfully!")
            print(f"   Message: {data.get('message', 'Cache revalidated')}")
            if data.get('revalidated'):
                print(f"   Cleared: {', '.join(data['revalidated'])}")
        elif response.status_code == 401:
            print(f"❌ Unauthorized - check REVALIDATE_SECRET matches Vercel env var")
        else:
            print(f"⚠️  Cache clear failed: {response.status_code}")
            print(f"   Response: {response.text}")

    except requests.exceptions.Timeout:
        print(f"⚠️  Cache clear timed out (API may be slow)")
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Cache clear error: {e}")
    except Exception as e:
        print(f"⚠️  Unexpected error clearing cache: {e}")


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Process and upload properties to Supabase')
    parser.add_argument('input_file', help='Input JSON file with scraped properties')
    parser.add_argument('--upload', action='store_true', help='Actually upload (default is dry run)')
    parser.add_argument('--translate', action='store_true', help='Translate descriptions to ES/RU')
    parser.add_argument('--output', '-o', help='Save processed properties to file')
    parser.add_argument('--limit', type=int, help='Limit number of properties to process')
    parser.add_argument('--sample', action='store_true', help='Show sample of processed properties')
    
    args = parser.parse_args()
    
    # Check input file
    if not os.path.exists(args.input_file):
        print(f"❌ File not found: {args.input_file}")
        sys.exit(1)
    
    print(f"📂 Loading: {args.input_file}")
    properties = load_properties(args.input_file)
    print(f"   Loaded {len(properties)} properties")
    
    # Limit if requested
    if args.limit:
        properties = properties[:args.limit]
        print(f"   Limited to {len(properties)} properties")
    
    # Print summary
    print_summary(properties)
    
    # Translate if requested
    if args.translate:
        print(f"\n🌐 Translating {len(properties)} properties to Spanish and Russian...\n")
        
        translated = []
        for i, prop in enumerate(properties):
            print(f"[{i+1}/{len(properties)}] {prop.get('id', 'unknown')}")
            try:
                translated_prop = add_translations(prop)
                translated.append(translated_prop)
                print(f"  ✅ Done")
            except Exception as e:
                print(f"  ❌ Error: {e}")
                translated.append(prop)  # Keep original if translation fails
            
            # Rate limiting
            time.sleep(0.5)
        
        properties = translated
        
        # Save translated version
        output_file = args.output or args.input_file.replace('.json', '-translated.json')
        save_properties(properties, output_file)
    
    # Show sample if requested
    if args.sample or args.translate:
        print_sample(properties)
    
    # Upload
    result = upload_properties(properties, dry_run=not args.upload)

    if not args.upload:
        print("\n💡 To actually upload, run with --upload flag")
        print("💡 To translate first, run with --translate flag")
    elif result['success'] > 0:
        # Clear Vercel cache after successful upload
        clear_vercel_cache()


if __name__ == '__main__':
    main()
