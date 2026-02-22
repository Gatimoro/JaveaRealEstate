import { Suspense } from 'react';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import SearchContent from '@/components/SearchContent';
import { getPropertiesPaginated } from '@/lib/supabase/queries';
import { ITEMS_PER_PAGE } from '@/lib/types';
import type { Property } from '@/data/properties';

/**
 * Search Page — server-side filtering via URL params.
 * Dynamic (not cached) since every search query is unique.
 */
export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    page?: string;
    sortBy?: string;
  };
}) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.q || undefined;
  const subCategory = searchParams.type as 'apartment' | 'house' | 'commerce' | 'plot' | undefined;
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined;
  const minBedrooms = searchParams.bedrooms ? parseInt(searchParams.bedrooms) : undefined;
  const sortBy = (searchParams.sortBy || 'date-desc') as 'price-asc' | 'price-desc' | 'date-desc' | 'date-asc';

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
        search,
        subCategory,
        minPrice,
        maxPrice,
        minBedrooms,
      },
      sortBy,
    });
  } catch (error) {
    console.error('Error loading search results:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      <CategoryNav />
      <Suspense fallback={
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando propiedades...</p>
        </div>
      }>
        <SearchContent properties={result.data} pagination={result.pagination} />
      </Suspense>
      <Footer />
    </div>
  );
}
