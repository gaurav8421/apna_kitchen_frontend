# Phase 4a — Dashboard KPI Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the stub Dashboard page to live API data so the four KPI cards (Total Sales, Orders, Avg Order, Expenses) show today's real figures, refreshed every 60 seconds.

**Architecture:** A new `useDailySummary(date)` React Query hook fetches `GET /reports/daily-summary/?date=<today>`. Dashboard.jsx consumes it, shows a pulse skeleton while loading, renders formatted values when loaded, and shows an error banner with Retry on failure.

**Tech Stack:** React 19, Vite, Tailwind CSS v3, React Query v5, Vitest + @testing-library/react

---

## File Map

| File | Create / Modify | Purpose |
|------|-----------------|---------|
| `src/api/reports.js` | Create | `useDailySummary(date)` React Query hook |
| `src/pages/dashboard/Dashboard.jsx` | Modify | Wire KPI cards to live data with loading/error states |
| `src/tests/reports.test.jsx` | Create | Hook unit tests |
| `src/tests/Dashboard.test.jsx` | Create | Dashboard render tests |

---

## Task 1: useDailySummary hook

**Files:**
- Create: `src/api/reports.js`
- Test: `src/tests/reports.test.jsx`

- [ ] **Step 1.1 — Write the failing tests**

Create `src/tests/reports.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDailySummary } from '../api/reports'

vi.mock('../api/client', () => ({
  default: { get: vi.fn() },
}))

import client from '../api/client'

function wrapper({ children }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

const mockSummary = {
  total_sales: '4820.00',
  order_count: 23,
  avg_order: '209.57',
  total_expenses: '1200.00',
}

describe('useDailySummary', () => {
  beforeEach(() => vi.mocked(client.get).mockClear())

  it('calls /reports/daily-summary/ with correct date param', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: mockSummary })
    const { result } = renderHook(() => useDailySummary('2026-04-21'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/reports/daily-summary/', {
      params: { date: '2026-04-21' },
    })
  })

  it('returns summary data on success', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: mockSummary })
    const { result } = renderHook(() => useDailySummary('2026-04-21'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.order_count).toBe(23)
    expect(result.current.data.total_sales).toBe('4820.00')
  })

  it('returns isError=true on fetch failure', async () => {
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useDailySummary('2026-04-21'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
```

- [ ] **Step 1.2 — Run tests to confirm they fail**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/reports.test.jsx 2>&1 | tail -15
```

Expected: FAIL — `Cannot find module '../api/reports'`

- [ ] **Step 1.3 — Implement useDailySummary**

Create `src/api/reports.js`:

```js
import { useQuery } from '@tanstack/react-query'
import client from './client'

export function useDailySummary(date) {
  return useQuery({
    queryKey: ['daily-summary', date],
    queryFn: () =>
      client.get('/reports/daily-summary/', { params: { date } }).then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
```

- [ ] **Step 1.4 — Run tests to confirm they pass**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/reports.test.jsx 2>&1 | tail -15
```

Expected: 3/3 PASS

- [ ] **Step 1.5 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/api/reports.js src/tests/reports.test.jsx && git commit -m "feat: add useDailySummary React Query hook"
```

---

## Task 2: Wire Dashboard.jsx

**Files:**
- Modify: `src/pages/dashboard/Dashboard.jsx`
- Test: `src/tests/Dashboard.test.jsx`

- [ ] **Step 2.1 — Write the failing tests**

Create `src/tests/Dashboard.test.jsx`:

```jsx
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
```

- [ ] **Step 2.2 — Run tests to confirm they fail**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/Dashboard.test.jsx 2>&1 | tail -15
```

Expected: FAIL — Dashboard renders `—` without hook call

- [ ] **Step 2.3 — Implement wired Dashboard**

Replace the entire content of `src/pages/dashboard/Dashboard.jsx`:

```jsx
import { useDailySummary } from '../../api/reports'

function fmtMoney(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  return `₹${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, isLoading, isError, refetch } = useDailySummary(today)

  const cards = [
    { label: 'Total Sales',  value: isLoading ? null : fmtMoney(data?.total_sales) },
    { label: 'Orders',       value: isLoading ? null : (data?.order_count != null ? String(data.order_count) : '—') },
    { label: 'Avg Order',    value: isLoading ? null : fmtMoney(data?.avg_order) },
    { label: 'Expenses',     value: isLoading ? null : fmtMoney(data?.total_expenses) },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {isError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
          <span>Could not load summary</span>
          <button
            onClick={() => refetch()}
            className="underline hover:no-underline font-medium"
          >
            Retry
          </button>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Overview</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500">{label}</p>
            {value === null ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2.4 — Run tests to confirm they pass**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run src/tests/Dashboard.test.jsx 2>&1 | tail -15
```

Expected: 4/4 PASS

- [ ] **Step 2.5 — Run full suite for regressions**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && npx vitest run 2>&1 | tail -10
```

Expected: all tests pass

- [ ] **Step 2.6 — Commit**

```bash
cd "/Users/gauravmishra/Desktop/pulse frontend v1" && git add src/pages/dashboard/Dashboard.jsx src/tests/Dashboard.test.jsx && git commit -m "feat: wire Dashboard KPI cards to live daily-summary API"
```

---

## Self-Review

- [x] Spec coverage: `useDailySummary` ✓, loading skeleton ✓, loaded values ✓, error banner ✓, Retry calls refetch ✓, 60s refetchInterval ✓, `—` on error ✓
- [x] No placeholders
- [x] `fmtMoney` used consistently in Dashboard; `useDailySummary` signature matches across files
