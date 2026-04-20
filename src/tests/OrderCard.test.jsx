import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderCard from '../components/kitchen/OrderCard'

const mockUpdateStatus = vi.fn()

vi.mock('../api/orders', () => ({
  useUpdateOrderStatus: () => ({
    mutate: mockUpdateStatus,
    isPending: false,
  }),
}))

function wrap(ui) {
  return render(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
  )
}

const baseOrder = {
  id: 'ord-1',
  order_number: 'ORD-0001',
  status: 'pending',
  order_type: 'dine_in',
  table_number: '4',
  created_at: new Date().toISOString(),
  items: [
    { item_name: 'Biryani', quantity: 2 },
    { item_name: 'Naan', quantity: 1 },
  ],
}

describe('OrderCard', () => {
  beforeEach(() => mockUpdateStatus.mockClear())

  it('renders order number', () => {
    wrap(<OrderCard order={baseOrder} onStatusUpdate={vi.fn()} />)
    expect(screen.getByText('ORD-0001')).toBeInTheDocument()
  })

  it('renders all items', () => {
    wrap(<OrderCard order={baseOrder} onStatusUpdate={vi.fn()} />)
    expect(screen.getByText(/2× Biryani/)).toBeInTheDocument()
    expect(screen.getByText(/1× Naan/)).toBeInTheDocument()
  })

  it('shows "Start Preparing" for pending order', () => {
    wrap(<OrderCard order={baseOrder} onStatusUpdate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start preparing/i })).toBeInTheDocument()
  })

  it('shows "Mark Ready" for preparing order', () => {
    wrap(<OrderCard order={{ ...baseOrder, status: 'preparing' }} onStatusUpdate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /mark ready/i })).toBeInTheDocument()
  })

  it('shows "Complete" for ready order', () => {
    wrap(<OrderCard order={{ ...baseOrder, status: 'ready' }} onStatusUpdate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument()
  })

  it('calls updateStatus with next status on button click', () => {
    const onStatusUpdate = vi.fn()
    wrap(<OrderCard order={baseOrder} onStatusUpdate={onStatusUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: /start preparing/i }))
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      { id: 'ord-1', status: 'preparing' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('shows Dine-In and table number', () => {
    wrap(<OrderCard order={baseOrder} onStatusUpdate={vi.fn()} />)
    expect(screen.getByText(/Dine-In/)).toBeInTheDocument()
    expect(screen.getByText(/T:4/)).toBeInTheDocument()
  })

  it('shows no action button for cancelled order', () => {
    wrap(<OrderCard order={{ ...baseOrder, status: 'cancelled' }} onStatusUpdate={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows strikethrough items for cancelled order', () => {
    wrap(<OrderCard order={{ ...baseOrder, status: 'cancelled' }} onStatusUpdate={vi.fn()} />)
    expect(screen.getByText(/Cancelled/i)).toBeInTheDocument()
  })
})
