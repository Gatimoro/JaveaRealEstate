import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchContent from '@/components/SearchContent';
import { getProperties } from '@/lib/supabase/server-queries';
import { allProperties as fallbackProperties } from '@/data/properties';
import type { Property } from '@/data/properties';

/**
 * Search Page - Server Component
 *
 * Fetches ALL properties on the server with 24-hour caching.
 * Filtering happens client-side for instant results.
 */
export default async function SearchPage() {
  // Fetch all properties on the server (cached for 24 hours!)
  let properties: Property[] = [];

  try {
    properties = await getProperties();
  } catch (error) {
    console.error('Error loading properties from Supabase:', error);
    // Fallback to static data
    properties = fallbackProperties;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando propiedades...</p>
        </div>
      }>
        <SearchContent allProperties={properties} />
      </Suspense>
      <Footer />
    </div>
  );
}
