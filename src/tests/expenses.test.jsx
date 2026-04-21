import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useCreateExpenseCategory,
} from '../api/expenses'

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import client from '../api/client'

let queryClient

function wrapper({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const mockExpense = {
  id: 'exp-1',
  amount: '1200.00',
  description: 'Monthly gas',
  vendor_name: 'Bharat Gas',
  expense_date: '2026-04-21',
  category: { id: 'cat-1', name: 'Utilities' },
  created_at: '2026-04-21T10:30:00Z',
}

const mockCategory = { id: 'cat-1', name: 'Utilities' }

describe('useExpenses', () => {
  beforeEach(() => {
    vi.mocked(client.get).mockClear()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  })

  it('fetches /expenses/ with no params by default', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [mockExpense] })
    const { result } = renderHook(() => useExpenses({}), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/expenses/', { params: {} })
    expect(result.current.data).toHaveLength(1)
  })

  it('passes category/from/to filters', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(
      () => useExpenses({ category: 'cat-1', from: '2026-04-01', to: '2026-04-21' }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/expenses/', {
      params: { category: 'cat-1', from: '2026-04-01', to: '2026-04-21' },
    })
  })

  it('returns isError on failure', async () => {
    vi.mocked(client.get).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useExpenses({}), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateExpense', () => {
  beforeEach(() => { vi.mocked(client.post).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('posts to /expenses/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockExpense })
    const { result } = renderHook(() => useCreateExpense(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ amount: '1200.00', category: 'cat-1', expense_date: '2026-04-21' })
    })
    expect(client.post).toHaveBeenCalledWith('/expenses/', expect.any(Object))
  })
})

describe('useUpdateExpense', () => {
  beforeEach(() => { vi.mocked(client.patch).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('patches /expenses/:id/', async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: mockExpense })
    const { result } = renderHook(() => useUpdateExpense(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 'exp-1', amount: '1500.00' })
    })
    expect(client.patch).toHaveBeenCalledWith('/expenses/exp-1/', { amount: '1500.00' })
  })
})

describe('useDeleteExpense', () => {
  beforeEach(() => { vi.mocked(client.delete).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('deletes /expenses/:id/', async () => {
    vi.mocked(client.delete).mockResolvedValue({})
    const { result } = renderHook(() => useDeleteExpense(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('exp-1')
    })
    expect(client.delete).toHaveBeenCalledWith('/expenses/exp-1/')
  })
})

describe('useExpenseCategories', () => {
  beforeEach(() => {
    vi.mocked(client.get).mockClear()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  })

  it('fetches /expenses/categories/', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [mockCategory] })
    const { result } = renderHook(() => useExpenseCategories(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/expenses/categories/')
  })
})

describe('useCreateExpenseCategory', () => {
  beforeEach(() => { vi.mocked(client.post).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('posts to /expenses/categories/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockCategory })
    const { result } = renderHook(() => useCreateExpenseCategory(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Utilities' })
    })
    expect(client.post).toHaveBeenCalledWith('/expenses/categories/', { name: 'Utilities' })
  })
})
