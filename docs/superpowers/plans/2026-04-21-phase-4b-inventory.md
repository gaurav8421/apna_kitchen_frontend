# Phase 4b — Inventory Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full inventory management UI — list items with low-stock highlighting, add/edit items via modal, adjust stock via transaction modal, wire router and sidebar.

**Architecture:** Five React Query hooks in `src/api/inventory.js`; two modals (`InventoryItemModal`, `StockAdjustModal`); a full-page list component (`InventoryList`); router and sidebar updated to enable the previously-disabled Inventory link.

**Tech Stack:** React 19, Vite, Tailwind CSS v3, React Query v5, Vitest + @testing-library/react

---

## File Map

| File | Create / Modify | Purpose |
|------|-----------------|---------|
| `src/api/inventory.js` | Create | `useInventoryItems`, `useCreateInventoryItem`, `useUpdateInventoryItem`, `useDeleteInventoryItem`, `useAddStockTransaction` |
| `src/components/inventory/InventoryItemModal.jsx` | Create | Add/Edit item modal (name, unit, low_stock_threshold, cost_per_unit) |
| `src/components/inventory/StockAdjustModal.jsx` | Create | Stock transaction modal (type, quantity, notes) |
| `src/pages/inventory/InventoryList.jsx` | Create | Full page: table + action buttons + low-stock highlighting |
| `src/router/index.jsx` | Modify | Add `/inventory` route → `InventoryList` inside `AppLayout` |
| `src/components/layout/Sidebar.jsx` | Modify | Remove `comingSoon` from Inventory nav item |
| `src/tests/inventory.test.jsx` | Create | Hook unit tests |
| `src/tests/InventoryList.test.jsx` | Create | Page render tests |

---

## Task 1: Inventory API hooks

**Files:**
- Create: `src/api/inventory.js`
- Test: `src/tests/inventory.test.jsx`

- [ ] **Step 1.1 — Write the failing tests**

Create `src/tests/inventory.test.jsx`:

```jsx
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

function wrapper({ children }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
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
  beforeEach(() => vi.mocked(client.get).mockClear())

  it('fetches /api/v1/inventory/', async () => {
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
  beforeEach(() => vi.mocked(client.post).mockClear())

  it('posts to /api/v1/inventory/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockItem })
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useCreateInventoryItem(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Basmati Rice', unit: 'kg', low_stock_threshold: '5.00', cost_per_unit: '80.00' })
    })
    expect(client.post).toHaveBeenCalledWith('/inventory/', expect.any(Object))
  })
})

describe('useUpdateInventoryItem', () => {
  beforeEach(() => vi.mocked(client.patch).mockClear())

  it('patches /api/v1/inventory/:id/', async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: mockItem })
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useUpdateInventoryItem(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 'item-1', name: 'Updated Rice' })
    })
    expect(client.patch).toHaveBeenCalledWith('/inventory/item-1/', { name: 'Updated Rice' })
  })
})

describe('useDeleteInventoryItem', () => {
  beforeEach(() => vi.mocked(client.delete).mockClear())

  it('deletes /api/v1/inventory/:id/', async () => {
    vi.mocked(client.delete).mockResolvedValue({})
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useDeleteInventoryItem(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('item-1')
    })
    expect(client.delete).toHaveBeenCalledWith('/inventory/item-1/')
  })
})

describe('useAddStockTransaction', () => {
  beforeEach(() => vi.mocked(client.post).mockClear())

  it('posts to /api/v1/inventory/transactions/', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { current_stock: '17.50' } })
    vi.mocked(client.get).mockResolvedValue({ data: [] })
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
```

- [ ] **Step 1.2 — Run tests to confirm they fail**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/inventory.test.jsx 2>&1 | tail -15
```

Expected: FAIL — `Cannot find module '../api/inventory'`

- [ ] **Step 1.3 — Implement hooks**

Create `src/api/inventory.js`:

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => client.get('/inventory/').then((r) => r.data),
  })
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/inventory/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/inventory/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/inventory/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useAddStockTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/inventory/transactions/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
```

- [ ] **Step 1.4 — Run tests to confirm they pass**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/inventory.test.jsx 2>&1 | tail -15
```

Expected: 5/5 PASS

- [ ] **Step 1.5 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/api/inventory.js src/tests/inventory.test.jsx && git commit -m "feat: add inventory React Query hooks"
```

---

## Task 2: InventoryItemModal

**Files:**
- Create: `src/components/inventory/InventoryItemModal.jsx`

- [ ] **Step 2.1 — Implement modal**

Create `src/components/inventory/InventoryItemModal.jsx`:

```jsx
import { useState, useEffect } from 'react'

export default function InventoryItemModal({ item, onSubmit, onClose, isSubmitting }) {
  const [form, setForm] = useState({
    name: '',
    unit: '',
    low_stock_threshold: '',
    cost_per_unit: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        unit: item.unit,
        low_stock_threshold: item.low_stock_threshold,
        cost_per_unit: item.cost_per_unit,
      })
    }
  }, [item])

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.unit.trim()) e.unit = 'Unit is required'
    const thresh = Number(form.low_stock_threshold)
    if (isNaN(thresh) || thresh < 0) e.low_stock_threshold = 'Must be ≥ 0'
    const cost = Number(form.cost_per_unit)
    if (isNaN(cost) || cost < 0) e.cost_per_unit = 'Must be ≥ 0'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{item ? 'Edit Item' : 'Add Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Unit</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="kg, litre, piece…"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.low_stock_threshold}
              onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
            />
            {errors.low_stock_threshold && <p className="text-red-500 text-xs mt-1">{errors.low_stock_threshold}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cost per Unit (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.cost_per_unit}
              onChange={(e) => setForm((f) => ({ ...f, cost_per_unit: e.target.value }))}
            />
            {errors.cost_per_unit && <p className="text-red-500 text-xs mt-1">{errors.cost_per_unit}</p>}
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
              {isSubmitting ? 'Saving…' : item ? 'Save Changes' : 'Add Item'}
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
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/components/inventory/InventoryItemModal.jsx && git commit -m "feat: add InventoryItemModal component"
```

---

## Task 3: StockAdjustModal

**Files:**
- Create: `src/components/inventory/StockAdjustModal.jsx`

- [ ] **Step 3.1 — Implement modal**

Create `src/components/inventory/StockAdjustModal.jsx`:

```jsx
import { useState } from 'react'

export default function StockAdjustModal({ item, onSubmit, onClose, isSubmitting }) {
  const [form, setForm] = useState({ transaction_type: 'add', quantity: '', notes: '' })
  const [error, setError] = useState('')

  const currentStock = Number(item.current_stock)
  const qty = Number(form.quantity)
  const showDeductWarning =
    form.transaction_type === 'deduct' && form.quantity !== '' && qty > currentStock

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0')
      return
    }
    setError('')
    onSubmit({ item: item.id, transaction_type: form.transaction_type, quantity: form.quantity, notes: form.notes })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-1">Adjust Stock</h2>
        <p className="text-sm text-gray-500 mb-4">
          {item.name} — Current: {item.current_stock} {item.unit}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.transaction_type}
              onChange={(e) => setForm((f) => ({ ...f, transaction_type: e.target.value }))}
            >
              <option value="add">Add</option>
              <option value="deduct">Deduct</option>
              <option value="adjust">Set Exact (Adjust)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            {showDeductWarning && (
              <p className="text-amber-600 text-xs mt-1">
                Warning: deducting more than current stock ({item.current_stock} {item.unit})
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
              {isSubmitting ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3.2 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/components/inventory/StockAdjustModal.jsx && git commit -m "feat: add StockAdjustModal component"
```

---

## Task 4: InventoryList page

**Files:**
- Create: `src/pages/inventory/InventoryList.jsx`
- Test: `src/tests/InventoryList.test.jsx`

- [ ] **Step 4.1 — Write the failing tests**

Create `src/tests/InventoryList.test.jsx`:

```jsx
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
    vi.mocked(useCreateInventoryItem).mockReturnValue(mockMutation)
    vi.mocked(useUpdateInventoryItem).mockReturnValue(mockMutation)
    vi.mocked(useDeleteInventoryItem).mockReturnValue(mockMutation)
    vi.mocked(useAddStockTransaction).mockReturnValue(mockMutation)
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
```

- [ ] **Step 4.2 — Run tests to confirm they fail**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/InventoryList.test.jsx 2>&1 | tail -15
```

Expected: FAIL — `Cannot find module '../pages/inventory/InventoryList'`

- [ ] **Step 4.3 — Implement InventoryList**

Create `src/pages/inventory/InventoryList.jsx`:

```jsx
import { useState } from 'react'
import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useAddStockTransaction,
} from '../../api/inventory'
import InventoryItemModal from '../../components/inventory/InventoryItemModal'
import StockAdjustModal from '../../components/inventory/StockAdjustModal'

export default function InventoryList() {
  const { data: items = [], isLoading, isError, refetch } = useInventoryItems()
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const deleteItem = useDeleteInventoryItem()
  const addTransaction = useAddStockTransaction()

  const [itemModal, setItemModal] = useState(null) // null | 'add' | item-object
  const [adjustItem, setAdjustItem] = useState(null)
  const [toast, setToast] = useState('')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleItemSubmit(form) {
    try {
      if (itemModal === 'add') {
        await createItem.mutateAsync(form)
      } else {
        await updateItem.mutateAsync({ id: itemModal.id, ...form })
      }
      setItemModal(null)
    } catch {
      showToast('Could not save item. Please try again.')
    }
  }

  async function handleAdjustSubmit(payload) {
    try {
      await addTransaction.mutateAsync(payload)
      setAdjustItem(null)
    } catch {
      showToast('Could not adjust stock. Please try again.')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await deleteItem.mutateAsync(item.id)
    } catch {
      showToast('Could not delete item.')
    }
  }

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
          <span>Could not load inventory</span>
          <button onClick={() => refetch()} className="underline hover:no-underline font-medium">
            Retry
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Inventory</h2>
        <button
          onClick={() => setItemModal('add')}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          + Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Threshold</th>
              <th className="px-4 py-3 font-medium">Cost/Unit</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No items yet. Add your first inventory item.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold)
              return (
                <tr
                  key={item.id}
                  data-testid={`row-${item.id}`}
                  className={`border-b last:border-0 ${isLow ? 'border-l-4 border-l-red-400' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                  <td
                    data-testid={`stock-${item.id}`}
                    className={`px-4 py-3 font-medium ${isLow ? 'text-red-600' : 'text-gray-800'}`}
                  >
                    {item.current_stock}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.low_stock_threshold}</td>
                  <td className="px-4 py-3 text-gray-600">₹{item.cost_per_unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        aria-label={`Adjust ${item.name}`}
                        onClick={() => setAdjustItem(item)}
                        className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
                      >
                        Adjust
                      </button>
                      <button
                        aria-label={`Edit ${item.name}`}
                        onClick={() => setItemModal(item)}
                        className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${item.name}`}
                        onClick={() => handleDelete(item)}
                        className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {itemModal && (
        <InventoryItemModal
          item={itemModal === 'add' ? null : itemModal}
          onSubmit={handleItemSubmit}
          onClose={() => setItemModal(null)}
          isSubmitting={createItem.isPending || updateItem.isPending}
        />
      )}
      {adjustItem && (
        <StockAdjustModal
          item={adjustItem}
          onSubmit={handleAdjustSubmit}
          onClose={() => setAdjustItem(null)}
          isSubmitting={addTransaction.isPending}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4.4 — Run tests to confirm they pass**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/InventoryList.test.jsx 2>&1 | tail -15
```

Expected: 8/8 PASS

- [ ] **Step 4.5 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/pages/inventory/InventoryList.jsx src/tests/InventoryList.test.jsx && git commit -m "feat: add InventoryList page with low-stock highlighting and CRUD"
```

---

## Task 5: Router + Sidebar wiring

**Files:**
- Modify: `src/router/index.jsx`
- Modify: `src/components/layout/Sidebar.jsx`

- [ ] **Step 5.1 — Add /inventory route**

In `src/router/index.jsx`, add the lazy import and route. Read the file first to find the existing pattern (look for how `/orders` or `/menu` is wired), then apply the same pattern:

Add import near top of router file (with other lazy imports):
```js
const InventoryList = lazy(() => import('../pages/inventory/InventoryList'))
```

Add route inside `AppLayout` routes (alongside `/orders`, `/menu`):
```jsx
<Route path="inventory" element={<InventoryList />} />
```

- [ ] **Step 5.2 — Remove comingSoon from Inventory sidebar item**

In `src/components/layout/Sidebar.jsx`, find the Inventory nav item. It currently has a `comingSoon` prop or a disabled/grayed appearance. Remove whatever disables it so it navigates normally like the other links.

Read the file first to find the exact code, then remove only the `comingSoon` prop or disabled class from the Inventory entry.

- [ ] **Step 5.3 — Run full test suite**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run 2>&1 | tail -10
```

Expected: all tests pass (no regressions)

- [ ] **Step 5.4 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/router/index.jsx src/components/layout/Sidebar.jsx && git commit -m "feat: wire /inventory route and enable Inventory sidebar link"
```

---

## Self-Review

- [x] Spec coverage: `useInventoryItems` ✓, `useCreateInventoryItem` ✓, `useUpdateInventoryItem` ✓, `useDeleteInventoryItem` ✓, `useAddStockTransaction` ✓, low-stock red highlight ✓, low-stock red border ✓, Adjust modal ✓, Add/Edit modal ✓, Delete confirm ✓, error banner + Retry ✓, toast on mutation error ✓, remove comingSoon ✓, `/inventory` route ✓
- [x] No placeholders
- [x] `data-testid` attributes on row and stock cell match test selectors exactly
- [x] `aria-label` on action buttons matches test queries exactly (`Adjust ${item.name}`, `Edit ${item.name}`, `Delete ${item.name}`)
