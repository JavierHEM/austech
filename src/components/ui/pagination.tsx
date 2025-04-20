'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // No renderizar paginación si solo hay una página
  if (totalPages <= 1) {
    return null;
  }

  // Función para obtener el rango de páginas a mostrar
  const getPageRange = () => {
    const range: (number | string)[] = [];
    
    // Siempre mostrar la primera página
    range.push(1);
    
    // Lógica para mostrar páginas intermedias
    if (currentPage > 3) {
      range.push('...');
    }
    
    // Páginas alrededor de la página actual
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }
    
    if (currentPage < totalPages - 2) {
      range.push('...');
    }
    
    // Siempre mostrar la última página si hay más de una
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range;
  };

  const pageRange = getPageRange();

  return (
    <div className="flex justify-center items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageRange.map((page, index) => {
        if (page === '...') {
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              size="icon"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        
        const pageNumber = page as number;
        
        return (
          <Button
            key={pageNumber}
            variant={currentPage === pageNumber ? 'default' : 'outline'}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}