import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

const PAGE_SIZES = [10, 25, 50, 0]

export function usePagination(total, defaultPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const allRows = pageSize === 0
  const totalPages = allRows ? 1 : Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = allRows ? 0 : (safePage - 1) * pageSize
  const end = allRows ? total : Math.min(start + pageSize, total)

  function changePageSize(size) {
    setPageSize(size)
    setPage(1)
  }

  return { page: safePage, pageSize, totalPages, start, end, setPage, changePageSize }
}

import { useState } from 'react'

export default function TableFooter({ total, page, pageSize, totalPages, start, end, setPage, changePageSize, onExport }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => changePageSize(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s === 0 ? 'All' : s}</option>
          ))}
        </select>
        <span className="text-gray-400">
          {total === 0 ? '0 rows' : `${start + 1}–${end} of ${total}`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(1)}
          disabled={page <= 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="First page"
        >
          <ChevronLeft size={14} className="inline" />
          <ChevronLeft size={14} className="inline -ml-2" />
        </button>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 text-gray-600 font-medium text-xs">
          {totalPages === 1 ? `Page 1` : `${page} / ${totalPages}`}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Last page"
        >
          <ChevronRight size={14} className="inline" />
          <ChevronRight size={14} className="inline -ml-2" />
        </button>
      </div>

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-xs font-medium transition"
      >
        <Download size={13} />
        Export CSV
      </button>
    </div>
  )
}
