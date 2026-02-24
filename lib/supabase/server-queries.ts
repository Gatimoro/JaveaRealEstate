/**
 * Server-Side Supabase Property Queries
 *
 * PERFORMANCE ARCHITECTURE:
 * - Uses Next.js ISR (Incremental Static Regeneration) for optimal performance
 * - Pages cache results and revalidate periodically
 * - Individual queries can opt into fresh data with cache: 'no-store'
 *
 * CACHING STRATEGY:
 * - Homepage: Cached for 5 minutes (revalidate: 300) — shuffles featured cards on each rebuild
 * - Category pages: Cached for 5 minutes (revalidate: 300) — balance freshness/performance
 * - Search results: No cache — always fresh for user queries
 *
 * DATA MINIMIZATION:
 * - PropertyCard type: Only fields visible on cards (saves 80-90% bandwidth)
 * - Full Property type: All fields for detail pages
 *
 * FEATURED CARDS SHUFFLE:
 * - getFeaturedPropertiesForCards fetches limit×5 rows, shuffles with Fisher-Yates,
 *   computes badges (new / most_saved / most_viewed), and returns the first `limit`.
 * - Different set is shown on each ISR rebuild (every 5 minutes).
 */

import type { Property } from '@/data/properties';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Minimal property data for displaying cards
 *
 * Only includes fields visible on property cards to minimize data transfer.
 * Used on homepage and category listing pages.
 *
 * Size comparison:
 * - Full Property: ~5KB per property
 * - PropertyCard: ~500 bytes per property (10x reduction)
 */
export type PropertyCard = {
  id: string;
  title: string;              // Spanish by default (other languages loaded client-side)
  price: number;
  location: string;
  images: string[];           // All images included (first used for card, rest for detail page)
  badge?: string;
  specs: {
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
  };
  listing_type?: 'sale' | 'rent' | 'new-building';
  sub_category?: 'apartment' | 'house' | 'commerce' | 'plot';
  rent_period?: 'week' | 'month';
  region?: string;
  province?: string;
  municipality?: string;
  // Internal fields used for badge computation (stripped before returning from getFeaturedPropertiesForCards)
  views_count?: number;
  saves_count?: number;
  created_at?: string;
};

/**
 * Internal: Fetch a count from Supabase REST API using Prefer: count=exact.
 * Returns the total number of matching rows without fetching row data.
 */
async function supabaseFetchCount(
  table: string,
  params: Record<string, string> = {},
  options: RequestInit = {}
): Promise<number> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  // limit=0 fetches no rows — we only need the Content-Range header
  url.searchParams.append('select', 'id');
  url.searchParams.append('limit', '0');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'count=exact',
    },
    ...options,
  });

  if (!response.ok) return 0;

  // Content-Range: "0-0/456" — total is after the slash
  const contentRange = response.headers.get('content-range');
  const total = contentRange?.split('/')[1];
  return total ? parseInt(total, 10) : 0;
}

/**
 * Get total property counts per listing_type.
 * Lightweight — fetches no rows, only counts via Content-Range header.
 */
export async function getPropertyCounts(options: RequestInit = {}): Promise<{
  sale: number;
  rent: number;
  newBuilding: number;
  total: number;
}> {
  try {
    const [sale, rent, newBuilding] = await Promise.all([
      supabaseFetchCount('properties', { status: 'eq.available', listing_type: 'eq.sale' }, options),
      supabaseFetchCount('properties', { status: 'eq.available', listing_type: 'eq.rent' }, options),
      supabaseFetchCount('properties', { status: 'eq.available', listing_type: 'eq.new-building' }, options),
    ]);
    return { sale, rent, newBuilding, total: sale + rent + newBuilding };
  } catch {
    return { sale: 0, rent: 0, newBuilding: 0, total: 0 };
  }
}

/**
 * Internal: Fetch from Supabase REST API
 *
 * @param table - Table name (usually 'properties')
 * @param params - Query parameters for filtering/sorting
 * @param options - Fetch options (cache strategy, etc.)
 */
async function supabaseFetch<T>(
  table: string,
  params: Record<string, string> = {},
  options: RequestInit = {}
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
    ...options, // Allows override of cache strategy
  });

  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get featured properties for homepage carousels (MINIMAL DATA)
 *
 * Fetches a larger pool (limit * 5), shuffles with Fisher-Yates, computes badges,
 * and returns the first `limit` properties. Different set shown on each ISR rebuild.
 *
 * Badge logic (in priority order):
 * 1. DB badge field (if set by scraper)
 * 2. created_at within 7 days → 'new'
 * 3. Highest saves_count in pool → 'most_saved'
 * 4. Highest views_count in pool → 'most_viewed'
 *
 * @param listing_type - Category: 'sale', 'rent', or 'new-building'
 * @param limit - Number of properties to return (default: 6)
 * @returns Minimal property data for cards (views_count/saves_count/created_at stripped)
 */
export async function getFeaturedPropertiesForCards(
  listing_type: 'sale' | 'rent' | 'new-building',
  limit: number = 6
): Promise<PropertyCard[]> {
  try {
    const poolSize = limit * 5;

    // Fetch larger pool including metadata for badge computation
    const pool = await supabaseFetch<PropertyCard>('properties', {
      select: 'id,title,price,location,region,province,municipality,images,badge,specs,listing_type,sub_category,rent_period,views_count,saves_count,created_at',
      listing_type: `eq.${listing_type}`,
      status: 'eq.available',
      order: 'created_at.desc',
      limit: poolSize.toString(),
    }, {
      next: { tags: ['featured-properties'] }
    });

    if (!pool || pool.length === 0) return [];

    // Fisher-Yates shuffle for randomization per ISR rebuild
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Compute badges on the full pool to find pool-wide maximums
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Find pool-wide top saves/views (one badge each)
    let maxSavesId: string | null = null;
    let maxSaves = -1;
    let maxViewsId: string | null = null;
    let maxViews = -1;

    for (const p of pool) {
      if (!p.badge && (p.saves_count ?? 0) > maxSaves) {
        maxSaves = p.saves_count ?? 0;
        maxSavesId = p.id;
      }
      if (!p.badge && (p.views_count ?? 0) > maxViews) {
        maxViews = p.views_count ?? 0;
        maxViewsId = p.id;
      }
    }

    // Take first `limit` from shuffled pool and assign badges
    const selected = shuffled.slice(0, limit);

    let mostSavedAssigned = false;
    let mostViewedAssigned = false;

    const result = selected.map((p) => {
      let badge = p.badge; // DB badge takes priority

      if (!badge && p.created_at && p.created_at >= sevenDaysAgo) {
        badge = 'new';
      } else if (!badge && !mostSavedAssigned && p.id === maxSavesId && maxSaves > 0) {
        badge = 'most_saved';
        mostSavedAssigned = true;
      } else if (!badge && !mostViewedAssigned && p.id === maxViewsId && maxViews > 0) {
        badge = 'most_viewed';
        mostViewedAssigned = true;
      }

      // Strip internal fields before returning
      const { views_count, saves_count, created_at, ...card } = p;
      const rent_period = card.rent_period ?? (card.listing_type === 'rent' ? 'month' : card.rent_period);
      return { ...card, badge, rent_period };
    });

    return result;
  } catch (error) {
    console.error(`Error fetching featured properties for ${listing_type}:`, error);
    return [];
  }
}

/**
 * Get all available properties (FULL DATA)
 *
 * Returns complete property data. Use sparingly - prefer getFeaturedPropertiesForCards
 * for listing pages to minimize bandwidth.
 *
 * @param useCache - Whether to use Next.js cache (default: true for ISR)
 * @returns Full property data
 */
export async function getProperties(useCache: boolean = true): Promise<Property[]> {
  try {
    const data = await supabaseFetch<Property>('properties', {
      status: 'eq.available',
      order: 'created_at.desc',
      select: '*',
    }, useCache ? {} : { cache: 'no-store' });

    return data || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

/**
 * Get a single property by ID - ALWAYS FRESH
 * Joins the translations table to get localized title/description/features.
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    type PropertyWithTranslations = Property & {
      translations?: Array<{
        locale: string;
        title: string | null;
        description: string | null;
        features: string[] | null;
      }>;
    };

    let data = await supabaseFetch<PropertyWithTranslations>('properties', {
      id: `eq.${id}`,
      select: '*,translations(locale,title,description,features)',
    });

    const property = data[0];
    if (!property) return null;

    // Default rent_period to 'month' for rent listings missing the field
    if (property.listing_type === 'rent' && !property.rent_period) {
      (property as any).rent_period = 'month';
    }

    // Flatten translations array into snake_case fields
    if (property.translations) {
      for (const t of property.translations) {
        if (t.title)       (property as any)[`title_${t.locale}`]       = t.title;
        if (t.description) (property as any)[`description_${t.locale}`] = t.description;
        if (t.features)    (property as any)[`features_${t.locale}`]    = t.features;
      }
      delete (property as any).translations;
    }

    return property as Property;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}
