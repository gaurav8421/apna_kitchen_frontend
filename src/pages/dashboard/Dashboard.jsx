import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, ShoppingBag, Receipt, Wallet } from 'lucide-react'
import { useDailySummary, useWeeklyTrend } from '../../api/reports'
import useAuthStore from '../../store/authStore'

function fmtMoney(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  return `₹${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function KpiCard({ icon: Icon, label, value, isLoading, accent }) {
  return (
    <div className={`bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4`}>
      <div className={`p-2.5 rounded-lg ${accent}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        {isLoading ? (
          <div className="animate-pulse h-7 w-24 bg-gray-200 rounded" />
        ) : (
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const today = new Date().toISOString().slice(0, 10)
  const { data, isLoading, isError, refetch } = useDailySummary(today)
  const weeklyTrend = useWeeklyTrend()

  const net = (Number(data?.total_sales) || 0) - (Number(data?.total_expenses) || 0)

  const kpis = [
    {
      icon: TrendingUp,
      label: 'Total Sales',
      value: fmtMoney(data?.total_sales),
      accent: 'bg-indigo-500',
    },
    {
      icon: ShoppingBag,
      label: 'Orders',
      value: data?.order_count != null ? String(data.order_count) : '—',
      accent: 'bg-violet-500',
    },
    {
      icon: Receipt,
      label: 'Avg Order',
      value: fmtMoney(data?.avg_order),
      accent: 'bg-sky-500',
    },
    {
      icon: Wallet,
      label: 'Net Profit',
      value: isLoading ? null : fmtMoney(net),
      accent: net >= 0 ? 'bg-emerald-500' : 'bg-red-500',
    },
  ]

  const chartLoading = weeklyTrend.some((d) => d.isLoading)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span>Could not load summary ·</span>
          <button onClick={() => refetch()} className="underline hover:no-underline font-medium">
            Retry
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ icon, label, value, accent }) => (
          <KpiCard
            key={label}
            icon={icon}
            label={label}
            value={value}
            isLoading={isLoading}
            accent={accent}
          />
        ))}
      </div>

      {/* 7-day chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Last 7 Days</h2>
        {chartLoading ? (
          <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyTrend} barSize={14} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Bar dataKey="sales" name="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
