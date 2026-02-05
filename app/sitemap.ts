/**
 * Dynamic Sitemap Generation
 *
 * Generates sitemap.xml automatically from database properties.
 * Updates daily when properties are scraped.
 *
 * LOCALITY-BASED URLS:
 * Each property gets its own locality-based URL:
 * /valencia/alicante/javea/venta/villa-moderna-abc123
 *
 * This creates individual cached pages for:
 * - Each region
 * - Each province
 * - Each municipality
 * - Each category within municipality
 *
 * SUBMIT TO GOOGLE:
 * curl "https://www.google.com/ping?sitemap=https://miraluna.es/sitemap.xml"
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { MetadataRoute } from 'next';
import { getProperties } from '@/lib/supabase/server-queries';
import { generatePropertyUrl } from '@/lib/seo';
import type { Property } from '@/data/properties';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://miraluna.es';

  // Fetch all properties from database
  let properties: Property[] = [];
  try {
    properties = await getProperties(true); // Use cache
  } catch (error) {
    console.error('Error generating sitemap:', error);
    properties = [];
  }

  // Static pages (highest priority)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/categoria/venta`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categoria/alquiler`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categoria/obra-nueva`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Generate locality pages (region/province/municipality)
  const localities = new Set<string>();
  const localityPages: MetadataRoute.Sitemap = [];

  properties.forEach((property) => {
    if (!property.region || !property.province || !property.municipality) return;

    const regionSlug = slugify(property.region);
    const provinceSlug = slugify(property.province);
    const municipalitySlug = slugify(property.municipality);

    // Region page
    const regionUrl = `${baseUrl}/${regionSlug}`;
    if (!localities.has(regionUrl)) {
      localities.add(regionUrl);
      localityPages.push({
        url: regionUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    // Province page
    const provinceUrl = `${baseUrl}/${regionSlug}/${provinceSlug}`;
    if (!localities.has(provinceUrl)) {
      localities.add(provinceUrl);
      localityPages.push({
        url: provinceUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    // Municipality page
    const municipalityUrl = `${baseUrl}/${regionSlug}/${provinceSlug}/${municipalitySlug}`;
    if (!localities.has(municipalityUrl)) {
      localities.add(municipalityUrl);
      localityPages.push({
        url: municipalityUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    // Municipality + Category pages
    if (property.listing_type) {
      const categoryMap = {
        sale: 'venta',
        rent: 'alquiler',
        'new-building': 'obra-nueva',
      };
      const categorySlug = categoryMap[property.listing_type as keyof typeof categoryMap];

      const categoryUrl = `${municipalityUrl}/${categorySlug}`;
      if (!localities.has(categoryUrl)) {
        localities.add(categoryUrl);
        localityPages.push({
          url: categoryUrl,
          lastModified: new Date(),
          changeFrequency: 'hourly',
          priority: 0.85,
        });
      }
    }
  });

  // Property pages (individual listings)
  const propertyPages: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${baseUrl}${generatePropertyUrl(property, 'es')}`,
    lastModified: property.updated_at || property.created_at || new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
    // Add alternate language versions
    alternates: {
      languages: {
        es: `${baseUrl}${generatePropertyUrl(property, 'es')}`,
        en: `${baseUrl}${generatePropertyUrl(property, 'en')}`,
        ru: `${baseUrl}${generatePropertyUrl(property, 'ru')}`,
      },
    },
  }));

  return [...staticPages, ...localityPages, ...propertyPages];
}

/**
 * Helper function to slugify text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
