import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReportsPage from '../pages/reports/ReportsPage'

vi.mock('../api/reports', () => ({
  useDailySummary: vi.fn(),
}))

import { useDailySummary } from '../api/reports'

const mockData = {
  total_sales: '4820.00',
  order_count: 23,
  avg_order: '209.57',
  total_expenses: '1200.00',
}

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.mocked(useDailySummary).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockData,
      refetch: vi.fn(),
    })
  })

  it('renders page heading', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('renders date picker defaulting to today', () => {
    render(<ReportsPage />)
    const today = new Date().toISOString().slice(0, 10)
    expect(screen.getByDisplayValue(today)).toBeInTheDocument()
  })

  it('shows 4 loading skeletons while fetching', () => {
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: true, isError: false, data: null, refetch: vi.fn(),
    })
    const { container } = render(<ReportsPage />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })

  it('renders KPI values when data loaded', () => {
    render(<ReportsPage />)
    expect(screen.getByText('₹4,820.00')).toBeInTheDocument()
    expect(screen.getByText('23')).toBeInTheDocument()
    expect(screen.getByText('₹1,200.00')).toBeInTheDocument()
  })

  it('shows profit summary card when data loaded', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Profit Summary')).toBeInTheDocument()
    expect(screen.getByText('₹3,620.00')).toBeInTheDocument()
  })

  it('shows error banner with Retry on failure', () => {
    const refetch = vi.fn()
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: false, isError: true, data: null, refetch,
    })
    render(<ReportsPage />)
    expect(screen.getByText(/Could not load report/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('passes changed date to useDailySummary', () => {
    render(<ReportsPage />)
    const input = screen.getByDisplayValue(new Date().toISOString().slice(0, 10))
    fireEvent.change(input, { target: { value: '2026-04-01' } })
    expect(vi.mocked(useDailySummary)).toHaveBeenCalledWith('2026-04-01')
  })
})
