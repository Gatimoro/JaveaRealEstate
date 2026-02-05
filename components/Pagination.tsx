'use client';

/**
 * Pagination Component
 *
 * Hybrid pagination with "Load More" button that updates URL parameters.
 * This approach provides:
 * - SEO-friendly URL navigation (good for crawlers)
 * - Smooth user experience (no full page reload)
 * - Shareable URLs with page state
 * - Optimal performance (loads only needed data)
 *
 * Usage:
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   totalCount={240}
 *   hasNextPage={true}
 *   onLoadMore={() => router.push('/search?page=2')}
 *   isLoading={false}
 * />
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  hasNextPage,
  isLoading = false,
  onLoadMore,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
      return;
    }

    // Default behavior: Update URL with next page
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(currentPage + 1));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Calculate current range
  const itemsPerPage = Math.ceil(totalCount / totalPages);
  const currentStart = (currentPage - 1) * itemsPerPage + 1;
  const currentEnd = Math.min(currentPage * itemsPerPage, totalCount);

  if (!hasNextPage && currentPage === 1) {
    // Don't show pagination if there's only one page
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Results counter */}
      <p className="text-sm text-muted-foreground">
        Mostrando {currentStart}-{currentEnd} de {totalCount} propiedades
      </p>

      {/* Load More button */}
      {hasNextPage && (
        <Button
          onClick={handleLoadMore}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              Cargar más propiedades
              <span className="ml-2 text-xs text-muted-foreground">
                (Página {currentPage + 1} de {totalPages})
              </span>
            </>
          )}
        </Button>
      )}

      {/* Page indicator (for SEO and accessibility) */}
      <nav
        aria-label="Paginación"
        className="sr-only"
        role="navigation"
      >
        <span>Página {currentPage} de {totalPages}</span>
      </nav>
    </div>
  );
}

/**
 * Compact Pagination Component (for sidebars or mobile)
 *
 * Shows minimal UI with just the Load More button
 */
export function CompactPagination({
  hasNextPage,
  isLoading = false,
  onLoadMore,
}: Pick<PaginationProps, 'hasNextPage' | 'isLoading' | 'onLoadMore'>) {
  if (!hasNextPage) return null;

  return (
    <div className="flex justify-center py-4">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        size="sm"
        variant="ghost"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Ver más'
        )}
      </Button>
    </div>
  );
}

/**
 * Page Numbers Component (Traditional pagination)
 *
 * Shows clickable page numbers for direct navigation.
 * Use this when you want traditional pagination UX.
 */
export function PageNumbers({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`, { scroll: true });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Show 2 pages on each side of current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Navegación de páginas"
      className="flex items-center justify-center gap-2"
      role="navigation"
    >
      {/* Previous button */}
      <Button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
      >
        Anterior
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }

          const isActive = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              onClick={() => handlePageChange(pageNum as number)}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className="min-w-[40px]"
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      {/* Next button */}
      <Button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
      >
        Siguiente
      </Button>
    </nav>
  );
}
