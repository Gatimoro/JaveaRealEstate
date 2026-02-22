/**
 * Supabase Property Queries
 *
 * Functions to fetch properties from Supabase database
 */

import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/data/properties';

/**
 * Get all available properties (used by client components for recommendations)
 * Note: Supabase JS SDK returns up to 1000 rows by default.
 */
export async function getProperties(): Promise<Property[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }

  return (data || []) as Property[];
}

/**
 * Get a single property by ID (client-side, no translation join)
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }

  return data as Property;
}

/**
 * Get paginated properties with advanced filtering and sorting
 *
 * @param options - Pagination, filtering, and sorting options
 * @returns Paginated result with properties and metadata
 *
 * @example
 * const result = await getPropertiesPaginated({
 *   page: 1,
 *   pageSize: 24,
 *   filters: { listingType: 'sale', minPrice: 200000 },
 *   sortBy: 'price-asc'
 * });
 */
export async function getPropertiesPaginated(options: {
  page?: number;
  pageSize?: number;
  filters?: {
    listingType?: 'sale' | 'rent' | 'new-building';
    subCategory?: 'apartment' | 'house' | 'commerce' | 'plot';
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    location?: string;
    region?: string;
    province?: string;
    municipality?: string;
    search?: string;
  };
  sortBy?: 'price-asc' | 'price-desc' | 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc';
} = {}): Promise<{
  data: Property[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  const supabase = createClient();

  const page = options.page || 1;
  const pageSize = options.pageSize || 24;
  const filters = options.filters || {};
  const sortBy = options.sortBy || 'date-desc';

  // Build query
  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('status', 'available');

  // Apply filters
  if (filters.listingType) {
    query = query.eq('listing_type', filters.listingType);
  }

  if (filters.subCategory) {
    query = query.eq('sub_category', filters.subCategory);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.minBedrooms !== undefined) {
    // DB stores bedrooms as JSON string "3" — use text extraction (->>) for numeric string comparison
    query = query.gte('specs->>bedrooms', String(filters.minBedrooms));
  }

  if (filters.maxBedrooms !== undefined) {
    query = query.lte('specs->>bedrooms', String(filters.maxBedrooms));
  }

  if (filters.minBathrooms !== undefined) {
    query = query.gte('specs->>bathrooms', String(filters.minBathrooms));
  }

  // Note: minSize/maxSize filters removed — DB stores area as "146.6 m2" string,
  // making numeric comparisons impossible without a DB migration.

  if (filters.region) {
    query = query.eq('region', filters.region);
  }

  if (filters.province) {
    query = query.eq('province', filters.province);
  }

  if (filters.municipality) {
    query = query.eq('municipality', filters.municipality);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters.search) {
    // Full-text search across title and description
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
    );
  }

  // Apply sorting
  switch (sortBy) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'date-asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'date-desc':
      query = query.order('created_at', { ascending: false });
      break;
    case 'size-desc':
      query = query.order('specs->size', { ascending: false });
      break;
    case 'size-asc':
      query = query.order('specs->size', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching paginated properties:', error);
    throw error;
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: (data || []) as Property[],
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
