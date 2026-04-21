import { useDailySummary } from '../../api/reports'

function fmtMoney(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  return `₹${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, isLoading, isError, refetch } = useDailySummary(today)

  const cards = [
    { label: 'Total Sales',  value: isLoading ? null : fmtMoney(data?.total_sales) },
    { label: 'Orders',       value: isLoading ? null : (data?.order_count != null ? String(data.order_count) : '—') },
    { label: 'Avg Order',    value: isLoading ? null : fmtMoney(data?.avg_order) },
    { label: 'Expenses',     value: isLoading ? null : fmtMoney(data?.total_expenses) },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {isError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
          <span>Could not load summary</span>
          <button
            onClick={() => refetch()}
            className="underline hover:no-underline font-medium"
          >
            Retry
          </button>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Overview</h3>
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
    </div>
  )
}
