/**
 * Shared Utility Functions
 *
 * Central location for reusable utilities across the application.
 * Consolidates duplicate code and provides consistent formatting.
 */

import type { Locale } from './i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 *
 * @param inputs - Class names to merge
 * @returns Merged class names
 *
 * @example
 * cn('px-4 py-2', 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price as currency with proper locale formatting
 *
 * @param price - The price in euros (numeric)
 * @param locale - The user's language (es, en, ru)
 * @returns Formatted price string (e.g., "350.000 €" in ES, "€350,000" in EN)
 *
 * @example
 * formatPrice(350000, 'es') // "350.000 €"
 * formatPrice(350000, 'en') // "€350,000"
 * formatPrice(1250000, 'ru') // "1 250 000 €"
 */
export function formatPrice(price: number, locale: Locale = 'es'): string {
  return new Intl.NumberFormat(
    locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'es-ES',
    {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(price);
}

/**
 * Calculate price per square meter
 *
 * @param price - Total property price
 * @param size - Size in square meters
 * @returns Price per m² or null if size is missing
 *
 * @example
 * getPricePerSqm(350000, 100) // 3500
 * getPricePerSqm(350000, 0) // null
 */
export function getPricePerSqm(price: number, size?: number): number | null {
  if (!size || size === 0) return null;
  return Math.round(price / size);
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated text with "..." if needed
 *
 * @example
 * truncate("Beautiful villa with sea views", 20) // "Beautiful villa w..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Format large numbers with K/M suffix
 *
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2M", "350K")
 *
 * @example
 * formatNumber(1250000) // "1.25M"
 * formatNumber(350000) // "350K"
 * formatNumber(5000) // "5K"
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
}

/**
 * Debounce function to limit API calls during user input
 *
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => fetchResults(query), 300);
 * // Called on every keystroke, but only executes 300ms after user stops typing
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a URL-friendly slug from a property title
 *
 * @param text - Text to slugify
 * @returns URL-safe slug
 *
 * @example
 * slugify("Villa moderna en Jávea") // "villa-moderna-en-javea"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

/**
 * Parse query parameters for property filtering
 *
 * @param searchParams - URLSearchParams object
 * @returns Parsed filter object
 *
 * @example
 * parseFilters(new URLSearchParams("?minPrice=200000&bedrooms=3"))
 * // { minPrice: 200000, bedrooms: 3 }
 */
export function parseFilters(searchParams: URLSearchParams) {
  return {
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    minBedrooms: searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!) : undefined,
    subCategory: searchParams.get('type') as 'apartment' | 'house' | 'commerce' | 'plot' | undefined,
    search: searchParams.get('q') || undefined,
  };
}
