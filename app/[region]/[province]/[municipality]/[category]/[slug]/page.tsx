/**
 * Property Detail Page - Locality-Based URL Structure
 *
 * NEW SEO-OPTIMIZED URL FORMAT:
 * /[region]/[province]/[municipality]/[category]/[slug]
 *
 * Example:
 * /comunidad-valenciana/alicante/javea/venta/villa-moderna-3-dorm-abc123
 *
 * BENEFITS:
 * - Each locality gets its own cached page (ISR)
 * - Better local SEO ranking
 * - Clear hierarchy for Google
 * - Breadcrumbs work automatically
 *
 * METADATA:
 * - Dynamic title, description, OG tags
 * - JSON-LD structured data (Product + Breadcrumb)
 * - Hreflang for multilingual
 * - Canonical URL
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyById } from '@/lib/supabase/server-queries';
import { allProperties as fallbackProperties } from '@/data/properties';
import PropertyDetailClient from './PropertyDetailClient';
import { PropertyStructuredData } from '@/components/StructuredData';
import {
  generatePropertyTitle,
  generatePropertyDescription,
  generatePropertyOG,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateKeywords,
} from '@/lib/seo';

/**
 * Generate metadata for SEO
 *
 * This runs on the server and provides:
 * - Page title
 * - Meta description
 * - OpenGraph tags
 * - Twitter cards
 * - Canonical URL
 * - Hreflang alternates
 * - Keywords
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Extract property ID from slug (last part after final dash)
  const propertyId = params.slug.split('-').pop() || '';

  // Fetch property data
  let property;
  try {
    property = await getPropertyById(propertyId);
    if (!property) {
      property = fallbackProperties.find((p) => p.id === propertyId);
    }
  } catch (error) {
    console.error('Error fetching property for metadata:', error);
    property = fallbackProperties.find((p) => p.id === propertyId);
  }

  if (!property) {
    return {
      title: 'Propiedad no encontrada | Miraluna',
      description: 'La propiedad que buscas no está disponible.',
    };
  }

  const title = generatePropertyTitle(property, 'es');
  const description = generatePropertyDescription(property, 'es');
  const keywords = generateKeywords(property);
  const openGraph = generatePropertyOG(property, 'es');
  const hreflangLinks = generateHreflangLinks(property);
  const canonical = generateCanonicalUrl(property, 'es');

  return {
    title,
    description,
    keywords,
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: property.title,
      description,
      images: [property.images[0]],
    },
    alternates: {
      canonical,
      languages: hreflangLinks,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'property:price:amount': property.price.toString(),
      'property:price:currency': 'EUR',
    },
  };
}

/**
 * Property Detail Page Component
 *
 * Server component that fetches data and passes to client component.
 * Includes structured data for SEO.
 */
export default async function PropertyDetailPage({
  params,
}: {
  params: { region: string; province: string; municipality: string; category: string; slug: string };
}) {
  // Extract property ID from slug
  const propertyId = params.slug.split('-').pop() || '';

  // Fetch property data
  let property;
  try {
    property = await getPropertyById(propertyId);
    if (!property) {
      property = fallbackProperties.find((p) => p.id === propertyId);
    }
  } catch (error) {
    console.error('Error loading property:', error);
    property = fallbackProperties.find((p) => p.id === propertyId);
  }

  if (!property) {
    notFound();
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <PropertyStructuredData property={property} locale="es" />

      {/* Client component with interactive features */}
      <PropertyDetailClient property={property} />
    </>
  );
}

/**
 * Generate static params for top properties (ISR)
 *
 * Pre-renders the top 1000 most viewed properties at build time.
 * Other properties are rendered on-demand and cached.
 */
export async function generateStaticParams() {
  // For now, return empty array
  // In production, fetch top 1000 properties:
  // const properties = await getTopProperties(1000);
  // return properties.map(p => ({ slug: generatePropertySlug(p) }));

  return [];
}
