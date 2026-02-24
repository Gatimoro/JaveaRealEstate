/**
 * SEO Utilities - Centralized SEO Functions
 *
 * This module provides utilities for:
 * - Dynamic metadata generation
 * - Structured data (JSON-LD)
 * - Canonical URLs
 * - Multi-domain handling
 *
 * MULTI-DOMAIN STRATEGY:
 * - miralunavalencia.com → Primary domain for Valencia region
 * - miraluna.es → Main Spain-wide domain
 * - miraluna.blog → Content marketing (future)
 *
 * URL STRUCTURE (Option B - Locality Hierarchy):
 * /{region}/{province}/{municipality}/{category}/{slug}
 * Example: /valencia/alicante/javea/venta/villa-moderna-3-dorm-abc123
 *
 * Benefits:
 * - Each locality gets its own cached page (ISR)
 * - Better local SEO ranking
 * - Clear breadcrumb structure
 * - Google indexes location hierarchy
 */

import type { Property } from '@/data/properties';
import type { Locale } from './i18n';
import { formatPrice } from './utils';

/**
 * Generate SEO-friendly URL slug from property title
 *
 * @param property - Property object
 * @returns URL-safe slug with property ID
 *
 * @example
 * generatePropertySlug({ title: "Villa Moderna", id: "abc123" })
 * // Returns: "villa-moderna-abc123"
 */
export function generatePropertySlug(property: Property): string {
  const titleSlug = property.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50); // Max 50 chars for title part

  return `${titleSlug}--${property.id}`;
}

/**
 * Generate full locality-based URL path for property
 *
 * @param property - Property with location data
 * @param locale - Language locale (optional, defaults to 'es')
 * @returns Full URL path with locality hierarchy
 *
 * @example
 * generatePropertyUrl({
 *   municipality: "Jávea",
 *   province: "Alicante",
 *   region: "Comunidad Valenciana",
 *   listing_type: "sale",
 *   title: "Villa Moderna",
 *   id: "abc123"
 * })
 * // Returns: "/comunidad-valenciana/alicante/javea/venta/villa-moderna-abc123"
 */
export function generatePropertyUrl(property: Property, locale: Locale = 'es'): string {
  const regionSlug = slugify(property.region || 'espana');
  const provinceSlug = slugify(property.province || '');
  const municipalitySlug = slugify(property.municipality || property.location);

  const categoryMap = {
    es: { sale: 'venta', rent: 'alquiler', 'new-building': 'obra-nueva' },
    en: { sale: 'sale', rent: 'rent', 'new-building': 'new-building' },
    ru: { sale: 'prodazha', rent: 'arenda', 'new-building': 'novostroyka' },
  };

  const categorySlug = categoryMap[locale][property.listing_type || 'sale'];
  const propertySlug = generatePropertySlug(property);

  // Build hierarchical URL
  const parts = [regionSlug, provinceSlug, municipalitySlug, categorySlug, propertySlug].filter(Boolean);
  return `/${parts.join('/')}`;
}

/**
 * Helper function to slugify text (internal use)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a property href for use in links.
 *
 * Uses the full SEO URL when region/province/municipality are present,
 * falls back to /propiedad/[id] when location hierarchy is incomplete.
 *
 * Accepts both full Property and minimal PropertyCard objects.
 */
export function getPropertyHref(property: {
  id: string;
  title: string;
  listing_type?: string;
  region?: string;
  province?: string;
  municipality?: string;
  location: string;
}): string {
  if (property.region && property.province && property.municipality) {
    const regionSlug = slugify(property.region);
    const provinceSlug = slugify(property.province);
    const municipalitySlug = slugify(property.municipality);
    const categoryMap: Record<string, string> = {
      sale: 'venta',
      rent: 'alquiler',
      'new-building': 'obra-nueva',
    };
    const categorySlug = categoryMap[property.listing_type || 'sale'] ?? 'venta';
    const titleSlug = slugify(property.title).slice(0, 50);
    const propertySlug = `${titleSlug}--${property.id}`;
    return `/${regionSlug}/${provinceSlug}/${municipalitySlug}/${categorySlug}/${propertySlug}`;
  }
  return `/propiedad/${property.id}`;
}

/**
 * Generate OpenGraph metadata for property
 *
 * @param property - Property object
 * @param locale - Language locale
 * @returns OpenGraph metadata object
 */
export function generatePropertyOG(property: Property, locale: Locale = 'es') {
  const url = `https://miraluna.es${generatePropertyUrl(property, locale)}`;

  return {
    title: property.title,
    description: property.description?.slice(0, 155) || property.title,
    url,
    siteName: 'Miraluna',
    images: [{
      url: property.images[0],
      width: 1200,
      height: 630,
      alt: property.title,
    }],
    locale: locale === 'es' ? 'es_ES' : locale === 'en' ? 'en_GB' : 'ru_RU',
    type: 'article',
  };
}

/**
 * Generate JSON-LD structured data for property listing
 *
 * This helps Google show rich snippets with price, images, and specs.
 *
 * @param property - Property object
 * @param locale - Language locale
 * @returns JSON-LD structured data object
 *
 * @see https://schema.org/Product
 */
export function generatePropertyStructuredData(property: Property, locale: Locale = 'es') {
  const url = `https://miraluna.es${generatePropertyUrl(property, locale)}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: property.description || property.title,
    image: property.images,
    brand: {
      '@type': 'Brand',
      name: 'Miraluna',
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'EUR',
      availability: property.status === 'available'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.municipality,
      addressRegion: property.province,
      addressCountry: 'ES',
      postalCode: property.postal_code,
    },
    geo: property.latitude && property.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    } : undefined,
    additionalProperty: [
      property.specs?.bedrooms && {
        '@type': 'PropertyValue',
        name: 'Bedrooms',
        value: property.specs.bedrooms,
      },
      property.specs?.bathrooms && {
        '@type': 'PropertyValue',
        name: 'Bathrooms',
        value: property.specs.bathrooms,
      },
      property.specs?.size && {
        '@type': 'PropertyValue',
        name: 'Floor Area',
        value: property.specs.size,
        unitCode: 'MTK', // Square meters
      },
    ].filter(Boolean),
  };
}

/**
 * Generate breadcrumb structured data
 *
 * Shows breadcrumb navigation in Google search results.
 *
 * @param property - Property object
 * @param locale - Language locale
 * @returns Breadcrumb JSON-LD object
 *
 * @see https://schema.org/BreadcrumbList
 */
export function generateBreadcrumbStructuredData(property: Property, locale: Locale = 'es') {
  const baseUrl = 'https://miraluna.es';

  const categoryMap = {
    es: { sale: 'Venta', rent: 'Alquiler', 'new-building': 'Obra Nueva' },
    en: { sale: 'Sale', rent: 'Rent', 'new-building': 'New Buildings' },
    ru: { sale: 'Продажа', rent: 'Аренда', 'new-building': 'Новостройки' },
  };

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Inicio',
      item: baseUrl,
    },
  ];

  if (property.region) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: property.region,
      item: `${baseUrl}/${slugify(property.region)}`,
    });
  }

  if (property.province) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: property.province,
      item: `${baseUrl}/${slugify(property.region || '')}/${slugify(property.province)}`,
    });
  }

  if (property.municipality) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: property.municipality,
      item: `${baseUrl}/${slugify(property.region || '')}/${slugify(property.province || '')}/${slugify(property.municipality)}`,
    });
  }

  if (property.listing_type) {
    const categoryName = categoryMap[locale][property.listing_type];
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: categoryName,
      item: `${baseUrl}/${slugify(property.region || '')}/${slugify(property.province || '')}/${slugify(property.municipality || property.location)}/${property.listing_type}`,
    });
  }

  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: property.title,
    item: `${baseUrl}${generatePropertyUrl(property, locale)}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate hreflang alternate links for multilingual SEO
 *
 * Tells Google about language versions of the same page.
 *
 * @param property - Property object
 * @returns Object with language alternate URLs
 *
 * @example
 * // Returns:
 * {
 *   'es-ES': '/valencia/alicante/javea/venta/villa-abc123',
 *   'en-GB': '/valencia/alicante/javea/sale/villa-abc123',
 *   'ru-RU': '/valencia/alicante/javea/prodazha/villa-abc123',
 *   'x-default': '/valencia/alicante/javea/venta/villa-abc123',
 * }
 */
export function generateHreflangLinks(property: Property) {
  return {
    'es-ES': generatePropertyUrl(property, 'es'),
    'en-GB': generatePropertyUrl(property, 'en'),
    'ru-RU': generatePropertyUrl(property, 'ru'),
    'x-default': generatePropertyUrl(property, 'es'), // Default to Spanish
  };
}

/**
 * Generate SEO-optimized page title
 *
 * Format: [Property Title] - [Price] | [Municipality] | Miraluna
 *
 * @param property - Property object
 * @param locale - Language locale
 * @returns SEO-optimized title (max 60 chars)
 */
export function generatePropertyTitle(property: Property, locale: Locale = 'es'): string {
  const price = formatPrice(property.price, locale);
  const location = property.municipality || property.location;

  // Keep under 60 characters for Google
  const title = `${property.title.slice(0, 30)} - ${price}`;
  return `${title} | ${location} | Miraluna`;
}

/**
 * Generate SEO-optimized meta description
 *
 * @param property - Property object
 * @param locale - Language locale
 * @returns Meta description (max 155 chars)
 */
export function generatePropertyDescription(property: Property, locale: Locale = 'es'): string {
  const specs = [];
  if (property.specs?.bedrooms) specs.push(`${property.specs.bedrooms} dorm`);
  if (property.specs?.bathrooms) specs.push(`${property.specs.bathrooms} baños`);
  if (property.specs?.size) specs.push(`${property.specs.size}m²`);

  const specsText = specs.join(', ');
  const location = property.municipality || property.location;
  const price = formatPrice(property.price, locale);

  return `${property.title} en ${location}. ${specsText}. Precio: ${price}. ${property.description?.slice(0, 50) || ''}`.slice(0, 155);
}

/**
 * Get domain for specific region (multi-domain strategy)
 *
 * @param region - Region name
 * @returns Domain URL
 *
 * MULTI-DOMAIN STRATEGY:
 * - Valencia region → miralunavalencia.com (primary for local SEO)
 * - All Spain → miraluna.es (main domain)
 * - Future: miraluna.blog for content marketing
 */
export function getDomainForRegion(region?: string): string {
  if (region?.toLowerCase().includes('valencia')) {
    return 'https://miralunavalencia.com';
  }

  // Default to main Spain domain
  return 'https://miraluna.es';
}

/**
 * Generate canonical URL with correct domain
 *
 * @param property - Property object
 * @param locale - Language locale
 * @returns Canonical URL with appropriate domain
 */
export function generateCanonicalUrl(property: Property, locale: Locale = 'es'): string {
  const domain = getDomainForRegion(property.region);
  const path = generatePropertyUrl(property, locale);
  return `${domain}${path}`;
}

/**
 * Generate keywords for meta tags
 *
 * @param property - Property object
 * @returns Comma-separated keywords string
 */
export function generateKeywords(property: Property): string {
  const keywords = [
    property.municipality,
    property.province,
    property.region,
    property.listing_type,
    property.sub_category,
  ];

  if (property.specs?.bedrooms) {
    keywords.push(`${property.specs.bedrooms} dormitorios`);
  }

  if (property.listing_type === 'sale') {
    keywords.push('comprar', 'venta', 'inmobiliaria');
  } else if (property.listing_type === 'rent') {
    keywords.push('alquilar', 'alquiler', 'renta');
  } else if (property.listing_type === 'new-building') {
    keywords.push('obra nueva', 'nuevos proyectos');
  }

  return keywords.filter(Boolean).join(', ');
}
