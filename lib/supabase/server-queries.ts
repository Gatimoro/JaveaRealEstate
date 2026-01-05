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
 * Get trending properties (most viewed in last 7 days) - ALWAYS FRESH
 * Uses property_analytics_events table for time-windowed analytics
 */
export async function getTrendingProperties(): Promise<Property[]> {
  try {
    // Call the database function for trending properties
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/get_trending_properties`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        days_back: 7,
        limit_count: 10
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      // Fallback to legacy hot properties if events table doesn't exist
      return getHotProperties();
    }

    const data = await response.json();

    // Map function results to property IDs
    const propertyIds = data.map((d: any) => d.property_id);

    // Fetch full property details
    if (propertyIds.length === 0) return [];

    const properties = await supabaseFetch<Property>('properties', {
      id: `in.(${propertyIds.join(',')})`,
      select: '*',
    });

    return properties || [];
  } catch (error) {
    console.error('Error fetching trending properties:', error);
    // Fallback to legacy hot properties
    return getHotProperties();
  }
}

/**
 * Get recently saved properties (most saved in last 7 days) - ALWAYS FRESH
 * Uses property_analytics_events table for time-windowed analytics
 */
export async function getRecentlySavedProperties(): Promise<Property[]> {
  try {
    // Call the database function for recently saved properties
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/get_recently_saved_properties`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        days_back: 7,
        limit_count: 10
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      // Fallback to legacy most liked if events table doesn't exist
      return getMostLikedProperties();
    }

    const data = await response.json();

    // Map function results to property IDs
    const propertyIds = data.map((d: any) => d.property_id);

    // Fetch full property details
    if (propertyIds.length === 0) return [];

    const properties = await supabaseFetch<Property>('properties', {
      id: `in.(${propertyIds.join(',')})`,
      select: '*',
    });

    return properties || [];
  } catch (error) {
    console.error('Error fetching recently saved properties:', error);
    // Fallback to legacy most liked
    return getMostLikedProperties();
  }
}

/**
 * Get recently updated properties (modified in last 3 days) - ALWAYS FRESH
 */
export async function getUpdatedProperties(): Promise<Property[]> {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const data = await supabaseFetch<Property>('properties', {
      status: 'eq.available',
      updated_at: `gt.${threeDaysAgo.toISOString()}`,
      order: 'updated_at.desc',
      select: '*',
    });

    // Filter out brand new properties (only show updated existing ones)
    const oneDayAfterCreation = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const updatedOnly = data.filter(p => {
      const created = new Date(p.created_at as string).getTime();
      const updated = new Date(p.updated_at as string).getTime();
      return (updated - created) > oneDayAfterCreation;
    });

    return updatedOnly || [];
  } catch (error) {
    console.error('Error fetching updated properties:', error);
    return [];
  }
}

/**
 * Get property badges with enhanced time-based logic - ALWAYS FRESH
 *
 * Badge Priority (first match wins):
 * 1. TRENDING - Top 10 by views in last 7 days (currently popular)
 * 2. NEW - Listed < 14 days ago (fresh listings)
 * 3. RECENTLY-SAVED - Top 10 by saves in last 7 days (currently desired)
 * 4. UPDATED - Modified within last 3 days (recent changes)
 * 5. STATIC - Fallback to database badge field
 *
 * This ensures one badge per property with preference for recent activity
 */
export async function getPropertyBadges(): Promise<Record<string, string>> {
  const badges: Record<string, string> = {};

  try {
    const [trendingProps, newProps, recentlySavedProps, updatedProps] = await Promise.all([
      getTrendingProperties(),
      getNewProperties(),
      getRecentlySavedProperties(),
      getUpdatedProperties(),
    ]);

    // Priority 1: TRENDING (most important - shows what's hot NOW)
    trendingProps.forEach(p => {
      badges[p.id] = 'trending';
    });

    // Priority 2: NEW (second - fresh listings)
    newProps.forEach(p => {
      if (!badges[p.id]) {
        badges[p.id] = 'new';
      }
    });

    // Priority 3: RECENTLY-SAVED (third - current user interest)
    recentlySavedProps.forEach(p => {
      if (!badges[p.id]) {
        badges[p.id] = 'recently-saved';
      }
    });

    // Priority 4: UPDATED (fourth - recent changes)
    updatedProps.forEach(p => {
      if (!badges[p.id]) {
        badges[p.id] = 'updated';
      }
    });

    return badges;
  } catch (error) {
    console.error('Error getting property badges:', error);
    return {};
  }
}
