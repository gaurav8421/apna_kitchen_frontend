import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dashboard from '../pages/dashboard/Dashboard'

vi.mock('../api/reports', () => ({
  useDailySummary: vi.fn(),
}))

import { useDailySummary } from '../api/reports'

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useDailySummary).mockReturnValue({
      isLoading: false,
      isError: false,
      data: null,
      refetch: vi.fn(),
    })
  })

  it('shows 4 loading skeletons while fetching', () => {
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: true, isError: false, data: null, refetch: vi.fn(),
    })
    const { container } = render(<Dashboard />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })

  it('renders KPI values when data loaded', () => {
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: { total_sales: '4820.00', order_count: 23, avg_order: '209.57', total_expenses: '1200.00' },
      refetch: vi.fn(),
    })
    render(<Dashboard />)
    expect(screen.getByText('23')).toBeInTheDocument()
    expect(screen.getByText('₹4,820.00')).toBeInTheDocument()
    expect(screen.getByText('₹1,200.00')).toBeInTheDocument()
  })

  it('shows error banner with Retry button on failure', () => {
    const refetch = vi.fn()
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: false, isError: true, data: null, refetch,
    })
    render(<Dashboard />)
    expect(screen.getByText(/Could not load summary/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows — values (not skeletons) in error state', () => {
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: false, isError: true, data: null, refetch: vi.fn(),
    })
    const { container } = render(<Dashboard />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(0)
    expect(screen.getAllByText('—')).toHaveLength(4)
  })
})
