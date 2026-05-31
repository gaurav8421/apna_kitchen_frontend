import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dashboard from '../pages/dashboard/Dashboard'

vi.mock('../api/reports', () => ({
  useDailySummary: vi.fn(),
  useWeeklyTrend: vi.fn(),
}))

vi.mock('../store/authStore', () => ({
  default: vi.fn(),
}))

import { useDailySummary, useWeeklyTrend } from '../api/reports'
import useAuthStore from '../store/authStore'

const emptyWeek = Array.from({ length: 7 }, (_, i) => ({
  date: `2026-04-${18 + i}`,
  label: `${18 + i} Apr`,
  sales: 0,
  expenses: 0,
  orders: 0,
  isLoading: false,
}))

beforeEach(() => {
  vi.mocked(useAuthStore).mockImplementation((sel) => sel({ user: { name: 'Gaurav', org_name: 'Pulse' } }))
  vi.mocked(useWeeklyTrend).mockReturnValue(emptyWeek)
  vi.mocked(useDailySummary).mockReturnValue({
    isLoading: false, isError: false, data: null, refetch: vi.fn(),
  })
})

describe('Dashboard', () => {
  it('shows greeting and date', () => {
    render(<Dashboard />)
    expect(screen.getByText(/Good (morning|afternoon|evening), Gaurav/i)).toBeInTheDocument()
  })

  it('shows loading skeletons for KPI cards while fetching', () => {
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: true, isError: false, data: null, refetch: vi.fn(),
    })
    const { container } = render(<Dashboard />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(4)
  })

  it('renders KPI values when data loaded', () => {
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: false, isError: false,
      data: { total_sales: '4820.00', order_count: 23, avg_order: '209.57', total_expenses: '1200.00' },
      refetch: vi.fn(),
    })
    render(<Dashboard />)
    expect(screen.getByText('₹4,820')).toBeInTheDocument()
    expect(screen.getByText('23')).toBeInTheDocument()
  })

  it('shows error banner with Retry on failure', () => {
    const refetch = vi.fn()
    vi.mocked(useDailySummary).mockReturnValueOnce({
      isLoading: false, isError: true, data: null, refetch,
    })
    render(<Dashboard />)
    expect(screen.getByText(/Could not load summary/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders Last 7 Days chart section', () => {
    render(<Dashboard />)
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
  })

  it('shows chart skeleton while weekly data loads', () => {
    vi.mocked(useWeeklyTrend).mockReturnValueOnce(
      emptyWeek.map((d) => ({ ...d, isLoading: true }))
    )
    const { container } = render(<Dashboard />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
