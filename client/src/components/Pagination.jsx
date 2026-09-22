import React from 'react';

export default function Pagination({ page, totalPages, total, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <span className="pg-info">
        {total} customer · Halaman {page} / {totalPages}
      </span>
      <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ‹ Sebelum
      </button>
      <button
        className="btn btn-outline btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Seterusnya ›
      </button>
    </div>
  );
}
