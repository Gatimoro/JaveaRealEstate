/**
 * Shared Type Definitions
 *
 * Central location for reusable types across the application.
 */

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

