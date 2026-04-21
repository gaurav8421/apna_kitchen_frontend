import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import KitchenDisplay from '../pages/kitchen/KitchenDisplay'
import { useKitchenSocket } from '../hooks/useKitchenSocket'

// Mock transitive deps of useKitchenSocket first so the ESM resolver
// can handle them when transforming the hook during mock setup
// (required because the project path contains a space)
vi.mock('../store/authStore', () => ({
  default: (selector) => selector({ user: null, accessToken: null }),
}))

vi.mock('../api/client', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}))

vi.mock('../hooks/useKitchenSocket', () => ({
  useKitchenSocket: vi.fn(),
}))

vi.mock('../api/orders', () => ({
  useUpdateOrderStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))

function wrap(ui) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

let defaultSocket

describe('KitchenDisplay', () => {
  beforeEach(() => {
    defaultSocket = {
      orders: [],
      connected: true,
      connecting: false,
      noBranch: false,
      updateOrderLocally: vi.fn(),
    }
    vi.mocked(useKitchenSocket).mockReturnValue(defaultSocket)
  })

  it('renders three column headers', () => {
    wrap(<KitchenDisplay />)
    expect(screen.getByText(/PENDING/)).toBeInTheDocument()
    expect(screen.getByText(/PREPARING/)).toBeInTheDocument()
    expect(screen.getByText(/READY/)).toBeInTheDocument()
  })

  it('shows Connected indicator when connected=true', () => {
    wrap(<KitchenDisplay />)
    expect(screen.getByText(/Connected/)).toBeInTheDocument()
  })

  it('shows Connecting… when connecting=true and connected=false', () => {
    vi.mocked(useKitchenSocket).mockReturnValueOnce({ ...defaultSocket, connected: false, connecting: true })
    wrap(<KitchenDisplay />)
    expect(screen.getByText(/Connecting…/)).toBeInTheDocument()
  })

  it('shows no-branch message when noBranch=true', () => {
    vi.mocked(useKitchenSocket).mockReturnValueOnce({ ...defaultSocket, noBranch: true })
    wrap(<KitchenDisplay />)
    expect(screen.getByText(/No branch assigned/i)).toBeInTheDocument()
  })

  it('renders order card in the correct column', () => {
    vi.mocked(useKitchenSocket).mockReturnValueOnce({
      ...defaultSocket,
      orders: [{
        id: '1',
        status: 'pending',
        order_number: 'ORD-0001',
        order_type: 'dine_in',
        table_number: '3',
        created_at: new Date().toISOString(),
        items: [{ item_name: 'Naan', quantity: 1 }],
      }],
    })
    wrap(<KitchenDisplay />)
    expect(screen.getByText('ORD-0001')).toBeInTheDocument()
  })

  it('shows cancelled order in the pending column', () => {
    vi.mocked(useKitchenSocket).mockReturnValueOnce({
      ...defaultSocket,
      orders: [{
        id: '2',
        status: 'cancelled',
        order_number: 'ORD-0002',
        order_type: 'takeaway',
        table_number: null,
        created_at: new Date().toISOString(),
        items: [{ item_name: 'Chai', quantity: 2 }],
      }],
    })
    wrap(<KitchenDisplay />)
    expect(screen.getByText('ORD-0002')).toBeInTheDocument()
  })
})
