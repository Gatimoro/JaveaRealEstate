/**
 * Robots.txt Configuration
 *
 * Tells search engines which pages to crawl and where to find the sitemap.
 *
 * CONFIGURATION:
 * - Allow all search engines to crawl everything
 * - Except: API routes, auth callbacks, user profiles
 * - Sitemap location: https://miraluna.es/sitemap.xml
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',        // API routes (no indexing)
          '/auth/',       // Auth callbacks (no indexing)
          '/profile',     // User profiles (private)
          '/_next/',      // Next.js internals
          '/admin',       // Admin dashboard (future)
        ],
      },
      {
        // Special rules for Google
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/auth/', '/profile'],
      },
      {
        // Special rules for Bing
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/auth/', '/profile'],
      },
    ],
    sitemap: [
      'https://miraluna.es/sitemap.xml',
      'https://miralunavalencia.com/sitemap.xml', // Valencia-specific domain
    ],
    host: 'https://miraluna.es', // Preferred domain
  };
}
