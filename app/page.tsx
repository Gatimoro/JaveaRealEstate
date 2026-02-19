/**
 * Homepage — Server Component
 *
 * ARCHITECTURE:
 * - This file is a pure data-fetching server component. All UI lives in
 *   HomePageContent (client component) so it can use useLanguage() for i18n.
 * - ISR: revalidates every 5 minutes. On each rebuild, getFeaturedPropertiesForCards
 *   shuffles the pool of 30 and returns a fresh random set of 6 per category.
 *
 * DATA:
 * - getFeaturedPropertiesForCards: 6 cards per category (shuffled from pool of 30)
 * - getPropertyCounts: 3 lightweight count queries (Content-Range header, no rows)
 *
 * SEO:
 * - Metadata and structured data stay in the server component for correct indexing.
 * - Initial HTML is rendered in Spanish (default locale); client hydration updates
 *   to the user's stored locale (same pattern as CategoryNav / Footer).
 */

import CategoryNav from '@/components/CategoryNav';
import HomePageContent from '@/components/HomePageContent';
import Footer from '@/components/Footer';
import { OrganizationStructuredData, SearchBoxStructuredData } from '@/components/StructuredData';
import { getFeaturedPropertiesForCards, getPropertyCounts } from '@/lib/supabase/server-queries';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Miraluna - Propiedades en Venta y Alquiler en España | Valencia, Madrid',
  description: 'Encuentra tu propiedad ideal en Valencia y Madrid. Miles de pisos, casas, chalets y obra nueva en las mejores zonas de España. Actualizado diariamente.',
  keywords: 'inmobiliaria España, pisos Valencia, casas Madrid, alquiler Valencia, venta pisos, obra nueva, real estate Spain',
  openGraph: {
    title: 'Miraluna - Portal Inmobiliario España',
    description: 'Las mejores propiedades en Valencia y Madrid. Miles de opciones actualizadas diariamente.',
    url: 'https://miraluna.es',
    siteName: 'Miraluna',
    images: [{
      url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'Miraluna - Propiedades en España',
    }],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Miraluna - Inmobiliaria España',
    description: 'Propiedades en venta y alquiler en Valencia y Madrid',
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=630&fit=crop'],
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
  alternates: {
    canonical: 'https://miraluna.es',
    languages: {
      'es-ES': 'https://miraluna.es',
      'en-GB': 'https://miraluna.es/en',
      'ru-RU': 'https://miraluna.es/ru',
    },
  },
};

// ---------------------------------------------------------------------------
// ISR: rebuild every 5 minutes
// On each rebuild, getFeaturedPropertiesForCards shuffles its pool and returns
// a fresh random set of 6 cards per category.
// ---------------------------------------------------------------------------

export const revalidate = 300;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Home() {
  const [saleProperties, rentProperties, newBuildingProperties, counts] = await Promise.all([
    getFeaturedPropertiesForCards('sale', 6),
    getFeaturedPropertiesForCards('rent', 6),
    getFeaturedPropertiesForCards('new-building', 6),
    getPropertyCounts(),
  ]);

  return (
    <>
      {/* SEO Structured Data — rendered server-side for correct indexing */}
      <OrganizationStructuredData />
      <SearchBoxStructuredData />

      <main className="min-h-screen bg-background">
        {/* CategoryNav handles its own translations (useLanguage internally) */}
        <CategoryNav showCategories={false} />

        {/* All visible content — client component for locale-aware rendering */}
        <HomePageContent
          saleProperties={saleProperties}
          rentProperties={rentProperties}
          newBuildingProperties={newBuildingProperties}
          counts={counts}
        />

        {/* Footer handles its own translations (useLanguage internally) */}
        <Footer />
      </main>
    </>
  );
}
