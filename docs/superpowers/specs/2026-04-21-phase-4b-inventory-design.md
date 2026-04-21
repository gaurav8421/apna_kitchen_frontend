# Phase 4b — Inventory Management
**Design Document** · 2026-04-21

---

## 1. Scope

Build a frontend inventory management UI: list inventory items per branch, see current stock levels (highlighted red when at or below threshold), and adjust stock (add / deduct / adjust) via a modal. Enable the Inventory sidebar link.

Backend API assumed live at `/api/v1/inventory/`.

---

## 2. API Contract

### Inventory Items

```
GET    /api/v1/inventory/                        → list (org+branch scoped)
POST   /api/v1/inventory/                        → create item
PATCH  /api/v1/inventory/:id/                    → update item
DELETE /api/v1/inventory/:id/                    → delete item
```

Item shape:
```json
{
  "id": "uuid",
  "name": "Basmati Rice",
  "unit": "kg",
  "current_stock": "12.50",
  "low_stock_threshold": "5.00",
  "cost_per_unit": "80.00"
}
```

### Stock Transactions

```
POST /api/v1/inventory/transactions/
```

Body:
```json
{
  "item": "uuid",
  "transaction_type": "add",        // "add" | "deduct" | "adjust"
  "quantity": "5.00",
  "notes": "Weekly restock"
}
```

Response: `{ "current_stock": "17.50" }` (updated item stock)

---

## 3. New Files

| File | Purpose |
|------|---------|
| `src/api/inventory.js` | React Query hooks: `useInventoryItems`, `useCreateInventoryItem`, `useUpdateInventoryItem`, `useDeleteInventoryItem`, `useAddStockTransaction` |
| `src/pages/inventory/InventoryList.jsx` | Full inventory page: table + Add Item modal + Adjust Stock modal |
| `src/components/inventory/StockAdjustModal.jsx` | Modal: transaction type, quantity, notes |
| `src/components/inventory/InventoryItemModal.jsx` | Modal: name, unit, low_stock_threshold, cost_per_unit (used for both Add and Edit) |

---

## 4. Modified Files

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.jsx` | Remove `comingSoon` from Inventory nav item |
| `src/router/index.jsx` | Add `/inventory` route → `InventoryList` inside `AppLayout` |

---

## 5. InventoryList Page Layout

```
┌─────────────────────────────────────────────┐
│  Inventory                    [+ Add Item]   │
│                                              │
│  ┌──────┬──────┬──────┬──────┬──────────┐   │
│  │ Name │ Unit │Stock │Thresh│ Cost/Unit│   │
│  ├──────┼──────┼──────┼──────┼──────────┤   │
│  │ Rice │  kg  │ 12.5 │  5   │  ₹80     │[Adjust][Edit][Del]
│  │ Oil  │ litr │  2.0 │  3   │  ₹120    │[Adjust][Edit][Del] ← red row (low stock)
│  └──────┴──────┴──────┴──────┴──────────┘   │
└─────────────────────────────────────────────┘
```

- Rows where `current_stock <= low_stock_threshold` are highlighted with a red left border + red stock value
- Three row actions: **Adjust** (opens StockAdjustModal), **Edit** (opens InventoryItemModal pre-filled), **Delete** (confirm then delete)

---

## 6. StockAdjustModal

Fields:
- **Type**: radio or select — Add / Deduct / Adjust
- **Quantity**: numeric input (positive decimal)
- **Notes**: text input (optional)

On submit: `POST /inventory/transactions/` → invalidate `['inventory']` query → modal closes.

Validation: quantity > 0. Deduct: warn if quantity > current_stock (allow but show warning).

---

## 7. InventoryItemModal

Fields:
- **Name**: text (required)
- **Unit**: text (required) — e.g. kg, litre, piece
- **Low stock threshold**: decimal (required, ≥ 0)
- **Cost per unit**: decimal (required, ≥ 0)

Used for both Add (POST) and Edit (PATCH). `current_stock` is not editable here — only via StockAdjustModal.

---

## 8. Error States

| State | UI |
|-------|----|
| List fetch fails | "Could not load inventory · [Retry]" banner |
| Create/edit fails | Toast error, modal stays open |
| Delete fails | Toast error |
| Stock adjust fails | Toast error, modal stays open |

---

## 9. Out of Scope

- Auto-deduction on order (requires backend webhook/signal — Phase 5)
- Inventory history / audit trail view
- CSV import/export
