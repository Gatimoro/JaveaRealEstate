import { Suspense } from 'react';
import CategoryNav from '@/components/CategoryNav';
import CategoryPage from '@/components/CategoryPage';
import Footer from '@/components/Footer';
import { getPropertiesPaginated } from '@/lib/supabase/queries';
import { ITEMS_PER_PAGE } from '@/lib/types';
import type { Property } from '@/data/properties';

/**
 * New Buildings Category Page with Server-Side Pagination
 *
 * ISR: Revalidates every 5 minutes
 */
export const revalidate = 300;

export default async function NewBuildingsPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string; minPrice?: string; maxPrice?: string; bedrooms?: string; search?: string; sortBy?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const subCategory = searchParams.type as 'apartment' | 'house' | 'commerce' | undefined;
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined;
  const minBedrooms = searchParams.bedrooms ? parseInt(searchParams.bedrooms) : undefined;
  const search = searchParams.search || undefined;
  const sortBy = (searchParams.sortBy || 'date-desc') as 'price-asc' | 'price-desc' | 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc';

  let result = {
    data: [] as Property[],
    pagination: {
      page: 1,
      pageSize: ITEMS_PER_PAGE,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  try {
    result = await getPropertiesPaginated({
      page,
      pageSize: ITEMS_PER_PAGE,
      filters: {
        listingType: 'new-building',
        subCategory,
        minPrice,
        maxPrice,
        minBedrooms,
        search,
      },
      sortBy,
    });
  } catch (error) {
    console.error('Error loading properties:', error);
    // Fallback to empty array
    result.data = [];
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
          title="Obra nueva"
          properties={result.data}
          categoryType="new-building"
          pagination={result.pagination}
        />
      </Suspense>
      <Footer />
    </main>
  );
}
