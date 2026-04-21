# Phase 4c — Expense Management
**Design Document** · 2026-04-21

---

## 1. Scope

Build a frontend expense management UI: list expenses with category and date filters, add/edit/delete expenses, manage expense categories. Add an Expenses nav link to the sidebar.

Vendors are out of scope for this phase (free-text vendor name field is sufficient for MVP).

Backend API assumed live at `/api/v1/expenses/`.

---

## 2. API Contract

### Expenses

```
GET    /api/v1/expenses/           ?category=&from=&to=   → list
POST   /api/v1/expenses/                                   → create
PATCH  /api/v1/expenses/:id/                               → update
DELETE /api/v1/expenses/:id/                               → delete
```

Expense shape:
```json
{
  "id": "uuid",
  "amount": "1200.00",
  "description": "Monthly gas cylinder",
  "vendor_name": "Bharat Gas",
  "expense_date": "2026-04-21",
  "category": { "id": "uuid", "name": "Utilities" },
  "created_at": "2026-04-21T10:30:00Z"
}
```

### Expense Categories

```
GET    /api/v1/expenses/categories/   → list
POST   /api/v1/expenses/categories/   → create
```

Category shape: `{ "id": "uuid", "name": "Utilities" }`

---

## 3. New Files

| File | Purpose |
|------|---------|
| `src/api/expenses.js` | React Query hooks: `useExpenses`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`, `useExpenseCategories`, `useCreateExpenseCategory` |
| `src/pages/expenses/ExpenseList.jsx` | Full expense page: filter bar + table + Add/Edit modal |
| `src/components/expenses/ExpenseFormModal.jsx` | Modal: amount, category, vendor_name, expense_date, description |

---

## 4. Modified Files

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.jsx` | Add `Wallet` icon + Expenses nav item (between Inventory and Reports); remove `comingSoon` from Inventory |
| `src/router/index.jsx` | Add `/expenses` route → `ExpenseList` inside `AppLayout` |

---

## 5. ExpenseList Page Layout

```
┌───────────────────────────────────────────────────┐
│  Expenses                          [+ Add Expense] │
│                                                    │
│  [Category ▾]  [From: ____]  [To: ____]   [Reset] │
│                                                    │
│  ┌──────────┬──────────┬────────┬────────┬──────┐  │
│  │ Date     │ Category │ Vendor │ Amount │      │  │
│  ├──────────┼──────────┼────────┼────────┼──────┤  │
│  │ 21 Apr   │ Supplies │ Metro  │ ₹1,200 │[Edit][Del]
│  │ 20 Apr   │ Salary   │ Staff  │ ₹8,000 │[Edit][Del]
│  └──────────┴──────────┴────────┴────────┴──────┘  │
│                                                    │
│  Total shown: ₹9,200                               │
└───────────────────────────────────────────────────┘
```

- Category filter: dropdown populated from `useExpenseCategories`
- Date range: from/to date inputs (native `<input type="date">`)
- Total shown: sum of the current filtered list (client-side, no separate API call)
- Row actions: **Edit** (opens modal pre-filled), **Delete** (confirm then delete)

---

## 6. ExpenseFormModal

Fields:
- **Amount**: decimal input (required, > 0)
- **Category**: dropdown from categories list + inline "＋ New category" option that opens a simple name prompt
- **Vendor name**: text input (optional, free-text)
- **Date**: date input (required, defaults to today)
- **Description**: text input (optional)

On submit: POST or PATCH → invalidate `['expenses']` query → modal closes.

---

## 7. Error States

| State | UI |
|-------|----|
| List fetch fails | "Could not load expenses · [Retry]" banner |
| Create/edit fails | Toast error, modal stays open |
| Delete fails | Toast error |
| Category create fails | Toast error |

---

## 8. Out of Scope

- Vendor CRUD (full vendor management with phone/email/gstin) — Phase 5
- Receipt image upload
- CSV export (Phase 5 — Reports)
- Recurring expenses
