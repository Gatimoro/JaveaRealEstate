#!/usr/bin/env python3
"""
JaveaHomeFinders Property Scraper (Python)

Scrapes property listings from javeahomefinders.com and uploads to Supabase.

Requirements:
    pip install requests beautifulsoup4 python-dotenv supabase

Usage:
    python scripts/scraper.py
"""

import os
import json
import re
import time
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env.local
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# ============================================================================
# SCRAPER FUNCTIONS
# ============================================================================

def fetch_html(url: str) -> str:
    """Fetch HTML content from a URL."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.text


def scrape_property_list(base_url: str = 'https://www.javeahomefinders.com') -> List[str]:
    """Scrape the property listing page to get all property URLs."""
    search_url = f"{base_url}/search-property?trans=sale&city=85182"  # Jávea properties
    html = fetch_html(search_url)
    soup = BeautifulSoup(html, 'html.parser')

    property_urls = []

    # Find all property cards
    for link in soup.select('.featDetailCont a'):
        href = link.get('href')
        if href and 'javascript' not in href:
            full_url = href if href.startswith('http') else urljoin(base_url, href)
            if full_url not in property_urls:
                property_urls.append(full_url)

    # Handle pagination
    pagination = soup.select('.pagBtn')
    total_pages = len(pagination) if pagination else 1

    for page in range(2, total_pages + 1):
        page_url = f"{search_url}&page={page}"
        page_html = fetch_html(page_url)
        page_soup = BeautifulSoup(page_html, 'html.parser')

        for link in page_soup.select('.featDetailCont a'):
            href = link.get('href')
            if href and 'javascript' not in href:
                full_url = href if href.startswith('http') else urljoin(base_url, href)
                if full_url not in property_urls:
                    property_urls.append(full_url)

    return list(set(property_urls))  # Remove duplicates


def extract_number(text: str) -> int:
    """Extract number from text (e.g., '€320,000' => 320000)."""
    match = re.search(r'\d+', text.replace(',', '').replace('€', '').replace(' ', ''))
    return int(match.group()) if match else 0


def normalize_location_text(text: str) -> str:
    """Normalize location text to handle Valencian/Spanish variations.

    Xàbia (Valencian) = Javea (Spanish)
    """
    # Replace Valencian spelling with Spanish
    text = re.sub(r'X[àa]bia', 'Javea', text, flags=re.IGNORECASE)
    return text


def map_property_type(type_text: str) -> str:
    """Map property type from source to our format."""
    lower = type_text.lower()

    # Apartment/Penthouse
    if 'apartment' in lower or 'penthouse' in lower:
        return 'apartment'

    # Villa/House
    if 'villa' in lower:
        return 'house'

    # Townhouse
    if 'townhouse' in lower or 'town house' in lower:
        return 'house'

    # Plot/Land
    if 'plot' in lower or 'land' in lower:
        return 'plot'

    # Default
    return 'house'


def map_location_to_area(location: str) -> str:
    """Map location to area code."""
    lower = location.lower()

    # Jávea areas
    if 'old town' in lower or 'pueblo' in lower:
        return 'old-town'
    if 'arenal' in lower or 'beach' in lower:
        return 'arenal'
    if 'port' in lower or 'puerto' in lower:
        return 'port'
    if 'cap marti' in lower:
        return 'cap-marti'
    if 'granadella' in lower:
        return 'granadella'
    if 'montgo' in lower or 'montgó' in lower:
        return 'montgo'
    if 'pinosol' in lower:
        return 'pinosol'

    # Other locations
    if 'moraira' in lower:
        return 'moraira'
    if 'denia' in lower or 'dénia' in lower:
        return 'denia'
    if 'benitachell' in lower:
        return 'benitachell'

    return 'other'


def generate_property_id(reference: str) -> str:
    """Generate a clean ID from reference."""
    return re.sub(r'[^a-z0-9]+', '-', reference.lower()).strip('-')


def scrape_property_detail(url: str) -> Dict:
    """Scrape a single property detail page."""
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')

    # Extract reference
    ref_elem = soup.select_one('.propRefCont span')
    reference = ref_elem.text.replace('Ref:', '').strip() if ref_elem else url.split('/')[-1]

    # Extract title
    title_elem = soup.select_one('#propertyTitle h1')
    title = title_elem.text.strip() if title_elem else 'Untitled Property'
    title = normalize_location_text(title)  # Normalize Xàbia → Javea in title

    # Extract price
    price_elem = soup.select_one('.propRefCont .pricePV')
    price_text = price_elem.text if price_elem else '0'
    price = extract_number(price_text)

    # Extract type and location
    bullet_items = soup.select('.bulletList li')
    type_text = bullet_items[0].text if len(bullet_items) > 0 else ''
    location_text = bullet_items[1].text if len(bullet_items) > 1 else ''

    property_type = map_property_type(type_text)

    # Parse location: format is like "Jávea, Pueblo" or "Xàbia, Arenal"
    # Remove any icons/labels and normalize
    location = re.sub(r'.*:', '', location_text).strip()
    location = normalize_location_text(location)  # Xàbia → Javea

    # Extract bedrooms, bathrooms, sizes
    bedrooms = 0
    bathrooms = 0
    build_size = 0
    plot_size = None

    for item in bullet_items:
        text = item.text
        if 'Bedroom' in text:
            bedrooms = extract_number(text)
        if 'Bathroom' in text:
            bathrooms = extract_number(text)
        if 'Build' in text:
            build_size = extract_number(text)
        if 'Terrace Size' in text or 'Plot' in text:
            plot_size = extract_number(text)

    # Check for pool
    has_pool = 'pool' in soup.text.lower() or soup.select_one('.fa-swimming-pool') is not None

    # Extract features
    features = []
    if has_pool:
        features.append('pool')
    if plot_size and plot_size > 0:
        features.append('garden')

    for item in soup.select('.bulletList li .fa-check'):
        feature_text = item.parent.text.strip()
        if feature_text:
            if 'parking' in feature_text.lower():
                features.append('parking')
            if 'terrace' in feature_text.lower():
                features.append('terrace')
            if 'balcony' in feature_text.lower():
                features.append('balcony')
            if 'view' in feature_text.lower():
                features.append('views')
            if 'air con' in feature_text.lower():
                features.append('air-conditioning')
            if 'storage' in feature_text.lower():
                features.append('storage')

    features = list(set(features))  # Remove duplicates

    # Extract description
    desc_elem = soup.select_one('.propDescCont')
    description = desc_elem.text.strip() if desc_elem else ''
    description = normalize_location_text(description)  # Normalize Xàbia → Javea in description

    # Extract images
    images = []
    for photo in soup.select('#mainPhotos li'):
        img_container = photo.select_one('.mainPhotoImgContainer a')
        if img_container:
            style = img_container.get('style', '')
            match = re.search(r'url\(["\']?([^"\']+)["\']?\)', style)
            if match:
                images.append(match.group(1))

    # Extract status
    status = 'available'
    overlay = soup.select_one('.photoOverlayText')
    if overlay:
        overlay_text = overlay.text.lower()
        if 'reserved' in overlay_text:
            status = 'reserved'
        elif 'sold' in overlay_text:
            status = 'sold'

    return {
        'id': generate_property_id(reference),
        'type': property_type,
        'title': title,
        'price': price,
        'location': location,
        'description': description,
        'images': images,
        'features': features,
        'specs': {
            'bedrooms': bedrooms if bedrooms > 0 else None,
            'bathrooms': bathrooms if bathrooms > 0 else None,
            'size': build_size if build_size > 0 else None,
            'plotSize': plot_size if plot_size and plot_size > 0 else None,
        },
        'source_url': url,
        'source_reference': reference,
        'status': status,
        'scraped_at': datetime.now().isoformat(),
    }


def scrape_all_properties() -> List[Dict]:
    """Scrape all properties from javeahomefinders.com."""
    print('🔍 Finding property URLs...')
    urls = scrape_property_list()
    print(f'📋 Found {len(urls)} properties to scrape')

    properties = []

    for i, url in enumerate(urls):
        try:
            print(f'\n[{i + 1}/{len(urls)}] Scraping: {url}')
            property_data = scrape_property_detail(url)
            properties.append(property_data)
            print(f'✅ {property_data["id"]} - {property_data["title"]}')

            # Be polite - wait 1 second between requests
            if i < len(urls) - 1:
                time.sleep(1)
        except Exception as e:
            print(f'❌ Error scraping {url}: {e}')

    print(f'\n✨ Scraping complete! Scraped {len(properties)} properties')
    return properties


# ============================================================================
# DATABASE FUNCTIONS
# ============================================================================

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError(
            'Missing Supabase credentials. Add SUPABASE_SERVICE_ROLE_KEY to .env.local'
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upload_properties_to_supabase(properties: List[Dict]) -> None:
    """Upload properties to Supabase database."""
    supabase = get_supabase_client()

    print(f'\n📤 Uploading {len(properties)} properties to Supabase...')

    success_count = 0
    error_count = 0

    for prop in properties:
        try:
            # Upsert (insert or update if exists)
            result = supabase.table('properties').upsert(prop).execute()
            print(f'✅ Uploaded: {prop["id"]}')
            success_count += 1
        except Exception as e:
            print(f'❌ Error uploading {prop["id"]}: {e}')
            error_count += 1

    print(f'\n📊 Upload Summary:')
    print(f'✅ Success: {success_count}')
    print(f'❌ Errors: {error_count}')


def save_to_json(properties: List[Dict], filename: str = 'scraped-properties.json') -> None:
    """Save properties to a JSON file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(properties, f, indent=2, ensure_ascii=False)
    print(f'\n💾 Saved to: {filename}')


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function."""
    import sys

    print('🕷️  JaveaHomeFinders Property Scraper\n')

    # Check for --upload flag (default is NO upload)
    should_upload = '--upload' in sys.argv

    if should_upload:
        print('📤 Upload to Supabase: ENABLED')
    else:
        print('📤 Upload to Supabase: DISABLED (use --upload to enable)')
    print()

    # Scrape properties
    properties = scrape_all_properties()

    # Save to JSON file (backup)
    save_to_json(properties)

    # Upload to Supabase (only if --upload flag is set)
    if should_upload:
        try:
            upload_properties_to_supabase(properties)
        except ValueError as e:
            print(f'\n⚠️  {e}')
            print('Properties saved to JSON file only.')
    else:
        print('\n✨ Scraping complete! (Skipped upload - use --upload to enable)')


if __name__ == '__main__':
    main()
