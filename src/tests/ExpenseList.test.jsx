import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExpenseList from '../pages/expenses/ExpenseList'

vi.mock('../api/expenses', () => ({
  useExpenses: vi.fn(),
  useCreateExpense: vi.fn(),
  useUpdateExpense: vi.fn(),
  useDeleteExpense: vi.fn(),
  useExpenseCategories: vi.fn(),
  useCreateExpenseCategory: vi.fn(),
}))

import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useCreateExpenseCategory,
} from '../api/expenses'

const mockMutation = { mutateAsync: vi.fn(), isPending: false }

const mockExpense = {
  id: 'exp-1',
  amount: '1200.00',
  description: 'Monthly gas',
  vendor: 'Bharat Gas',
  date: '2026-04-21',
  category: 'cat-1',
  category_name: 'Utilities',
  created_at: '2026-04-21T10:30:00Z',
}

const mockExpense2 = {
  id: 'exp-2',
  amount: '8000.00',
  description: 'Staff salary',
  vendor: 'Staff',
  date: '2026-04-20',
  category: 'cat-2',
  category_name: 'Salary',
  created_at: '2026-04-20T10:00:00Z',
}

describe('ExpenseList', () => {
  beforeEach(() => {
    vi.mocked(useExpenses).mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() })
    vi.mocked(useExpenseCategories).mockReturnValue({ data: [{ id: 'cat-1', name: 'Utilities' }] })
    vi.mocked(useCreateExpense).mockReturnValue({ ...mockMutation })
    vi.mocked(useUpdateExpense).mockReturnValue({ ...mockMutation })
    vi.mocked(useDeleteExpense).mockReturnValue({ ...mockMutation })
    vi.mocked(useCreateExpenseCategory).mockReturnValue({ ...mockMutation })
  })

  it('shows loading state', () => {
    vi.mocked(useExpenses).mockReturnValueOnce({ isLoading: true, isError: false, data: null, refetch: vi.fn() })
    render(<ExpenseList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error banner with Retry button', () => {
    const refetch = vi.fn()
    vi.mocked(useExpenses).mockReturnValueOnce({ isLoading: false, isError: true, data: null, refetch })
    render(<ExpenseList />)
    expect(screen.getByText(/Could not load expenses/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders expenses in table', () => {
    vi.mocked(useExpenses).mockReturnValueOnce({ isLoading: false, isError: false, data: [mockExpense], refetch: vi.fn() })
    render(<ExpenseList />)
    expect(screen.getByText('Bharat Gas')).toBeInTheDocument()
    expect(screen.getAllByText('Utilities').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('₹1,200.00').length).toBeGreaterThanOrEqual(1)
  })

  it('shows client-side total of all shown expenses', () => {
    vi.mocked(useExpenses).mockReturnValueOnce({
      isLoading: false, isError: false, data: [mockExpense, mockExpense2], refetch: vi.fn(),
    })
    render(<ExpenseList />)
    expect(screen.getByText('₹9,200.00')).toBeInTheDocument()
  })

  it('opens Add Expense modal on button click', () => {
    render(<ExpenseList />)
    fireEvent.click(screen.getByRole('button', { name: /add expense/i }))
    expect(screen.getByText(/Add Expense/i)).toBeInTheDocument()
  })

  it('opens Edit modal pre-filled', () => {
    vi.mocked(useExpenses).mockReturnValueOnce({ isLoading: false, isError: false, data: [mockExpense], refetch: vi.fn() })
    render(<ExpenseList />)
    fireEvent.click(screen.getByRole('button', { name: /edit exp-1/i }))
    expect(screen.getByDisplayValue('1200.00')).toBeInTheDocument()
  })

  it('calls delete mutation on confirm', () => {
    const deleteMutation = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
    vi.mocked(useDeleteExpense).mockReturnValue(deleteMutation)
    vi.mocked(useExpenses).mockReturnValueOnce({ isLoading: false, isError: false, data: [mockExpense], refetch: vi.fn() })
    window.confirm = vi.fn().mockReturnValue(true)
    render(<ExpenseList />)
    fireEvent.click(screen.getByRole('button', { name: /delete exp-1/i }))
    expect(deleteMutation.mutateAsync).toHaveBeenCalledWith('exp-1')
  })
})
