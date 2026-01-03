/**
 * Server-Side Supabase Property Queries with Cache Configuration
 *
 * These functions run on the server and use Next.js caching.
 * Data is cached and revalidated daily by default.
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/data/properties';

// Cache duration: 24 hours (86400 seconds)
const CACHE_REVALIDATE = 86400;

/**
 * Get all available properties from Supabase (Server-Side with Cache)
 */
export const getProperties = unstable_cache(
  async (): Promise<Property[]> => {
    const supabase = await createClient();

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
  },
  ['properties-all'],
  {
    revalidate: CACHE_REVALIDATE,
    tags: ['properties', 'properties-all'],
  }
);

/**
 * Get a single property by ID (Server-Side with Cache)
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  const supabase = await createClient();

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
 * Get properties by type (Server-Side with Cache)
 */
export function getPropertiesByType(type: 'house' | 'apartment' | 'investment' | 'plot') {
  return unstable_cache(
    async (): Promise<Property[]> => {
      const supabase = await createClient();

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
    },
    [`properties-type-${type}`],
    {
      revalidate: CACHE_REVALIDATE,
      tags: ['properties', `properties-type-${type}`],
    }
  )();
}

/**
 * Get hot properties (top 10 most viewed) (Server-Side with Cache)
 */
export const getHotProperties = unstable_cache(
  async (): Promise<Property[]> => {
    const supabase = await createClient();

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
  },
  ['properties-hot'],
  {
    revalidate: CACHE_REVALIDATE,
    tags: ['properties', 'properties-hot'],
  }
);

/**
 * Get new properties (less than 2 weeks old) (Server-Side with Cache)
 */
export const getNewProperties = unstable_cache(
  async (): Promise<Property[]> => {
    const supabase = await createClient();

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
  },
  ['properties-new'],
  {
    revalidate: CACHE_REVALIDATE,
    tags: ['properties', 'properties-new'],
  }
);

/**
 * Get most liked properties (top 10 most saved) (Server-Side with Cache)
 */
export const getMostLikedProperties = unstable_cache(
  async (): Promise<Property[]> => {
    const supabase = await createClient();

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
  },
  ['properties-most-liked'],
  {
    revalidate: CACHE_REVALIDATE,
    tags: ['properties', 'properties-most-liked'],
  }
);

/**
 * Search properties by price range (Server-Side with Cache)
 */
export function searchPropertiesByPrice(minPrice: number, maxPrice: number) {
  return unstable_cache(
    async (): Promise<Property[]> => {
      const supabase = await createClient();

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
    },
    [`properties-price-${minPrice}-${maxPrice}`],
    {
      revalidate: CACHE_REVALIDATE,
      tags: ['properties', 'properties-search'],
    }
  )();
}

/**
 * Get property badges (hot, new, most-liked) (Server-Side with Cache)
 */
export const getPropertyBadges = unstable_cache(
  async (): Promise<Record<string, string>> => {
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
  },
  ['property-badges'],
  {
    revalidate: CACHE_REVALIDATE,
    tags: ['properties', 'property-badges'],
  }
);
