import React, { useEffect } from 'react';
import './Pagination.scss';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage = 5,
  totalItems = 0,
  showInfo = true 
}) => {
  // Autoajuste: si la página actual supera las páginas totales, retrocede a la última válida
  useEffect(() => {
    const targetPage = totalPages === 0 ? 1 : totalPages;
    if (currentPage > targetPage) {
      onPageChange(targetPage);
    }
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
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

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-container">
      {showInfo && (
        <div className="pagination-info">
          <span>
            Mostrando {startItem} - {endItem} de {totalItems} registros
          </span>
        </div>
      )}
      
      <div className="pagination-controls">
        {/* Primera página */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="pagination-btn pagination-btn-first"
          title="Primera página"
        >
          ⟪
        </button>

        {/* Página anterior */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn pagination-btn-prev"
          title="Página anterior"
        >
          ⟨
        </button>

        {/* Números de página */}
        <div className="pagination-numbers">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={page === '...' ? `dots-${index}` : `page-${page}`}>
              {page === '...' ? (
                <span className="pagination-dots">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page)}
                  className={`pagination-btn pagination-btn-number ${
                    currentPage === page ? 'active' : ''
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Página siguiente */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn pagination-btn-next"
          title="Página siguiente"
        >
          ⟩
        </button>

        {/* Última página */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="pagination-btn pagination-btn-last"
          title="Última página"
        >
          ⟫
        </button>
      </div>
    </div>
  );
};

export default Pagination;