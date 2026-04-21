import { useQuery } from '@tanstack/react-query'
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
