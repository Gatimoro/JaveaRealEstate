/**
 * Data Processor and Translator
 *
 * Processes scraped property data and handles translations.
 * Converts JaveaHomeFinders data to Miraluna format.
 *
 * Usage:
 *   import { processProperty, translateDescription } from './dataProcessor';
 */

import type { ScrapedProperty } from './scraper';
import type { Property } from '@/data/properties';

// ============================================================================
// TYPES
// ============================================================================

export interface TranslationOptions {
  targetLanguage: 'es' | 'en' | 'ru';
  useAI?: boolean; // Set to true to use AI translation API
}

// ============================================================================
// TRANSLATION FUNCTIONS
// ============================================================================

/**
 * Translates text using Google Translate API (free tier)
 * For production, use a proper translation service like DeepL or Google Cloud Translate
 */
export async function translateText(
  text: string,
  targetLang: 'es' | 'en' | 'ru',
  sourceLang: 'en' | 'es' = 'en'
): Promise<string> {
  // For now, return placeholder - integrate with translation API later
  console.log(`🌐 Translation needed: ${sourceLang} -> ${targetLang}`);

  // Simple rule-based translation for common real estate terms
  const translations: Record<string, Record<string, string>> = {
    es: {
      'bedroom': 'dormitorio',
      'bedrooms': 'dormitorios',
      'bathroom': 'baño',
      'bathrooms': 'baños',
      'pool': 'piscina',
      'villa': 'villa',
      'apartment': 'apartamento',
      'townhouse': 'adosado',
      'plot': 'parcela',
      'terrace': 'terraza',
      'garage': 'garaje',
      'sea view': 'vista al mar',
      'mountain view': 'vista a la montaña',
      'renovated': 'reformado',
      'new build': 'obra nueva',
    },
    ru: {
      'bedroom': 'спальня',
      'bedrooms': 'спальни',
      'bathroom': 'ванная',
      'bathrooms': 'ванные',
      'pool': 'бассейн',
      'villa': 'вилла',
      'apartment': 'квартира',
      'townhouse': 'таунхаус',
      'plot': 'участок',
      'terrace': 'терраса',
      'garage': 'гараж',
      'sea view': 'вид на море',
      'mountain view': 'вид на горы',
      'renovated': 'отремонтированный',
      'new build': 'новостройка',
    },
  };

  if (targetLang === sourceLang) {
    return text;
  }

  // Simple word replacement for basic translation
  let translated = text;
  const dict = translations[targetLang];

  if (dict) {
    Object.entries(dict).forEach(([en, target]) => {
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      translated = translated.replace(regex, target);
    });
  }

  // TODO: Integrate with proper translation API:
  // - Google Cloud Translation API
  // - DeepL API
  // - Azure Translator
  // - OpenAI GPT for high-quality translations

  return translated;
}

/**
 * Translates property description to all supported languages
 */
export async function translateDescription(description: string): Promise<{
  en: string;
  es: string;
  ru: string;
}> {
  // Assume source is English
  const en = description;
  const es = await translateText(description, 'es', 'en');
  const ru = await translateText(description, 'ru', 'en');

  return { en, es, ru };
}

// ============================================================================
// DATA PROCESSING FUNCTIONS
// ============================================================================

/**
 * Generates a unique ID for a property
 */
function generatePropertyId(reference: string): string {
  // Create a clean ID from reference
  return reference.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * Maps location to area code
 */
function mapLocationToArea(location: string): string {
  const lower = location.toLowerCase();

  // Jávea areas
  if (lower.includes('old town') || lower.includes('pueblo')) return 'old-town';
  if (lower.includes('arenal') || lower.includes('beach')) return 'arenal';
  if (lower.includes('port') || lower.includes('puerto')) return 'port';
  if (lower.includes('cap marti')) return 'cap-marti';
  if (lower.includes('granadella')) return 'granadella';
  if (lower.includes('montgo') || lower.includes('montgó')) return 'montgo';
  if (lower.includes('pinosol')) return 'pinosol';

  // Other locations
  if (lower.includes('moraira')) return 'moraira';
  if (lower.includes('denia') || lower.includes('dénia')) return 'denia';
  if (lower.includes('benitachell')) return 'benitachell';

  return 'other';
}

/**
 * Generates property features array
 */
function generateFeatures(scrapedProperty: ScrapedProperty): string[] {
  const features: string[] = [];

  if (scrapedProperty.hasPool) features.push('pool');
  if (scrapedProperty.plotSize && scrapedProperty.plotSize > 0) features.push('garden');
  if (scrapedProperty.features.some(f => f.toLowerCase().includes('parking'))) features.push('parking');
  if (scrapedProperty.features.some(f => f.toLowerCase().includes('terrace'))) features.push('terrace');
  if (scrapedProperty.features.some(f => f.toLowerCase().includes('balcony'))) features.push('balcony');
  if (scrapedProperty.features.some(f => f.toLowerCase().includes('view'))) features.push('views');
  if (scrapedProperty.features.some(f => f.toLowerCase().includes('air con'))) features.push('air-conditioning');
  if (scrapedProperty.features.some(f => f.toLowerCase().includes('storage'))) features.push('storage');

  return features;
}

/**
 * Processes scraped property into Miraluna format
 */
export async function processProperty(
  scraped: ScrapedProperty,
  includeTranslations: boolean = true
): Promise<Partial<Property>> {
  const id = generatePropertyId(scraped.reference);
  const area = mapLocationToArea(scraped.location);

  // Translate description if requested
  let descriptions = {
    en: scraped.description,
    es: scraped.descriptionSpanish || scraped.description,
    ru: scraped.description,
  };

  if (includeTranslations) {
    descriptions = await translateDescription(scraped.description);
  }

  // Convert to Miraluna property format
  const property: Partial<Property> = {
    id,
    title: {
      en: scraped.title,
      es: scraped.title, // TODO: Translate
      ru: scraped.title, // TODO: Translate
    },
    type: scraped.type,
    price: scraped.price,
    location: scraped.location,
    area,
    bedrooms: scraped.bedrooms,
    bathrooms: scraped.bathrooms,
    size: scraped.buildSize,
    plotSize: scraped.plotSize,
    description: descriptions,
    features: generateFeatures(scraped),
    images: scraped.images,
    mainImage: scraped.mainImage,
    available: scraped.status === 'available',
  };

  return property;
}

/**
 * Processes multiple scraped properties
 */
export async function processAllProperties(
  scrapedProperties: ScrapedProperty[],
  includeTranslations: boolean = false
): Promise<Partial<Property>[]> {
  console.log(`\n🔄 Processing ${scrapedProperties.length} properties...`);

  const processed: Partial<Property>[] = [];

  for (let i = 0; i < scrapedProperties.length; i++) {
    try {
      console.log(`[${i + 1}/${scrapedProperties.length}] Processing ${scrapedProperties[i].reference}...`);
      const property = await processProperty(scrapedProperties[i], includeTranslations);
      processed.push(property);
    } catch (error) {
      console.error(`❌ Error processing ${scrapedProperties[i].reference}:`, error);
    }
  }

  console.log(`✅ Processed ${processed.length} properties`);
  return processed;
}

// ============================================================================
// DATA CLEANING FUNCTIONS
// ============================================================================

/**
 * Cleans and normalizes property data
 */
export function cleanProperty(property: Partial<Property>): Partial<Property> {
  return {
    ...property,
    // Ensure price is a valid number
    price: Math.max(0, property.price || 0),

    // Ensure sizes are valid
    size: Math.max(0, property.size || 0),
    plotSize: property.plotSize ? Math.max(0, property.plotSize) : undefined,

    // Ensure counts are valid
    bedrooms: Math.max(0, property.bedrooms || 0),
    bathrooms: Math.max(0, property.bathrooms || 0),

    // Remove duplicate features
    features: property.features ? [...new Set(property.features)] : [],

    // Remove duplicate images
    images: property.images ? [...new Set(property.images)] : [],
  };
}

/**
 * Validates property data
 */
export function validateProperty(property: Partial<Property>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!property.id) errors.push('Missing property ID');
  if (!property.title || !property.title.en) errors.push('Missing property title');
  if (!property.type) errors.push('Missing property type');
  if (!property.price || property.price <= 0) errors.push('Invalid price');
  if (!property.location) errors.push('Missing location');
  if (!property.mainImage) errors.push('Missing main image');
  if (!property.description || !property.description.en) errors.push('Missing description');

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Exports properties to JSON file compatible with data/properties.ts
 */
export function exportToJSON(properties: Partial<Property>[]): string {
  const validProperties = properties.filter(p => validateProperty(p).valid);

  return JSON.stringify(validProperties, null, 2);
}

/**
 * Exports properties to TypeScript format
 */
export function exportToTypeScript(properties: Partial<Property>[]): string {
  const validProperties = properties.filter(p => validateProperty(p).valid);

  return `import type { Property } from './properties';

export const scrapedProperties: Property[] = ${JSON.stringify(validProperties, null, 2)} as Property[];
`;
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  // Load scraped properties
  const scrapedPath = path.join(__dirname, '..', 'scraped-properties.json');

  if (!fs.existsSync(scrapedPath)) {
    console.error('❌ scraped-properties.json not found. Run the scraper first!');
    process.exit(1);
  }

  const scrapedProperties = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));

  processAllProperties(scrapedProperties, false)
    .then(processed => {
      // Clean all properties
      const cleaned = processed.map(cleanProperty);

      // Validate
      const validation = cleaned.map(p => ({
        id: p.id,
        ...validateProperty(p),
      }));

      const valid = validation.filter(v => v.valid);
      const invalid = validation.filter(v => !v.valid);

      console.log(`\n📊 Validation Results:`);
      console.log(`✅ Valid: ${valid.length}`);
      console.log(`❌ Invalid: ${invalid.length}`);

      if (invalid.length > 0) {
        console.log(`\n⚠️  Invalid Properties:`);
        invalid.forEach(v => {
          console.log(`  ${v.id}: ${v.errors.join(', ')}`);
        });
      }

      // Export to JSON
      const jsonOutput = exportToJSON(cleaned);
      const jsonPath = path.join(__dirname, '..', 'processed-properties.json');
      fs.writeFileSync(jsonPath, jsonOutput);
      console.log(`\n💾 Saved JSON to: ${jsonPath}`);

      // Export to TypeScript
      const tsOutput = exportToTypeScript(cleaned);
      const tsPath = path.join(__dirname, '..', 'data', 'scraped-properties.ts');
      fs.writeFileSync(tsPath, tsOutput);
      console.log(`💾 Saved TypeScript to: ${tsPath}`);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
