/**
 * Supabase Property Queries
 *
 * Functions to fetch properties from Supabase database
 */

import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/data/properties';

/**
 * Get all available properties from Supabase
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
 * Get a single property by ID
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
 * Get properties by type
 */
export async function getPropertiesByType(type: 'house' | 'apartment' | 'investment' | 'plot'): Promise<Property[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('type', type)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties by type:', error);
    throw error;
  }

  return (data || []) as Property[];
}

/**
 * Get hot properties (top 10 most viewed)
 */
export async function getHotProperties(): Promise<Property[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .order('views_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching hot properties:', error);
    throw error;
  }

  return (data || []) as Property[];
}

/**
 * Get new properties (less than 2 weeks old)
 */
export async function getNewProperties(): Promise<Property[]> {
  const supabase = createClient();

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .gt('created_at', twoWeeksAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching new properties:', error);
    throw error;
  }

  return (data || []) as Property[];
}

/**
 * Get most liked properties (top 10 most saved)
 */
export async function getMostLikedProperties(): Promise<Property[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .order('saves_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching most liked properties:', error);
    throw error;
  }

  return (data || []) as Property[];
}

/**
 * Search properties by price range
 */
export async function searchPropertiesByPrice(
  minPrice: number,
  maxPrice: number
): Promise<Property[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .gte('price', minPrice)
    .lte('price', maxPrice)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error searching properties by price:', error);
    throw error;
  }

  return (data || []) as Property[];
}

/**
 * Get property badges (hot, new, most-liked)
 */
export async function getPropertyBadges(): Promise<Record<string, string>> {
  const badges: Record<string, string> = {};

  try {
    // Get all three categories in parallel
    const [hotProps, newProps, likedProps] = await Promise.all([
      getHotProperties(),
      getNewProperties(),
      getMostLikedProperties(),
    ]);

    // Priority: hot > new > most-liked
    hotProps.forEach(p => {
      badges[p.id] = 'hot';
    });

    newProps.forEach(p => {
      if (!badges[p.id]) {
        badges[p.id] = 'new';
      }
    });

    likedProps.forEach(p => {
      if (!badges[p.id]) {
        badges[p.id] = 'most-liked';
      }
    });

    return badges;
  } catch (error) {
    console.error('Error getting property badges:', error);
    return {};
  }
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
    minSize?: number;
    maxSize?: number;
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
    query = query.gte('specs->bedrooms', filters.minBedrooms);
  }

  if (filters.maxBedrooms !== undefined) {
    query = query.lte('specs->bedrooms', filters.maxBedrooms);
  }

  if (filters.minBathrooms !== undefined) {
    query = query.gte('specs->bathrooms', filters.minBathrooms);
  }

  if (filters.minSize !== undefined) {
    query = query.gte('specs->size', filters.minSize);
  }

  if (filters.maxSize !== undefined) {
    query = query.lte('specs->size', filters.maxSize);
  }

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
