/**
 * Server-Side Supabase Property Queries - NO CACHING
 *
 * Fetches fresh data from Supabase on every request.
 * Simple, reliable, and always up-to-date.
 */

import type { Property } from '@/data/properties';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Fetch from Supabase REST API - NO CACHING
 */
async function supabaseFetch<T>(
  table: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: 'no-store', // ALWAYS fetch fresh data
  });

  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all available properties - ALWAYS FRESH
 */
export async function getProperties(): Promise<Property[]> {
  try {
    const data = await supabaseFetch<Property>('properties', {
      status: 'eq.available',
      order: 'created_at.desc',
      select: '*',
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

/**
 * Get a single property by ID - ALWAYS FRESH
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const data = await supabaseFetch<Property>('properties', {
      id: `eq.${id}`,
      select: '*',
    });
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

/**
 * Get properties by type - ALWAYS FRESH
 */
export async function getPropertiesByType(
  type: 'house' | 'apartment' | 'investment' | 'plot'
): Promise<Property[]> {
  try {
    const data = await supabaseFetch<Property>('properties', {
      type: `eq.${type}`,
      status: 'eq.available',
      order: 'created_at.desc',
      select: '*',
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching properties by type:', error);
    throw error;
  }
}

/**
 * Get hot properties (top 10 most viewed) - ALWAYS FRESH
 */
export async function getHotProperties(): Promise<Property[]> {
  try {
    const data = await supabaseFetch<Property>('properties', {
      status: 'eq.available',
      order: 'views_count.desc',
      limit: '10',
      select: '*',
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching hot properties:', error);
    throw error;
  }
}

/**
 * Get new properties (less than 2 weeks old) - ALWAYS FRESH
 */
export async function getNewProperties(): Promise<Property[]> {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const data = await supabaseFetch<Property>('properties', {
      status: 'eq.available',
      created_at: `gt.${twoWeeksAgo.toISOString()}`,
      order: 'created_at.desc',
      select: '*',
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching new properties:', error);
    throw error;
  }
}

/**
 * Get most liked properties (top 10 most saved) - ALWAYS FRESH
 */
export async function getMostLikedProperties(): Promise<Property[]> {
  try {
    const data = await supabaseFetch<Property>('properties', {
      status: 'eq.available',
      order: 'saves_count.desc',
      limit: '10',
      select: '*',
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching most liked properties:', error);
    throw error;
  }
}

/**
 * Search properties by price range - ALWAYS FRESH
 */
export async function searchPropertiesByPrice(
  minPrice: number,
  maxPrice: number
): Promise<Property[]> {
  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/properties`);
    url.searchParams.append('status', 'eq.available');
    url.searchParams.append('price', `gte.${minPrice}`);
    url.searchParams.append('price', `lte.${maxPrice}`);
    url.searchParams.append('order', 'price.asc');
    url.searchParams.append('select', '*');

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store', // ALWAYS fresh
    });

    if (!response.ok) {
      throw new Error(`Supabase fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error searching properties by price:', error);
    throw error;
  }
}

/**
 * Get property badges (hot, new, most-liked) - ALWAYS FRESH
 */
export async function getPropertyBadges(): Promise<Record<string, string>> {
  const badges: Record<string, string> = {};

  try {
    const [hotProps, newProps, likedProps] = await Promise.all([
      getHotProperties(),
      getNewProperties(),
      getMostLikedProperties(),
    ]);

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
