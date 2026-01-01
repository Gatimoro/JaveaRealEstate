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
export async function getPropertiesByType(type: 'house' | 'investment' | 'plot'): Promise<Property[]> {
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
