import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useAddStockTransaction,
} from '../api/inventory'

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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

const mockItem = {
  id: 'item-1',
  name: 'Basmati Rice',
  unit: 'kg',
  current_stock: '12.50',
  low_stock_threshold: '5.00',
  cost_per_unit: '80.00',
}

describe('useInventoryItems', () => {
  beforeEach(() => {
    vi.mocked(client.get).mockClear()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  })

  it('fetches /inventory/', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [mockItem] })
    const { result } = renderHook(() => useInventoryItems(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/inventory/')
    expect(result.current.data).toHaveLength(1)
  })

  it('returns isError on failure', async () => {
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useInventoryItems(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateInventoryItem', () => {
  beforeEach(() => { vi.mocked(client.post).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('posts to /inventory/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockItem })
    const { result } = renderHook(() => useCreateInventoryItem(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Basmati Rice', unit: 'kg', low_stock_threshold: '5.00', cost_per_unit: '80.00' })
    })
    expect(client.post).toHaveBeenCalledWith('/inventory/', expect.any(Object))
  })
})

describe('useUpdateInventoryItem', () => {
  beforeEach(() => { vi.mocked(client.patch).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('patches /inventory/:id/', async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: mockItem })
    const { result } = renderHook(() => useUpdateInventoryItem(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 'item-1', name: 'Updated Rice' })
    })
    expect(client.patch).toHaveBeenCalledWith('/inventory/item-1/', { name: 'Updated Rice' })
  })
})

describe('useDeleteInventoryItem', () => {
  beforeEach(() => { vi.mocked(client.delete).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('deletes /inventory/:id/', async () => {
    vi.mocked(client.delete).mockResolvedValue({})
    const { result } = renderHook(() => useDeleteInventoryItem(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('item-1')
    })
    expect(client.delete).toHaveBeenCalledWith('/inventory/item-1/')
  })
})

describe('useAddStockTransaction', () => {
  beforeEach(() => { vi.mocked(client.post).mockClear(); vi.mocked(client.get).mockResolvedValue({ data: [] }); queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) })

  it('posts to /inventory/transactions/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { current_stock: '17.50' } })
    const { result } = renderHook(() => useAddStockTransaction(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ item: 'item-1', transaction_type: 'add', quantity: '5.00', notes: 'Restock' })
    })
    expect(client.post).toHaveBeenCalledWith('/inventory/transactions/', {
      item: 'item-1',
      transaction_type: 'add',
      quantity: '5.00',
      notes: 'Restock',
    })
  })
})
