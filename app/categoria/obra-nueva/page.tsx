import { Suspense } from 'react';
import CategoryNav from '@/components/CategoryNav';
import CategoryPage from '@/components/CategoryPage';
import Footer from '@/components/Footer';
import { getProperties } from '@/lib/supabase/server-queries';
import { allProperties as fallbackProperties } from '@/data/properties';
import type { Property } from '@/data/properties';

/**
 * New Buildings Category Page
 */
export default async function NewBuildingsPage() {
  let properties: Property[] = [];

  try {
    const allProps = await getProperties();
    // Filter for new buildings
    properties = allProps.filter(p => p.listing_type === 'new-building');
  } catch (error) {
    console.error('Error loading properties:', error);
    // Fallback to empty array for now (until data is migrated)
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
          title="Obra nueva en Jávea"
          properties={properties}
          categoryType="new-building"
        />
      </Suspense>
      <Footer />
    </main>
  );
}
