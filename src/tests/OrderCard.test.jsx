import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderCard from '../components/kitchen/OrderCard'
import { useUpdateOrderStatus } from '../api/orders'

const mockUpdateStatus = vi.fn()

vi.mock('../api/orders', () => ({
  useUpdateOrderStatus: vi.fn(),
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
  beforeEach(() => {
    mockUpdateStatus.mockClear()
    vi.mocked(useUpdateOrderStatus).mockReturnValue({
      mutate: mockUpdateStatus,
      isPending: false,
    })
  })

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
    const items = screen.getAllByText(/×/)
    items.forEach((el) => expect(el.className).toMatch(/line-through/))
  })

  it('calls onStatusUpdate with new status after mutation succeeds', () => {
    const onStatusUpdate = vi.fn()
    wrap(<OrderCard order={baseOrder} onStatusUpdate={onStatusUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: /start preparing/i }))
    // Simulate the onSuccess callback being invoked by the mutation
    const onSuccessArg = mockUpdateStatus.mock.calls[0][1].onSuccess
    onSuccessArg()
    expect(onStatusUpdate).toHaveBeenCalledWith('ord-1', 'preparing')
  })

  it('disables button and shows Updating… while isPending', () => {
    vi.mocked(useUpdateOrderStatus).mockReturnValueOnce({
      mutate: mockUpdateStatus,
      isPending: true,
    })
    wrap(<OrderCard order={baseOrder} onStatusUpdate={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /updating/i })
    expect(btn).toBeDisabled()
  })

  it('auto-hides cancelled order after 10 seconds', () => {
    vi.useFakeTimers()
    const { container } = wrap(
      <OrderCard order={{ ...baseOrder, status: 'cancelled' }} onStatusUpdate={vi.fn()} />
    )
    expect(container.firstChild).not.toBeNull()
    act(() => vi.advanceTimersByTime(10_000))
    expect(container.firstChild).toBeNull()
    vi.useRealTimers()
  })
})
