#!/usr/bin/env python
"""
JaveaHomeFinders Property Scraper v2

Improved scraper for javeahomefinders.com that:
- Extracts detailed location info from titles (not just generic "house")
- Handles Javea/Xàbia (Valencian) spelling variations
- Preserves descriptive titles like "Beautiful villa in Costa Nova"
- Extracts municipality + area properly
- Collects all features and specs

Requirements:
    pip install requests beautifulsoup4

Usage:
    python scraper.py                    # Scrape all Javea properties
    python scraper.py --limit 5          # Scrape only 5 properties (testing)
    python scraper.py --output my.json   # Custom output filename
"""

import os
import json
import re
import time
import sys
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


BASE_URL = 'https://www.javeahomefinders.com'

# Headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# ============================================================================
# LOCATION NORMALIZATION
# ============================================================================

# Known municipalities in the area
MUNICIPALITIES = {
    'javea': 'Jávea',
    'jávea': 'Jávea',
    'xàbia': 'Jávea',  # Valencian spelling
    'xabia': 'Jávea',
    'denia': 'Dénia',
    'dénia': 'Dénia',
    'dènia': 'Dénia',
    'moraira': 'Moraira',
    'benitachell': 'Benitachell',
    'benitatxell': 'Benitachell',  # Valencian
    'jesus pobre': 'Jesús Pobre',
    'jesús pobre': 'Jesús Pobre',
    'teulada': 'Teulada',
    'gata de gorgos': 'Gata de Gorgos',
    'pedreguer': 'Pedreguer',
    'ondara': 'Ondara',
    'calpe': 'Calpe',
    'calp': 'Calpe',  # Valencian
}

# Known areas/neighborhoods (maps to slug-friendly versions)
AREAS = {
    # Jávea areas
    'arenal': 'arenal',
    'arenal beach': 'arenal',
    'playa arenal': 'arenal',
    'puerto': 'puerto',
    'port': 'puerto',
    'marina': 'puerto',
    'pueblo': 'casco-antiguo',
    'old town': 'casco-antiguo',
    'casco antiguo': 'casco-antiguo',
    'historic center': 'casco-antiguo',
    'montgo': 'montgo',
    'montgó': 'montgo',
    'cap marti': 'cap-marti',
    'cap martí': 'cap-marti',
    'granadella': 'granadella',
    'cala granadella': 'granadella',
    'portitxol': 'portitxol',
    'portichol': 'portitxol',
    'pinosol': 'pinosol',
    'tosalet': 'tosalet',
    'cumbres del tosalet': 'tosalet',
    'el tosalet': 'tosalet',
    'costa nova': 'costa-nova',
    'cala blanca': 'cala-blanca',
    'balcon al mar': 'balcon-al-mar',
    'balcón al mar': 'balcon-al-mar',
    'adsubia': 'adsubia',
    'la lluca': 'la-lluca',
    'gracia': 'gracia',
    'gràcia': 'gracia',
    'toscamar': 'toscamar',
    'piver': 'piver',
    'la corona': 'la-corona',
    'rafalet': 'rafalet',
    'capsades': 'capsades',
    'cansalades': 'cansalades',
    'puerta fenicia': 'puerta-fenicia',
    'senioles': 'senioles',
    'villes del vent': 'villes-del-vent',
    # Dénia areas
    'les marines': 'les-marines',
    'las marinas': 'les-marines',
    'deveses': 'deveses',
    'les deveses': 'deveses',
    'montgó (denia)': 'montgo-denia',
}


def normalize_text(text: str) -> str:
    """Normalize text for comparison (lowercase, handle accents)."""
    if not text:
        return ''
    return text.lower().strip()


def detect_municipality(text: str) -> Tuple[Optional[str], str]:
    """
    Detect municipality from text.
    Returns (normalized_municipality, remaining_text).
    """
    text_lower = normalize_text(text)
    
    for key, municipality in MUNICIPALITIES.items():
        if key in text_lower:
            # Remove the municipality from the text
            remaining = re.sub(rf'\b{re.escape(key)}\b', '', text_lower, flags=re.IGNORECASE)
            remaining = re.sub(r'[,\s]+', ' ', remaining).strip()
            return municipality, remaining
    
    return None, text


def detect_area(text: str) -> Optional[str]:
    """
    Detect area/neighborhood from text.
    Returns area slug if found, None otherwise.
    """
    text_lower = normalize_text(text)
    
    # Sort by length (longer matches first) to catch "cala granadella" before "granadella"
    sorted_areas = sorted(AREAS.keys(), key=len, reverse=True)
    
    for area_name in sorted_areas:
        if area_name in text_lower:
            return AREAS[area_name]
    
    return None


def extract_location_info(title: str, location_field: str) -> Dict:
    """
    Extract structured location info from title and location field.
    
    Args:
        title: Property title (e.g., "Beautiful Villa in Costa Nova near Jávea")
        location_field: Location from listing (e.g., "Jávea, Arenal")
    
    Returns:
        Dict with municipality, area, and display_location
    """
    result = {
        'municipality': 'Jávea',  # Default
        'area': None,
        'area_display': None,
    }
    
    # First, try location field (format is usually "Municipality, Area")
    if location_field:
        parts = [p.strip() for p in location_field.split(',')]
        
        if len(parts) >= 1:
            muni, _ = detect_municipality(parts[0])
            if muni:
                result['municipality'] = muni
        
        if len(parts) >= 2:
            area = detect_area(parts[1])
            if area:
                result['area'] = area
                result['area_display'] = parts[1].strip()
    
    # Then, enhance with title info (titles often have more specific locations)
    if title:
        # Try to detect municipality from title
        muni_from_title, _ = detect_municipality(title)
        if muni_from_title:
            result['municipality'] = muni_from_title
        
        # Try to detect area from title (might be more specific)
        area_from_title = detect_area(title)
        if area_from_title and not result['area']:
            result['area'] = area_from_title
    
    return result


# ============================================================================
# HTML FETCHING
# ============================================================================

def fetch_html(url: str) -> str:
    """Fetch HTML content from a URL."""
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.text


# ============================================================================
# PROPERTY LIST SCRAPING
# ============================================================================

def scrape_property_list(search_url: str = None) -> List[str]:
    """
    Scrape the property listing pages to get all property URLs.
    Handles pagination automatically.
    """
    if not search_url:
        # Default: all Javea sale properties
        search_url = f"{BASE_URL}/search-property?trans=sale&city=85182"
    
    print(f"🔍 Fetching property list from: {search_url}")
    
    html = fetch_html(search_url)
    soup = BeautifulSoup(html, 'html.parser')
    
    property_urls = []
    
    # Find property count
    props_found = soup.select_one('.propertyiesFound')
    if props_found:
        print(f"   {props_found.text.strip()}")
    
    # Find all property links on first page
    for link in soup.select('.featDetailCont a[href]'):
        href = link.get('href')
        if href and '/property/' in href and 'javascript' not in href:
            full_url = href if href.startswith('http') else urljoin(BASE_URL, href)
            if full_url not in property_urls:
                property_urls.append(full_url)
    
    print(f"   Page 1: Found {len(property_urls)} properties")
    
    # Handle pagination
    pagination = soup.select('.pagBtn')
    if pagination:
        total_pages = len(pagination)
        print(f"   Total pages: {total_pages}")
        
        for page in range(2, total_pages + 1):
            page_url = f"{search_url}&page={page}&limit=12&order=pasc"
            print(f"   Fetching page {page}...")
            
            try:
                page_html = fetch_html(page_url)
                page_soup = BeautifulSoup(page_html, 'html.parser')
                
                page_count = 0
                for link in page_soup.select('.featDetailCont a[href]'):
                    href = link.get('href')
                    if href and '/property/' in href and 'javascript' not in href:
                        full_url = href if href.startswith('http') else urljoin(BASE_URL, href)
                        if full_url not in property_urls:
                            property_urls.append(full_url)
                            page_count += 1
                
                print(f"   Page {page}: Found {page_count} new properties")
                time.sleep(1)  # Be polite
                
            except Exception as e:
                print(f"   ⚠️ Error on page {page}: {e}")
    
    # Remove duplicates while preserving order
    seen = set()
    unique_urls = []
    for url in property_urls:
        if url not in seen:
            seen.add(url)
            unique_urls.append(url)
    
    print(f"\n📋 Total unique properties found: {len(unique_urls)}")
    return unique_urls


# ============================================================================
# PROPERTY DETAIL SCRAPING
# ============================================================================

def extract_number(text: str) -> Optional[int]:
    """Extract first number from text."""
    if not text:
        return None
    # Remove currency symbols, commas, spaces
    clean = re.sub(r'[€$£,\s]', '', text)
    match = re.search(r'\d+', clean)
    return int(match.group()) if match else None


def extract_price(text: str) -> int:
    """Extract price, handling various formats."""
    if not text:
        return 0
    # Remove currency and formatting
    clean = text.replace('€', '').replace(',', '').replace('.', '').strip()
    match = re.search(r'\d+', clean)
    return int(match.group()) if match else 0


def map_property_type(type_text: str) -> str:
    """Map property type from source to our format."""
    lower = type_text.lower() if type_text else ''
    
    if 'apartment' in lower or 'penthouse' in lower or 'flat' in lower:
        return 'apartment'
    if 'villa' in lower or 'house' in lower or 'chalet' in lower:
        return 'house'
    if 'townhouse' in lower or 'town house' in lower or 'adosado' in lower:
        return 'townhouse'
    if 'plot' in lower or 'land' in lower or 'terreno' in lower:
        return 'plot'
    if 'finca' in lower or 'country' in lower:
        return 'finca'
    if 'commercial' in lower or 'local' in lower:
        return 'commercial'
    
    return 'house'  # Default


def generate_property_id(reference: str) -> str:
    """Generate a clean ID from reference."""
    if not reference:
        return f"prop-{int(time.time())}"
    return re.sub(r'[^a-z0-9]+', '-', reference.lower()).strip('-')


def scrape_property_detail(url: str) -> Dict:
    """
    Scrape a single property detail page.
    
    Extracts:
    - Title (preserved, with location info)
    - Reference
    - Price
    - Type (apartment, house, etc.)
    - Location (municipality + area)
    - Specs (beds, baths, size)
    - Description
    - Features
    - Images
    - Status (available, reserved, sold)
    """
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    
    # --- TITLE ---
    title_elem = soup.select_one('#propertyTitle h1')
    title = title_elem.text.strip() if title_elem else 'Property'
    
    # --- REFERENCE ---
    ref_elem = soup.select_one('.propRefCont span.w50:first-child')
    if not ref_elem:
        ref_elem = soup.select_one('.propRefCont span')
    reference = ref_elem.text.strip() if ref_elem else url.split('/')[-1]
    
    # --- PRICE ---
    price_elem = soup.select_one('.propRefCont .pricePV')
    price = extract_price(price_elem.text) if price_elem else 0
    
    # --- TYPE AND LOCATION from bullet list ---
    bullet_items = soup.select('.bulletList li')
    type_text = ''
    location_text = ''
    bedrooms = None
    bathrooms = None
    build_size = None
    terrace_size = None
    plot_size = None
    condition = None
    pool_type = None
    
    for item in bullet_items:
        text = item.get_text(strip=True)
        text_lower = text.lower()
        
        # Property type: has fa-building AND contains property type word
        # Note: fa-building is also used for build size, so check text content
        if item.select_one('.fa-building'):
            if any(word in text_lower for word in ['apartment', 'villa', 'house', 'penthouse', 'townhouse', 'plot', 'finca', 'flat', 'floor']):
                type_text = text
            elif 'build' in text_lower and 'm²' in text:
                build_size = extract_number(text)
        
        # Location (has fa-map-marker-alt icon)
        elif item.select_one('.fa-map-marker-alt'):
            location_text = text
        
        # Bedrooms - must have number + "Bedroom(s)"
        elif item.select_one('.fa-bed') or re.search(r'\d+\s*Bedroom', text):
            bedrooms = extract_number(text)
        
        # Bathrooms - must have number + "Bathroom(s)", not "En-suite Bathroom"
        elif item.select_one('.fa-bath') or (re.search(r'\d+\s*Bathroom', text) and 'en-suite' not in text_lower):
            bathrooms = extract_number(text)
        
        # Build size (when not caught by fa-building check)
        elif 'Build' in text and 'm²' in text:
            build_size = extract_number(text)
        
        # Terrace size
        elif 'Terrace' in text and 'm²' in text:
            terrace_size = extract_number(text)
        
        # Plot size
        elif 'Plot' in text and 'm²' in text:
            val = extract_number(text)
            if val and val > 0:
                plot_size = val
        
        # Condition
        elif 'condition' in text_lower:
            condition = text
        
        # Pool
        elif item.select_one('.fa-swimming-pool') or 'pool' in text_lower:
            pool_type = text
    
    # Parse property type
    property_type = map_property_type(type_text)
    
    # Parse location
    location_info = extract_location_info(title, location_text)
    
    # --- DESCRIPTION ---
    desc_container = soup.select_one('.propDescCont .w100')
    if not desc_container:
        desc_container = soup.select_one('.propDescCont')
    description = ''
    if desc_container:
        # Get all paragraph text
        paragraphs = desc_container.find_all('p')
        if paragraphs:
            description = '\n\n'.join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
        else:
            description = desc_container.get_text(separator='\n', strip=True)
    
    # --- FEATURES ---
    features = []
    
    # Pool
    has_pool = pool_type or soup.select_one('.fa-swimming-pool') is not None
    if has_pool:
        features.append('pool')
    
    # Features from bullet list with checkmarks
    for item in soup.select('.bulletList li'):
        if item.select_one('.fa-check'):
            feature_text = item.get_text(strip=True)
            if feature_text:
                # Map to standardized features
                ft_lower = feature_text.lower()
                if 'parking' in ft_lower or 'garage' in ft_lower:
                    features.append('parking')
                elif 'terrace' in ft_lower:
                    features.append('terrace')
                elif 'balcony' in ft_lower:
                    features.append('balcony')
                elif 'view' in ft_lower:
                    features.append('views')
                elif 'air con' in ft_lower or 'air-con' in ft_lower:
                    features.append('air-conditioning')
                elif 'heating' in ft_lower:
                    features.append('heating')
                elif 'storage' in ft_lower:
                    features.append('storage')
                elif 'lift' in ft_lower or 'elevator' in ft_lower:
                    features.append('lift')
                elif 'garden' in ft_lower:
                    features.append('garden')
                elif 'gym' in ft_lower:
                    features.append('gym')
                elif 'beach' in ft_lower:
                    features.append('near-beach')
                elif 'double glaz' in ft_lower:
                    features.append('double-glazing')
                elif 'furnished' in ft_lower:
                    features.append('furnished')
                elif 'new build' in ft_lower or 'new construction' in ft_lower:
                    features.append('new-build')
    
    # Add garden if plot size is significant
    if plot_size and plot_size > 50 and 'garden' not in features:
        features.append('garden')
    
    features = list(set(features))  # Remove duplicates
    
    # --- IMAGES ---
    images = []
    for photo_li in soup.select('#mainPhotos li'):
        img_link = photo_li.select_one('.mainPhotoImgContainer a')
        if img_link:
            style = img_link.get('style', '')
            match = re.search(r"url\(['\"]?([^'\"]+)['\"]?\)", style)
            if match:
                img_url = match.group(1)
                if img_url not in images:
                    images.append(img_url)
    
    # --- STATUS ---
    status = 'available'
    overlay = soup.select_one('.photoOverlayText')
    if overlay:
        overlay_text = overlay.text.lower()
        if 'reserved' in overlay_text:
            status = 'reserved'
        elif 'sold' in overlay_text:
            status = 'sold'
        elif 'new build' in overlay_text:
            features.append('new-build') if 'new-build' not in features else None
    
    # --- BUILD RESULT ---
    return {
        'id': generate_property_id(reference),
        'source_reference': reference,
        'source_url': url,
        'title': title,
        'type': property_type,
        'price': price,
        'currency': 'EUR',
        'municipality': location_info['municipality'],
        'area': location_info['area'],
        'area_display': location_info['area_display'],
        'location_raw': location_text,
        'description': description,
        'specs': {
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'build_size': build_size,
            'plot_size': plot_size,
            'terrace_size': terrace_size,
        },
        'features': features,
        'images': images,
        'status': status,
        'scraped_at': datetime.now().isoformat(),
    }


# ============================================================================
# MAIN
# ============================================================================

def scrape_all_properties(limit: int = None) -> List[Dict]:
    """Scrape all properties (or limited number for testing)."""
    print('🕷️  JaveaHomeFinders Property Scraper v2\n')
    
    urls = scrape_property_list()
    
    if limit:
        urls = urls[:limit]
        print(f"\n⚠️  Limited to {limit} properties for testing\n")
    
    properties = []
    
    for i, url in enumerate(urls):
        try:
            print(f'\n[{i + 1}/{len(urls)}] {url}')
            prop = scrape_property_detail(url)
            properties.append(prop)
            print(f'  ✅ {prop["id"]}: {prop["title"][:60]}...')
            print(f'     📍 {prop["municipality"]}, {prop["area_display"] or prop["area"] or "unknown"}')
            print(f'     💰 €{prop["price"]:,} | 🛏 {prop["specs"]["bedrooms"]} | 🛁 {prop["specs"]["bathrooms"]}')
            
            # Be polite - wait between requests
            if i < len(urls) - 1:
                time.sleep(1)
                
        except Exception as e:
            print(f'  ❌ Error: {e}')
    
    print(f'\n✨ Scraping complete! Got {len(properties)} properties')
    return properties


def save_to_json(properties: List[Dict], filename: str = 'scraped-properties.json'):
    """Save properties to JSON file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(properties, f, indent=2, ensure_ascii=False)
    print(f'💾 Saved to: {filename}')


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape JaveaHomeFinders properties')
    parser.add_argument('--limit', type=int, help='Limit number of properties (for testing)')
    parser.add_argument('--output', '-o', default='scraped-properties.json', help='Output JSON file')
    
    args = parser.parse_args()
    
    properties = scrape_all_properties(limit=args.limit)
    save_to_json(properties, args.output)
    
    # Print summary
    print('\n📊 Summary:')
    municipalities = {}
    areas = {}
    for p in properties:
        m = p.get('municipality', 'Unknown')
        municipalities[m] = municipalities.get(m, 0) + 1
        a = p.get('area') or 'Unknown'
        areas[a] = areas.get(a, 0) + 1
    
    print('\n  By Municipality:')
    for m, count in sorted(municipalities.items(), key=lambda x: -x[1]):
        print(f'    {m}: {count}')
    
    print('\n  By Area (top 10):')
    for a, count in sorted(areas.items(), key=lambda x: -x[1])[:10]:
        print(f'    {a}: {count}')


if __name__ == '__main__':
    main()