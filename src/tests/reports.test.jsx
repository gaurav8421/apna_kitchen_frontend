import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDailySummary } from '../api/reports'

vi.mock('../api/client', () => ({
  default: { get: vi.fn() },
}))

import client from '../api/client'

let queryClient

function wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockSummary = {
  total_sales: '4820.00',
  order_count: 23,
  avg_order: '209.57',
  total_expenses: '1200.00',
}

describe('useDailySummary', () => {
  beforeEach(() => {
    vi.mocked(client.get).mockClear()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })
  afterEach(() => queryClient.clear())

  it('calls /reports/daily-summary/ with correct date param', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: mockSummary })
    const { result } = renderHook(() => useDailySummary('2026-04-21'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/reports/daily-summary/', {
      params: { date: '2026-04-21' },
    })
  })

  it('returns summary data on success', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: mockSummary })
    const { result } = renderHook(() => useDailySummary('2026-04-21'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.order_count).toBe(23)
    expect(result.current.data.total_sales).toBe('4820.00')
  })

  it('returns isError=true on fetch failure', async () => {
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useDailySummary('2026-04-21'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
