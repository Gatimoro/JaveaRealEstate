/**
 * Shared Type Definitions
 *
 * Central location for reusable types across the application.
 */

import type { Property } from '@/data/properties';

/**
 * Pagination Constants
 */
export const ITEMS_PER_PAGE = 24; // Divisible by 2, 3, and 4 for grid layouts
export const INITIAL_LOAD_COUNT = 12; // Load fewer items initially for faster First Contentful Paint

/**
 * Property Filter Options
 */
export interface PropertyFilters {
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
}

/**
 * Pagination Result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Sort Options
 */
export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'date-desc'
  | 'date-asc'
  | 'size-desc'
  | 'size-asc';

/**
 * Property Card Type (Minimal data for list views)
 * ~500 bytes vs 5KB for full Property
 */
export interface PropertyCard {
  id: string;
  title: string;
  price: number;
  location: string;
  images: string[]; // Only first image needed for card
  badge?: string;
  listing_type?: 'sale' | 'rent' | 'new-building';
  sub_category?: 'apartment' | 'house' | 'commerce' | 'plot';
  specs: {
    bedrooms?: number;
    bathrooms?: number;
    size: number;
  };
  region?: string;
  province?: string;
  municipality?: string;
}

/**
 * Convert full Property to PropertyCard
 */
export function toPropertyCard(property: Property): PropertyCard {
  return {
    id: property.id,
    title: property.title,
    price: property.price,
    location: property.location,
    images: property.images.slice(0, 1), // Only first image for cards
    badge: property.badge,
    listing_type: property.listing_type,
    sub_category: property.sub_category,
    specs: property.specs,
    region: property.region,
    province: property.province,
    municipality: property.municipality,
  };
}
