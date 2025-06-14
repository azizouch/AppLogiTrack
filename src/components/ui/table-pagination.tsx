import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { Button } from './button';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export function TablePagination(props: TablePaginationProps) {
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onPageChange,
    loading = false,
    totalItems,
    itemsPerPage
  } = props;
  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

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
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * (itemsPerPage || 10) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0);

  return (
    <div className="flex items-center justify-between py-4 px-2">
      {/* Left: Items info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {totalItems && itemsPerPage ? (
          `Affichage de ${startItem} à ${endItem} sur ${totalItems} résultats`
        ) : (
          ''
        )}
      </div>

      {/* Center: Pagination controls */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || loading}
          className="h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
            ) : (
              <Button
                key={`page-${page}`}
                variant={page === currentPage ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                disabled={loading}
                className={
                  page === currentPage
                    ? "h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white border-0"
                    : "h-9 w-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || loading}
          className="h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Right: Page info with up arrow */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Page {currentPage} sur {totalPages}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          title="Retour en haut"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
