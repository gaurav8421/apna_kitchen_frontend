import { useQuery, useQueries } from '@tanstack/react-query'
import client from './client'

export function useDailySummary(date) {
  return useQuery({
    queryKey: ['daily-summary', date],
    queryFn: () =>
      client.get('/reports/daily-summary/', { params: { date } }).then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

export function useWeeklyTrend() {
  const today = new Date()
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: ['daily-summary', date],
      queryFn: () =>
        client.get('/reports/daily-summary/', { params: { date } }).then((r) => r.data),
      staleTime: 60_000,
    })),
  })

  return dates.map((date, i) => ({
    date,
    label: new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    sales: Number(results[i].data?.total_sales) || 0,
    expenses: Number(results[i].data?.total_expenses) || 0,
    orders: results[i].data?.order_count ?? 0,
    isLoading: results[i].isLoading,
  }))
}
