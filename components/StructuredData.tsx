/**
 * Structured Data Component
 *
 * Renders JSON-LD structured data for SEO.
 * Helps Google display rich snippets with images, prices, and ratings.
 *
 * USAGE:
 * <StructuredData data={schemaObject} />
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data
 * @see https://schema.org
 */

export default function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  );
}

/**
 * Property Structured Data Component
 *
 * Specific component for property listings.
 * Renders Product schema with property details.
 */

import { generatePropertyStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo';
import type { Property } from '@/data/properties';
import type { Locale } from '@/lib/i18n';

interface PropertyStructuredDataProps {
  property: Property;
  locale?: Locale;
}

export function PropertyStructuredData({ property, locale = 'es' }: PropertyStructuredDataProps) {
  const propertySchema = generatePropertyStructuredData(property, locale);
  const breadcrumbSchema = generateBreadcrumbStructuredData(property, locale);

  return (
    <>
      <StructuredData data={propertySchema} />
      <StructuredData data={breadcrumbSchema} />
    </>
  );
}

/**
 * Organization Structured Data
 *
 * Global organization info for homepage and main pages.
 * Helps Google understand who you are.
 */

export function OrganizationStructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Miraluna',
    description: 'Portal inmobiliario líder en España. Propiedades en Valencia y Madrid.',
    url: 'https://miraluna.es',
    logo: 'https://miraluna.es/logo.png',
    sameAs: [
      // Add social media profiles when available
      // 'https://facebook.com/miraluna',
      // 'https://instagram.com/miraluna',
      // 'https://twitter.com/miraluna',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ES',
    },
    areaServed: [
      {
        '@type': 'State',
        name: 'Comunidad Valenciana',
      },
      {
        '@type': 'State',
        name: 'Comunidad de Madrid',
      },
    ],
  };

  return <StructuredData data={organizationSchema} />;
}

/**
 * Website Search Box Structured Data
 *
 * Adds a search box in Google search results.
 * Users can search your site directly from Google.
 */

export function SearchBoxStructuredData() {
  const searchSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://miraluna.es',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://miraluna.es/buscar?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <StructuredData data={searchSchema} />;
}
