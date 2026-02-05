/**
 * SEO Tests
 *
 * Tests to verify SEO implementation is correct.
 * Run with: npm test -- seo.test.ts
 *
 * WHAT WE TEST:
 * - Metadata generation
 * - URL slugification
 * - Structured data validity
 * - Canonical URLs
 * - Hreflang links
 * - Sitemap generation
 */

import {
  generatePropertySlug,
  generatePropertyUrl,
  generatePropertyTitle,
  generatePropertyDescription,
  generatePropertyStructuredData,
  generateBreadcrumbStructuredData,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateKeywords,
  getDomainForRegion,
} from '@/lib/seo';
import type { Property } from '@/data/properties';

// Mock property for testing
const mockProperty: Property = {
  id: 'test-123',
  title: 'Villa Moderna con Piscina',
  description: 'Hermosa villa con vistas al mar en Jávea. 3 dormitorios, 2 baños, piscina privada.',
  price: 450000,
  location: 'Jávea, Alicante',
  region: 'Comunidad Valenciana',
  province: 'Alicante',
  municipality: 'Jávea',
  listing_type: 'sale',
  sub_category: 'house',
  type: 'house',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  specs: {
    bedrooms: 3,
    bathrooms: 2,
    size: 180,
  },
  status: 'available',
  latitude: 38.7915,
  longitude: 0.1750,
};

describe('SEO Utilities', () => {
  describe('generatePropertySlug', () => {
    it('should generate URL-safe slug from property title', () => {
      const slug = generatePropertySlug(mockProperty);
      expect(slug).toBe('villa-moderna-con-piscina-test-123');
      expect(slug).not.toContain(' ');
      expect(slug).not.toContain('á');
      expect(slug).not.toContain('é');
    });

    it('should handle special characters', () => {
      const property = {
        ...mockProperty,
        title: 'Apartamento en Playa: ¡Nuevo!',
      };
      const slug = generatePropertySlug(property);
      expect(slug).toMatch(/^apartamento-en-playa-nuevo-/);
      expect(slug).not.toContain(':');
      expect(slug).not.toContain('!');
      expect(slug).not.toContain('¡');
    });

    it('should limit slug length', () => {
      const property = {
        ...mockProperty,
        title: 'A'.repeat(100), // Very long title
      };
      const slug = generatePropertySlug(property);
      expect(slug.length).toBeLessThan(70);
    });
  });

  describe('generatePropertyUrl', () => {
    it('should generate correct locality-based URL', () => {
      const url = generatePropertyUrl(mockProperty, 'es');
      expect(url).toBe('/comunidad-valenciana/alicante/javea/venta/villa-moderna-con-piscina-test-123');
    });

    it('should handle different languages', () => {
      const urlEs = generatePropertyUrl(mockProperty, 'es');
      const urlEn = generatePropertyUrl(mockProperty, 'en');
      const urlRu = generatePropertyUrl(mockProperty, 'ru');

      expect(urlEs).toContain('/venta/');
      expect(urlEn).toContain('/sale/');
      expect(urlRu).toContain('/prodazha/');
    });

    it('should handle rent properties', () => {
      const property = { ...mockProperty, listing_type: 'rent' as const };
      const url = generatePropertyUrl(property, 'es');
      expect(url).toContain('/alquiler/');
    });

    it('should handle new-building properties', () => {
      const property = { ...mockProperty, listing_type: 'new-building' as const };
      const url = generatePropertyUrl(property, 'es');
      expect(url).toContain('/obra-nueva/');
    });
  });

  describe('generatePropertyTitle', () => {
    it('should generate SEO-optimized title', () => {
      const title = generatePropertyTitle(mockProperty, 'es');
      expect(title).toContain('Villa Moderna con Piscina');
      expect(title).toContain('450');
      expect(title).toContain('Jávea');
      expect(title).toContain('Miraluna');
    });

    it('should be under 60 characters for Google', () => {
      const title = generatePropertyTitle(mockProperty, 'es');
      expect(title.length).toBeLessThanOrEqual(70); // Some flexibility
    });
  });

  describe('generatePropertyDescription', () => {
    it('should generate meta description with specs', () => {
      const description = generatePropertyDescription(mockProperty, 'es');
      expect(description).toContain('3 dorm');
      expect(description).toContain('2 baños');
      expect(description).toContain('180m²');
      expect(description).toContain('Jávea');
    });

    it('should be under 155 characters for Google', () => {
      const description = generatePropertyDescription(mockProperty, 'es');
      expect(description.length).toBeLessThanOrEqual(155);
    });
  });

  describe('generatePropertyStructuredData', () => {
    it('should generate valid schema.org Product JSON-LD', () => {
      const structuredData = generatePropertyStructuredData(mockProperty, 'es');

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('Product');
      expect(structuredData.name).toBe(mockProperty.title);
      expect(structuredData.offers.price).toBe(450000);
      expect(structuredData.offers.priceCurrency).toBe('EUR');
    });

    it('should include address and geo coordinates', () => {
      const structuredData = generatePropertyStructuredData(mockProperty, 'es');

      expect(structuredData.address).toBeDefined();
      expect(structuredData.address.addressLocality).toBe('Jávea');
      expect(structuredData.address.addressRegion).toBe('Alicante');
      expect(structuredData.address.addressCountry).toBe('ES');

      expect(structuredData.geo).toBeDefined();
      expect(structuredData.geo.latitude).toBe(38.7915);
      expect(structuredData.geo.longitude).toBe(0.1750);
    });

    it('should include property specs', () => {
      const structuredData = generatePropertyStructuredData(mockProperty, 'es');

      expect(structuredData.additionalProperty).toBeDefined();
      expect(structuredData.additionalProperty.length).toBeGreaterThan(0);

      const bedroomsProp = structuredData.additionalProperty.find((p: any) => p.name === 'Bedrooms');
      expect(bedroomsProp).toBeDefined();
      expect(bedroomsProp.value).toBe(3);
    });
  });

  describe('generateBreadcrumbStructuredData', () => {
    it('should generate valid BreadcrumbList JSON-LD', () => {
      const breadcrumb = generateBreadcrumbStructuredData(mockProperty, 'es');

      expect(breadcrumb['@context']).toBe('https://schema.org');
      expect(breadcrumb['@type']).toBe('BreadcrumbList');
      expect(breadcrumb.itemListElement).toBeInstanceOf(Array);
      expect(breadcrumb.itemListElement.length).toBeGreaterThanOrEqual(5);
    });

    it('should have correct hierarchy', () => {
      const breadcrumb = generateBreadcrumbStructuredData(mockProperty, 'es');
      const items = breadcrumb.itemListElement;

      expect(items[0].name).toBe('Inicio');
      expect(items[1].name).toBe('Comunidad Valenciana');
      expect(items[2].name).toBe('Alicante');
      expect(items[3].name).toBe('Jávea');
      expect(items[4].name).toBe('Venta');
      expect(items[5].name).toBe(mockProperty.title);
    });

    it('should have incrementing positions', () => {
      const breadcrumb = generateBreadcrumbStructuredData(mockProperty, 'es');
      const items = breadcrumb.itemListElement;

      items.forEach((item: any, index: number) => {
        expect(item.position).toBe(index + 1);
      });
    });
  });

  describe('generateHreflangLinks', () => {
    it('should generate hreflang alternates for all languages', () => {
      const hreflang = generateHreflangLinks(mockProperty);

      expect(hreflang['es-ES']).toBeDefined();
      expect(hreflang['en-GB']).toBeDefined();
      expect(hreflang['ru-RU']).toBeDefined();
      expect(hreflang['x-default']).toBeDefined();
    });

    it('should have different URLs for different languages', () => {
      const hreflang = generateHreflangLinks(mockProperty);

      expect(hreflang['es-ES']).toContain('/venta/');
      expect(hreflang['en-GB']).toContain('/sale/');
      expect(hreflang['ru-RU']).toContain('/prodazha/');
    });

    it('should default to Spanish', () => {
      const hreflang = generateHreflangLinks(mockProperty);
      expect(hreflang['x-default']).toBe(hreflang['es-ES']);
    });
  });

  describe('generateCanonicalUrl', () => {
    it('should generate correct canonical URL', () => {
      const canonical = generateCanonicalUrl(mockProperty, 'es');

      expect(canonical).toMatch(/^https:\/\//);
      expect(canonical).toContain('comunidad-valenciana');
      expect(canonical).toContain('alicante');
      expect(canonical).toContain('javea');
      expect(canonical).toContain('venta');
    });

    it('should use miralunavalencia.com for Valencia region', () => {
      const canonical = generateCanonicalUrl(mockProperty, 'es');
      expect(canonical).toContain('miralunavalencia.com');
    });

    it('should use miraluna.es for other regions', () => {
      const madridProperty = {
        ...mockProperty,
        region: 'Comunidad de Madrid',
        province: 'Madrid',
        municipality: 'Madrid',
      };
      const canonical = generateCanonicalUrl(madridProperty, 'es');
      expect(canonical).toContain('miraluna.es');
    });
  });

  describe('generateKeywords', () => {
    it('should generate relevant keywords', () => {
      const keywords = generateKeywords(mockProperty);

      expect(keywords).toContain('Jávea');
      expect(keywords).toContain('Alicante');
      expect(keywords).toContain('Comunidad Valenciana');
      expect(keywords).toContain('sale');
      expect(keywords).toContain('house');
      expect(keywords).toContain('3 dormitorios');
    });

    it('should include listing type keywords', () => {
      const saleProperty = { ...mockProperty, listing_type: 'sale' as const };
      const rentProperty = { ...mockProperty, listing_type: 'rent' as const };

      const saleKeywords = generateKeywords(saleProperty);
      const rentKeywords = generateKeywords(rentProperty);

      expect(saleKeywords).toContain('venta');
      expect(rentKeywords).toContain('alquiler');
    });
  });

  describe('getDomainForRegion', () => {
    it('should return miralunavalencia.com for Valencia region', () => {
      const domain = getDomainForRegion('Comunidad Valenciana');
      expect(domain).toBe('https://miralunavalencia.com');
    });

    it('should return miraluna.es for other regions', () => {
      const domain = getDomainForRegion('Comunidad de Madrid');
      expect(domain).toBe('https://miraluna.es');
    });

    it('should default to miraluna.es when region not specified', () => {
      const domain = getDomainForRegion();
      expect(domain).toBe('https://miraluna.es');
    });
  });
});

/**
 * Manual SEO Checklist
 *
 * Run these checks manually:
 *
 * 1. Google Rich Results Test:
 *    https://search.google.com/test/rich-results
 *
 * 2. Schema.org Validator:
 *    https://validator.schema.org/
 *
 * 3. Google Lighthouse SEO:
 *    - Open Chrome DevTools
 *    - Run Lighthouse audit
 *    - Check SEO score (target: >95)
 *
 * 4. Mobile-Friendly Test:
 *    https://search.google.com/test/mobile-friendly
 *
 * 5. Page Speed Insights:
 *    https://pagespeed.web.dev/
 *
 * 6. Submit Sitemap to Google Search Console:
 *    https://search.google.com/search-console
 *    - Add property
 *    - Submit sitemap: https://miraluna.es/sitemap.xml
 *
 * 7. Check robots.txt:
 *    Visit: https://miraluna.es/robots.txt
 *
 * 8. Test hreflang:
 *    Use Merkle's Hreflang Tags Testing Tool
 */
