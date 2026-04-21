import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InventoryList from '../pages/inventory/InventoryList'

vi.mock('../api/inventory', () => ({
  useInventoryItems: vi.fn(),
  useCreateInventoryItem: vi.fn(),
  useUpdateInventoryItem: vi.fn(),
  useDeleteInventoryItem: vi.fn(),
  useAddStockTransaction: vi.fn(),
}))

import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useAddStockTransaction,
} from '../api/inventory'

const mockMutation = { mutateAsync: vi.fn(), isPending: false }

const normalItem = {
  id: 'item-1',
  name: 'Basmati Rice',
  unit: 'kg',
  current_stock: '12.50',
  low_stock_threshold: '5.00',
  cost_per_unit: '80.00',
}

const lowStockItem = {
  id: 'item-2',
  name: 'Mustard Oil',
  unit: 'litre',
  current_stock: '2.00',
  low_stock_threshold: '3.00',
  cost_per_unit: '120.00',
}

describe('InventoryList', () => {
  beforeEach(() => {
    vi.mocked(useInventoryItems).mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() })
    vi.mocked(useCreateInventoryItem).mockReturnValue({ ...mockMutation })
    vi.mocked(useUpdateInventoryItem).mockReturnValue({ ...mockMutation })
    vi.mocked(useDeleteInventoryItem).mockReturnValue({ ...mockMutation })
    vi.mocked(useAddStockTransaction).mockReturnValue({ ...mockMutation })
  })

  it('shows loading state', () => {
    vi.mocked(useInventoryItems).mockReturnValueOnce({ isLoading: true, isError: false, data: null, refetch: vi.fn() })
    render(<InventoryList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error banner with Retry button', () => {
    const refetch = vi.fn()
    vi.mocked(useInventoryItems).mockReturnValueOnce({ isLoading: false, isError: true, data: null, refetch })
    render(<InventoryList />)
    expect(screen.getByText(/Could not load inventory/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders items in table', () => {
    vi.mocked(useInventoryItems).mockReturnValueOnce({ isLoading: false, isError: false, data: [normalItem], refetch: vi.fn() })
    render(<InventoryList />)
    expect(screen.getByText('Basmati Rice')).toBeInTheDocument()
    expect(screen.getByText('12.50')).toBeInTheDocument()
  })

  it('highlights low stock row with red stock value', () => {
    vi.mocked(useInventoryItems).mockReturnValueOnce({ isLoading: false, isError: false, data: [lowStockItem], refetch: vi.fn() })
    const { container } = render(<InventoryList />)
    const stockCell = screen.getByTestId('stock-item-2')
    expect(stockCell).toHaveClass('text-red-600')
    const row = container.querySelector('[data-testid="row-item-2"]')
    expect(row.className).toMatch(/border-l-4/)
  })

  it('opens Add Item modal on button click', () => {
    render(<InventoryList />)
    fireEvent.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getByText(/Add Item/i)).toBeInTheDocument()
  })

  it('opens Edit modal pre-filled', () => {
    vi.mocked(useInventoryItems).mockReturnValueOnce({ isLoading: false, isError: false, data: [normalItem], refetch: vi.fn() })
    render(<InventoryList />)
    fireEvent.click(screen.getByRole('button', { name: /edit basmati rice/i }))
    expect(screen.getByDisplayValue('Basmati Rice')).toBeInTheDocument()
  })

  it('opens Adjust Stock modal', () => {
    vi.mocked(useInventoryItems).mockReturnValueOnce({ isLoading: false, isError: false, data: [normalItem], refetch: vi.fn() })
    render(<InventoryList />)
    fireEvent.click(screen.getByRole('button', { name: /adjust basmati rice/i }))
    expect(screen.getByText(/Adjust Stock/i)).toBeInTheDocument()
  })

  it('calls delete mutation on confirm', () => {
    const deleteMutation = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
    vi.mocked(useDeleteInventoryItem).mockReturnValue(deleteMutation)
    vi.mocked(useInventoryItems).mockReturnValueOnce({ isLoading: false, isError: false, data: [normalItem], refetch: vi.fn() })
    window.confirm = vi.fn().mockReturnValue(true)
    render(<InventoryList />)
    fireEvent.click(screen.getByRole('button', { name: /delete basmati rice/i }))
    expect(deleteMutation.mutateAsync).toHaveBeenCalledWith('item-1')
  })
})
