# Phase 4c — Expense Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full expense management UI — list expenses with category/date filters, add/edit/delete via modal (with inline new-category creation), wire router and sidebar.

**Architecture:** Six React Query hooks in `src/api/expenses.js`; `ExpenseFormModal` component with inline category creation; `ExpenseList` page with filter bar and client-side total; `Wallet` icon added to Sidebar between Inventory and Reports; `/expenses` route added.

**Tech Stack:** React 19, Vite, Tailwind CSS v3, React Query v5, Vitest + @testing-library/react

---

## File Map

| File | Create / Modify | Purpose |
|------|-----------------|---------|
| `src/api/expenses.js` | Create | `useExpenses`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`, `useExpenseCategories`, `useCreateExpenseCategory` |
| `src/components/expenses/ExpenseFormModal.jsx` | Create | Add/Edit modal: amount, category dropdown + inline new category, vendor, date, description |
| `src/pages/expenses/ExpenseList.jsx` | Create | Full page: filter bar + table + client-side total |
| `src/router/index.jsx` | Modify | Add `/expenses` route → `ExpenseList` inside `AppLayout` |
| `src/components/layout/Sidebar.jsx` | Modify | Add `Wallet` icon + Expenses nav item between Inventory and Reports |
| `src/tests/expenses.test.jsx` | Create | Hook unit tests |
| `src/tests/ExpenseList.test.jsx` | Create | Page render tests |

---

## Task 1: Expense API hooks

**Files:**
- Create: `src/api/expenses.js`
- Test: `src/tests/expenses.test.jsx`

- [ ] **Step 1.1 — Write the failing tests**

Create `src/tests/expenses.test.jsx`:

```jsx
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

function wrapper({ children }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
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
  beforeEach(() => vi.mocked(client.get).mockClear())

  it('fetches /api/v1/expenses/ with no params by default', async () => {
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
  beforeEach(() => vi.mocked(client.post).mockClear())

  it('posts to /api/v1/expenses/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockExpense })
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useCreateExpense(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ amount: '1200.00', category: 'cat-1', expense_date: '2026-04-21' })
    })
    expect(client.post).toHaveBeenCalledWith('/expenses/', expect.any(Object))
  })
})

describe('useUpdateExpense', () => {
  beforeEach(() => vi.mocked(client.patch).mockClear())

  it('patches /api/v1/expenses/:id/', async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: mockExpense })
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useUpdateExpense(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 'exp-1', amount: '1500.00' })
    })
    expect(client.patch).toHaveBeenCalledWith('/expenses/exp-1/', { amount: '1500.00' })
  })
})

describe('useDeleteExpense', () => {
  beforeEach(() => vi.mocked(client.delete).mockClear())

  it('deletes /api/v1/expenses/:id/', async () => {
    vi.mocked(client.delete).mockResolvedValue({})
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useDeleteExpense(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('exp-1')
    })
    expect(client.delete).toHaveBeenCalledWith('/expenses/exp-1/')
  })
})

describe('useExpenseCategories', () => {
  beforeEach(() => vi.mocked(client.get).mockClear())

  it('fetches /api/v1/expenses/categories/', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [mockCategory] })
    const { result } = renderHook(() => useExpenseCategories(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/expenses/categories/')
  })
})

describe('useCreateExpenseCategory', () => {
  beforeEach(() => vi.mocked(client.post).mockClear())

  it('posts to /api/v1/expenses/categories/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockCategory })
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useCreateExpenseCategory(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Utilities' })
    })
    expect(client.post).toHaveBeenCalledWith('/expenses/categories/', { name: 'Utilities' })
  })
})
```

- [ ] **Step 1.2 — Run tests to confirm they fail**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/expenses.test.jsx 2>&1 | tail -15
```

Expected: FAIL — `Cannot find module '../api/expenses'`

- [ ] **Step 1.3 — Implement hooks**

Create `src/api/expenses.js`:

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useExpenses(filters = {}) {
  const params = {}
  if (filters.category) params.category = filters.category
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => client.get('/expenses/', { params }).then((r) => r.data),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/expenses/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/expenses/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/expenses/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => client.get('/expenses/categories/').then((r) => r.data),
  })
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/expenses/categories/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense-categories'] }),
  })
}
```

- [ ] **Step 1.4 — Run tests to confirm they pass**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/expenses.test.jsx 2>&1 | tail -15
```

Expected: 6/6 PASS

- [ ] **Step 1.5 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/api/expenses.js src/tests/expenses.test.jsx && git commit -m "feat: add expense React Query hooks"
```

---

## Task 2: ExpenseFormModal

**Files:**
- Create: `src/components/expenses/ExpenseFormModal.jsx`

- [ ] **Step 2.1 — Implement modal**

Create `src/components/expenses/ExpenseFormModal.jsx`:

```jsx
import { useState, useEffect } from 'react'

export default function ExpenseFormModal({
  expense,
  categories,
  onSubmit,
  onCreateCategory,
  onClose,
  isSubmitting,
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    amount: '',
    category: '',
    vendor_name: '',
    expense_date: today,
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [creatingCat, setCreatingCat] = useState(false)

  useEffect(() => {
    if (expense) {
      setForm({
        amount: expense.amount,
        category: expense.category?.id ?? '',
        vendor_name: expense.vendor_name ?? '',
        expense_date: expense.expense_date,
        description: expense.description ?? '',
      })
    }
  }, [expense])

  function handleCategoryChange(e) {
    if (e.target.value === '__new__') {
      setShowNewCat(true)
      setForm((f) => ({ ...f, category: '' }))
    } else {
      setShowNewCat(false)
      setForm((f) => ({ ...f, category: e.target.value }))
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setCreatingCat(true)
    try {
      const cat = await onCreateCategory(newCatName.trim())
      setForm((f) => ({ ...f, category: cat.id }))
      setShowNewCat(false)
      setNewCatName('')
    } catch {
      // error shown by parent via toast
    } finally {
      setCreatingCat(false)
    }
  }

  function validate() {
    const e = {}
    const amt = Number(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = 'Amount must be > 0'
    if (!form.category) e.category = 'Category is required'
    if (!form.expense_date) e.expense_date = 'Date is required'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    onSubmit({
      amount: form.amount,
      category: form.category,
      vendor_name: form.vendor_name || undefined,
      expense_date: form.expense_date,
      description: form.description || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Amount (₹)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={showNewCat ? '__new__' : form.category}
              onChange={handleCategoryChange}
            >
              <option value="">Select category…</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__new__">＋ New category</option>
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            {showNewCat && (
              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <button
                  type="button"
                  disabled={creatingCat}
                  onClick={handleCreateCategory}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingCat ? '…' : 'Create'}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vendor (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.vendor_name}
              onChange={(e) => setForm((f) => ({ ...f, vendor_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            />
            {errors.expense_date && <p className="text-red-500 text-xs mt-1">{errors.expense_date}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : expense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2.2 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/components/expenses/ExpenseFormModal.jsx && git commit -m "feat: add ExpenseFormModal with inline category creation"
```

---

## Task 3: ExpenseList page

**Files:**
- Create: `src/pages/expenses/ExpenseList.jsx`
- Test: `src/tests/ExpenseList.test.jsx`

- [ ] **Step 3.1 — Write the failing tests**

Create `src/tests/ExpenseList.test.jsx`:

```jsx
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
  vendor_name: 'Bharat Gas',
  expense_date: '2026-04-21',
  category: { id: 'cat-1', name: 'Utilities' },
  created_at: '2026-04-21T10:30:00Z',
}

const mockExpense2 = {
  id: 'exp-2',
  amount: '8000.00',
  description: 'Staff salary',
  vendor_name: 'Staff',
  expense_date: '2026-04-20',
  category: { id: 'cat-2', name: 'Salary' },
  created_at: '2026-04-20T10:00:00Z',
}

describe('ExpenseList', () => {
  beforeEach(() => {
    vi.mocked(useExpenses).mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() })
    vi.mocked(useExpenseCategories).mockReturnValue({ data: [{ id: 'cat-1', name: 'Utilities' }] })
    vi.mocked(useCreateExpense).mockReturnValue(mockMutation)
    vi.mocked(useUpdateExpense).mockReturnValue(mockMutation)
    vi.mocked(useDeleteExpense).mockReturnValue(mockMutation)
    vi.mocked(useCreateExpenseCategory).mockReturnValue(mockMutation)
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
    expect(screen.getByText('Utilities')).toBeInTheDocument()
    expect(screen.getByText('₹1,200.00')).toBeInTheDocument()
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
```

- [ ] **Step 3.2 — Run tests to confirm they fail**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/ExpenseList.test.jsx 2>&1 | tail -15
```

Expected: FAIL — `Cannot find module '../pages/expenses/ExpenseList'`

- [ ] **Step 3.3 — Implement ExpenseList**

Create `src/pages/expenses/ExpenseList.jsx`:

```jsx
import { useState } from 'react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useCreateExpenseCategory,
} from '../../api/expenses'
import ExpenseFormModal from '../../components/expenses/ExpenseFormModal'

function fmtMoney(val) {
  const n = Number(val)
  if (isNaN(n)) return '—'
  return `₹${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ExpenseList() {
  const [filters, setFilters] = useState({ category: '', from: '', to: '' })
  const [modal, setModal] = useState(null) // null | 'add' | expense-object
  const [toast, setToast] = useState('')

  const activeFilters = {}
  if (filters.category) activeFilters.category = filters.category
  if (filters.from) activeFilters.from = filters.from
  if (filters.to) activeFilters.to = filters.to

  const { data: expenses = [], isLoading, isError, refetch } = useExpenses(activeFilters)
  const { data: categories = [] } = useExpenseCategories()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const createCategory = useCreateExpenseCategory()

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSubmit(form) {
    try {
      if (modal === 'add') {
        await createExpense.mutateAsync(form)
      } else {
        await updateExpense.mutateAsync({ id: modal.id, ...form })
      }
      setModal(null)
    } catch {
      showToast('Could not save expense. Please try again.')
    }
  }

  async function handleCreateCategory(name) {
    try {
      return await createCategory.mutateAsync({ name })
    } catch {
      showToast('Could not create category.')
      throw new Error('category create failed')
    }
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete this expense?`)) return
    try {
      await deleteExpense.mutateAsync(expense.id)
    } catch {
      showToast('Could not delete expense.')
    }
  }

  function resetFilters() {
    setFilters({ category: '', from: '', to: '' })
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {toast}
        </div>
      )}
      {isError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
          <span>Could not load expenses</span>
          <button onClick={() => refetch()} className="underline hover:no-underline font-medium">
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Expenses</h2>
        <button
          onClick={() => setModal('add')}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          + Add Expense
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
        </div>
        <button
          onClick={resetFilters}
          className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No expenses found.
                </td>
              </tr>
            )}
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-gray-600">{fmtDate(expense.expense_date)}</td>
                <td className="px-4 py-3 text-gray-800">{expense.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{expense.vendor_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{expense.description || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{fmtMoney(expense.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      aria-label={`Edit ${expense.id}`}
                      onClick={() => setModal(expense)}
                      className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${expense.id}`}
                      onClick={() => handleDelete(expense)}
                      className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      {expenses.length > 0 && (
        <p className="text-sm text-gray-600 mt-3 text-right">
          Total shown: <span className="font-semibold text-gray-800">{fmtMoney(total)}</span>
        </p>
      )}

      {modal && (
        <ExpenseFormModal
          expense={modal === 'add' ? null : modal}
          categories={categories}
          onSubmit={handleSubmit}
          onCreateCategory={handleCreateCategory}
          onClose={() => setModal(null)}
          isSubmitting={createExpense.isPending || updateExpense.isPending}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3.4 — Run tests to confirm they pass**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/ExpenseList.test.jsx 2>&1 | tail -15
```

Expected: 7/7 PASS

- [ ] **Step 3.5 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/pages/expenses/ExpenseList.jsx src/tests/ExpenseList.test.jsx && git commit -m "feat: add ExpenseList page with filters, total, and CRUD"
```

---

## Task 4: Router + Sidebar wiring

**Files:**
- Modify: `src/router/index.jsx`
- Modify: `src/components/layout/Sidebar.jsx`

- [ ] **Step 4.1 — Add /expenses route**

In `src/router/index.jsx`, add a lazy import and route. Read the file first to follow the existing pattern for `/orders` or `/menu`, then add:

```js
const ExpenseList = lazy(() => import('../pages/expenses/ExpenseList'))
```

And inside the `AppLayout` routes:
```jsx
<Route path="expenses" element={<ExpenseList />} />
```

- [ ] **Step 4.2 — Add Expenses to Sidebar**

Read `src/components/layout/Sidebar.jsx` first. The spec says:
- Add a `Wallet` icon from `lucide-react` (already used in the project — if Wallet is not available, use `CreditCard`)
- Insert an Expenses nav item between Inventory and Reports
- This item should NOT have `comingSoon` — it links normally to `/expenses`

Find where lucide icons are imported at the top of the file and add `Wallet` (or `CreditCard`) to the import. Then find the nav items array/list and insert the Expenses entry between Inventory and the first Reports/Settings-style link.

The entry should follow the same shape as existing nav items (check the file for exact shape — could be `{ to, label, icon, roles }` or JSX).

- [ ] **Step 4.3 — Run full test suite**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run 2>&1 | tail -10
```

Expected: all tests pass

- [ ] **Step 4.4 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/router/index.jsx src/components/layout/Sidebar.jsx && git commit -m "feat: wire /expenses route and add Expenses sidebar link"
```

---

## Self-Review

- [x] Spec coverage: `useExpenses` (with filter params) ✓, `useCreateExpense` ✓, `useUpdateExpense` ✓, `useDeleteExpense` ✓, `useExpenseCategories` ✓, `useCreateExpenseCategory` ✓, filter bar (category + from + to + reset) ✓, client-side total ✓, Add/Edit modal ✓, Delete confirm ✓, inline new-category (`__new__` sentinel) ✓, error banner + Retry ✓, toast on mutation error ✓, Wallet icon + Expenses nav ✓, `/expenses` route ✓
- [x] No placeholders
- [x] `fmtMoney` uses jsdom-safe regex (no `toLocaleString('en-IN')`)
- [x] `aria-label` on action buttons matches test queries exactly (`Edit ${expense.id}`, `Delete ${expense.id}`)
- [x] `useExpenses` always passes `params` object (even if empty) — matches test assertion `toHaveBeenCalledWith('/expenses/', { params: {} })`
