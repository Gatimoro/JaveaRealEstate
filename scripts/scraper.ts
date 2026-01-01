/**
 * JaveaHomeFinders.com Property Scraper
 *
 * Scrapes property listings from javeahomefinders.com and converts them
 * to the Miraluna property format.
 *
 * Usage:
 *   npx tsx scripts/scraper.ts
 */

import * as cheerio from 'cheerio';

// ============================================================================
// TYPES
// ============================================================================

export interface ScrapedProperty {
  // Basic Info
  reference: string;
  title: string;
  price: number;
  currency: string;

  // Property Details
  type: 'villa' | 'apartment' | 'townhouse' | 'plot' | 'investment';
  location: string;
  bedrooms: number;
  bathrooms: number;
  buildSize: number;
  plotSize?: number;

  // Features
  hasPool: boolean;
  features: string[];

  // Description
  description: string;
  descriptionSpanish?: string; // Will be translated

  // Images
  images: string[];
  mainImage: string;

  // Metadata
  sourceUrl: string;
  scrapedAt: Date;
  status?: 'available' | 'reserved' | 'sold';
  tags?: string[];
}

// ============================================================================
// SCRAPER FUNCTIONS
// ============================================================================

/**
 * Fetches HTML content from a URL
 */
async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Scrapes the property listing page to get all property URLs
 */
export async function scrapePropertyList(baseUrl: string = 'https://www.javeahomefinders.com'): Promise<string[]> {
  const searchUrl = `${baseUrl}/search-property?trans=sale&city=85182`; // Jávea properties
  const html = await fetchHTML(searchUrl);
  const $ = cheerio.load(html);

  const propertyUrls: string[] = [];

  // Find all property cards
  $('.featDetailCont a').each((_, element) => {
    const href = $(element).attr('href');
    if (href && !href.includes('javascript')) {
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
      propertyUrls.push(fullUrl);
    }
  });

  // Handle pagination - get all pages
  const totalPages = $('.pagBtn').length;
  for (let page = 2; page <= totalPages; page++) {
    const pageUrl = `${searchUrl}&page=${page}`;
    const pageHtml = await fetchHTML(pageUrl);
    const $page = cheerio.load(pageHtml);

    $page('.featDetailCont a').each((_, element) => {
      const href = $page(element).attr('href');
      if (href && !href.includes('javascript')) {
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        if (!propertyUrls.includes(fullUrl)) {
          propertyUrls.push(fullUrl);
        }
      }
    });
  }

  return [...new Set(propertyUrls)]; // Remove duplicates
}

/**
 * Extracts text content and cleans it
 */
function cleanText(text: string | undefined): string {
  return (text || '').trim().replace(/\s+/g, ' ');
}

/**
 * Extracts number from text (e.g., "€320,000" => 320000)
 */
function extractNumber(text: string): number {
  const match = text.replace(/[€,\s]/g, '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Maps property type from source to our format
 */
function mapPropertyType(typeText: string): ScrapedProperty['type'] {
  const lower = typeText.toLowerCase();
  if (lower.includes('villa')) return 'villa';
  if (lower.includes('apartment') || lower.includes('penthouse')) return 'apartment';
  if (lower.includes('townhouse')) return 'townhouse';
  if (lower.includes('plot') || lower.includes('land')) return 'plot';
  return 'apartment'; // default
}

/**
 * Scrapes a single property detail page
 */
export async function scrapePropertyDetail(url: string): Promise<ScrapedProperty> {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // Extract reference number
  const refText = $('.propRefCont span').first().text();
  const reference = refText.replace('Ref:', '').trim() || url.split('/').pop() || 'unknown';

  // Extract title
  const title = cleanText($('#propertyTitle h1').text()) || 'Untitled Property';

  // Extract price
  const priceText = $('.propRefCont .pricePV').text();
  const price = extractNumber(priceText);
  const currency = priceText.includes('€') ? 'EUR' : 'USD';

  // Extract type and location
  const typeText = $('.bulletList li').first().text();
  const locationText = $('.bulletList li').eq(1).text();

  const type = mapPropertyType(typeText);
  const location = locationText.replace(/.*:/, '').trim();

  // Extract bedrooms, bathrooms
  let bedrooms = 0;
  let bathrooms = 0;
  $('.bulletList li').each((_, el) => {
    const text = $(el).text();
    if (text.includes('Bedroom')) {
      bedrooms = extractNumber(text);
    }
    if (text.includes('Bathroom')) {
      bathrooms = extractNumber(text);
    }
  });

  // Extract build and plot size
  let buildSize = 0;
  let plotSize: number | undefined;
  $('.bulletList li').each((_, el) => {
    const text = $(el).text();
    if (text.includes('Build')) {
      buildSize = extractNumber(text);
    }
    if (text.includes('Terrace Size') || text.includes('Plot')) {
      plotSize = extractNumber(text);
    }
  });

  // Check for pool
  const hasPool = $('.bulletList li').text().toLowerCase().includes('pool') ||
                   $('.fa-swimming-pool').length > 0;

  // Extract features
  const features: string[] = [];
  $('.bulletList li .fa-check').each((_, el) => {
    const featureText = $(el).parent().text().trim();
    if (featureText) {
      features.push(featureText);
    }
  });

  // Extract description
  const description = cleanText($('.propDescCont').text());

  // Extract images
  const images: string[] = [];
  $('#mainPhotos li').each((_, el) => {
    const bgImage = $(el).find('.mainPhotoImgContainer a').css('background-image');
    if (bgImage) {
      const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match) {
        images.push(match[1]);
      }
    }
  });

  const mainImage = images[0] || '';

  // Extract status from overlay
  let status: ScrapedProperty['status'] = 'available';
  const overlayText = $('.photoOverlayText').text().toLowerCase();
  if (overlayText.includes('reserved')) {
    status = 'reserved';
  } else if (overlayText.includes('sold')) {
    status = 'sold';
  }

  // Extract tags
  const tags: string[] = [];
  if (overlayText.includes('new build')) tags.push('new-build');
  if (overlayText.includes('luxury')) tags.push('luxury');
  if (overlayText.includes('sea view')) tags.push('sea-view');

  return {
    reference,
    title,
    price,
    currency,
    type,
    location,
    bedrooms,
    bathrooms,
    buildSize,
    plotSize,
    hasPool,
    features,
    description,
    images,
    mainImage,
    sourceUrl: url,
    scrapedAt: new Date(),
    status,
    tags,
  };
}

/**
 * Scrapes all properties from javeahomefinders.com
 */
export async function scrapeAllProperties(): Promise<ScrapedProperty[]> {
  console.log('🔍 Finding property URLs...');
  const urls = await scrapePropertyList();
  console.log(`📋 Found ${urls.length} properties to scrape`);

  const properties: ScrapedProperty[] = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      console.log(`\n[${i + 1}/${urls.length}] Scraping: ${urls[i]}`);
      const property = await scrapePropertyDetail(urls[i]);
      properties.push(property);
      console.log(`✅ ${property.reference} - ${property.title}`);

      // Be polite - wait 1 second between requests
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error scraping ${urls[i]}:`, error);
    }
  }

  console.log(`\n✨ Scraping complete! Scraped ${properties.length} properties`);
  return properties;
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  scrapeAllProperties()
    .then(properties => {
      console.log('\n📊 Scraping Results:');
      console.log(`Total properties: ${properties.length}`);
      console.log(`Villas: ${properties.filter(p => p.type === 'villa').length}`);
      console.log(`Apartments: ${properties.filter(p => p.type === 'apartment').length}`);
      console.log(`Townhouses: ${properties.filter(p => p.type === 'townhouse').length}`);
      console.log(`Plots: ${properties.filter(p => p.type === 'plot').length}`);

      // Save to JSON file
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '..', 'scraped-properties.json');
      fs.writeFileSync(outputPath, JSON.stringify(properties, null, 2));
      console.log(`\n💾 Saved to: ${outputPath}`);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
