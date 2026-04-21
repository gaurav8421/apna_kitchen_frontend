# Phase 4a — Dashboard KPI Cards
**Design Document** · 2026-04-21

---

## 1. Scope

Wire the existing stub Dashboard page to live API data. The four KPI cards (Total Sales, Orders, Avg Order, Expenses) currently show `—`; after this phase they show today's real figures, refreshed every 60 seconds.

---

## 2. What Exists

`src/pages/dashboard/Dashboard.jsx` renders a 2×2 / 4-column card grid with hardcoded `—` values and no API calls. The card structure is already correct — it just needs data.

---

## 3. API Contract

```
GET /api/v1/reports/daily-summary/?date=YYYY-MM-DD
```

Response:
```json
{
  "total_sales": "4820.00",
  "order_count": 23,
  "avg_order": "209.57",
  "total_expenses": "1200.00"
}
```

`date` defaults to today if omitted. All money fields are decimal strings.

---

## 4. New Files

| File | Purpose |
|------|---------|
| `src/api/reports.js` | `useDailySummary(date)` — React Query hook |

---

## 5. Modified Files

| File | Change |
|------|--------|
| `src/pages/dashboard/Dashboard.jsx` | Replace static card data with live hook data; add loading skeleton + error state |

---

## 6. useDailySummary Hook

```js
// src/api/reports.js
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

`date` is passed as `YYYY-MM-DD`. The Dashboard calls it with today's date formatted via `new Date().toISOString().slice(0, 10)`.

---

## 7. Dashboard UI

### Loading state
Each card shows a `animate-pulse` gray rectangle in place of the value.

### Loaded state

| Card | Field | Format |
|------|-------|--------|
| Total Sales | `total_sales` | `₹{n}` (toLocaleString, 2 dp) |
| Orders | `order_count` | integer |
| Avg Order | `avg_order` | `₹{n}` (toLocaleString, 2 dp) |
| Expenses | `total_expenses` | `₹{n}` (toLocaleString, 2 dp) |

### Error state
Cards show `—` value. A small error banner above the grid: "Could not load summary · [Retry]". Retry calls `refetch()`.

---

## 8. Out of Scope

- Charts (Phase 5 — Reports)
- Branch selector on dashboard
- Date picker (always today for Phase 4)
- Trend indicators / sparklines
