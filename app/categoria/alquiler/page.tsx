import { Suspense } from 'react';
import CategoryNav from '@/components/CategoryNav';
import CategoryPage from '@/components/CategoryPage';
import Footer from '@/components/Footer';
import { getProperties } from '@/lib/supabase/server-queries';
import type { Property } from '@/data/properties';

/**
 * Rent Category Page
 */
export default async function RentPage() {
  let properties: Property[] = [];

  try {
    const allProps = await getProperties();
    // Filter for rent properties
    properties = allProps.filter(p => p.listing_type === 'rent');
  } catch (error) {
    console.error('Error loading properties:', error);
    // Fallback to empty array (until data is migrated)
    properties = [];
  }

  return (
    <main className="min-h-screen bg-background">
      <CategoryNav />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando propiedades...</p>
        </div>
      }>
        <CategoryPage
          title="Propiedades en alquiler en Jávea"
          properties={properties}
          categoryType="rent"
        />
      </Suspense>
      <Footer />
    </main>
  );
}
