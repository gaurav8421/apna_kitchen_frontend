import { useState } from 'react'
import { useDailySummary } from '../../api/reports'

function fmtMoney(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  return `₹${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const { data, isLoading, isError, refetch } = useDailySummary(date)

  const cards = [
    { label: 'Total Sales',   value: isLoading ? null : fmtMoney(data?.total_sales) },
    { label: 'Orders',        value: isLoading ? null : (data?.order_count != null ? String(data.order_count) : '—') },
    { label: 'Avg Order',     value: isLoading ? null : fmtMoney(data?.avg_order) },
    { label: 'Expenses',      value: isLoading ? null : fmtMoney(data?.total_expenses) },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {isError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
          <span>Could not load report ·</span>
          <button
            onClick={() => refetch()}
            className="underline hover:no-underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <h2 className="text-sm font-medium text-gray-500 mb-3">
        Daily Summary —{' '}
        {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500">{label}</p>
            {value === null ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            )}
          </div>
        ))}
      </div>

      {!isLoading && !isError && data && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Profit Summary</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Net (Sales − Expenses)</span>
            <span className="font-bold text-gray-900">
              {fmtMoney(
                (Number(data.total_sales) || 0) - (Number(data.total_expenses) || 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
