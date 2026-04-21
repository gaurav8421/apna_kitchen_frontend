# Pulse — Build Progress

## Phase 1: Foundation ✅ COMPLETE

**Backend**
- Multi-tenant Django 5 + DRF project scaffold (`config/`, `apps/`)
- JWT auth (`djangorestframework-simplejwt`) — login, register, logout, token refresh
- `apps/accounts` — custom User model (email login, roles: owner/manager/cashier/kitchen)
- `apps/organizations` — Organization model with slug
- `apps/branches` — Branch model with tax_rate, currency, gstin
- All querysets org-scoped via `getattr(user, 'organization', None)` guard
- Auth response includes: `id`, `name`, `email`, `role`, `org_id`, `org_name`, `branch_id`

**Frontend**
- React 19 + Vite + Tailwind CSS v3 scaffold
- Zustand auth store (persisted: `user`, `accessToken`, `refreshToken`)
- Axios client with JWT attach + auto-refresh interceptor
- Login + Register pages
- AppLayout with Sidebar + protected routes (`RequireAuth`, `GuestOnly`)
- Dashboard page (stub)
- Routes: `/login`, `/register`, `/dashboard`

---

## Phase 2: Menu + POS + Orders ✅ COMPLETE

**Backend** — 34/34 tests passing

| App | What's built |
|-----|-------------|
| `apps/menu` | MenuCategory, MenuItem, ItemVariant, ItemModifier models; full CRUD API; nested routers for variants/modifiers; org-scoped querysets; cross-org FK validation in serializers; `category_name` on MenuItem serializer |
| `apps/orders` | Order + OrderItem models; race-safe sequential order numbers per branch (`ORD-0001`) with `select_for_update` + `UniqueConstraint` backstop; order create + list + status-update endpoints; cross-org branch validation |
| `apps/payments` | Payment model (immutable); payment recording endpoint (status forced to `completed` server-side); DELETE explicitly blocked |

**Frontend** — build clean

| File | What's built |
|------|-------------|
| `src/store/cartStore.js` | Zustand in-memory cart: items, order meta, `addItem`, `removeItem`, `updateQuantity`, `setOrderMeta`, `clearCart`, `subtotal()`, `tax(rate)`, `total(rate)` |
| `src/api/menu.js` | `useCategories`, `useMenuItems`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`, `useCreateMenuItem`, `useUpdateMenuItem`, `useDeleteMenuItem` |
| `src/api/orders.js` | `useOrders`, `useCreateOrder`, `useUpdateOrderStatus`, `useRecordPayment` |
| `src/components/pos/ItemCard.jsx` | Veg/non-veg/egg indicator, category badge, name, price tile |
| `src/components/pos/CartItem.jsx` | Cart row with qty inc/dec and remove |
| `src/pages/pos/POSScreen.jsx` | Two-panel POS layout; Enter=pay, Escape=confirm-clear keyboard shortcuts |
| `src/pages/pos/MenuGrid.jsx` | Search input + category tabs + responsive item grid |
| `src/pages/pos/CartPanel.jsx` | Order type tabs, table number input, cart list, totals footer, Pay button |
| `src/pages/pos/PaymentModal.jsx` | Cash/UPI/Card selection, reference ID, place order → record payment flow |
| `src/pages/orders/OrderHistory.jsx` | Order table with status filter dropdown and coloured badges |
| `src/pages/menu/MenuManager.jsx` | Category sidebar CRUD + item table CRUD with modals |

**Routes added:** `/pos`, `/orders`, `/menu`

**Known limitations / deferred to later phase:**
- `Branch.tax_rate` is hardcoded to `5%` on the frontend — not yet fetched dynamically
- `MenuItem` has no branch FK — menu items are org-wide, not branch-specific (categories can be branch-scoped)
- Inventory, Reports, Settings nav links show as disabled ("coming soon")

---

## Phase 3: Kitchen Display System (KDS) ✅ COMPLETE

**Frontend** — 46 tests passing, build clean

| File | What's built |
|------|-------------|
| `src/hooks/useKitchenSocket.js` | WebSocket connection to `ws://<host>/ws/kitchen/<branch_id>/?token=`; exponential-backoff reconnect (1s→2s→4s→cap 30s); REST seed on mount; 30s polling fallback while disconnected; `cancelled` guard prevents ghost timer leaks; `JSON.parse` wrapped in try/catch; new_order dedup by id; exposes `orders`, `connected`, `connecting`, `noBranch`, `updateOrderLocally` |
| `src/components/kitchen/OrderCard.jsx` | Order card with items list, age ticker (60s), per-status action button (Start Preparing / Mark Ready / Complete); `aria-label` on button; cancelled orders show strikethrough + Cancelled label + auto-dismiss after 10s |
| `src/pages/kitchen/KitchenDisplay.jsx` | Full-screen 3-column kanban (PENDING / PREPARING / READY); WS connection status indicator; cancelled orders appear in PENDING column; "No orders" placeholder only when column is truly empty |

**Routes added:** `/kitchen` (inside `RequireAuth`, outside `AppLayout` — full-screen, no sidebar)

**Sidebar changes:** `ChefHat` icon added; Kitchen role now sees `[Kitchen, POS]`; all other roles see Kitchen as a regular nav link

**Known limitations / deferred:**
- WS auth on Django Channels backend assumed live at `ws://<host>/ws/kitchen/<branch_id>/?token=`
- Sound/vibration alerts on new order (Phase 4)
- Role guard on `/kitchen` route (any authenticated user can navigate directly)
- Branch switching on KDS screen

---

## Phase 4: Operations ✅ COMPLETE

**Frontend** — 84 tests passing, build clean

| File | What's built |
|------|-------------|
| `src/api/reports.js` | `useDailySummary(date)` — React Query hook; staleTime + refetchInterval 60s |
| `src/pages/dashboard/Dashboard.jsx` | KPI cards wired to live `/reports/daily-summary/` API; pulse skeleton loading; error banner + Retry; jsdom-safe money formatting |
| `src/api/inventory.js` | `useInventoryItems`, `useCreateInventoryItem`, `useUpdateInventoryItem`, `useDeleteInventoryItem`, `useAddStockTransaction` |
| `src/components/inventory/InventoryItemModal.jsx` | Add/Edit item modal (name, unit, low_stock_threshold, cost_per_unit); empty-string validation guards |
| `src/components/inventory/StockAdjustModal.jsx` | Stock transaction modal (add/deduct/adjust); deduct-over-stock warning |
| `src/pages/inventory/InventoryList.jsx` | Full inventory page; red left border + red stock value on low stock (`current_stock ≤ low_stock_threshold`); Adjust/Edit/Delete row actions; toast on mutation errors |
| `src/api/expenses.js` | `useExpenses` (with category/from/to filter params), `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`, `useExpenseCategories`, `useCreateExpenseCategory` |
| `src/components/expenses/ExpenseFormModal.jsx` | Add/Edit expense modal; inline "＋ New category" creation via `__new__` sentinel; date defaults to today |
| `src/pages/expenses/ExpenseList.jsx` | Full expense page; category + date range filter bar; client-side total (all shown expenses); toast on mutation errors |

**Routes added:** `/inventory`, `/expenses`

**Sidebar changes:** Inventory `comingSoon` removed (live link); `Wallet` icon + Expenses added between Inventory and Reports

**Known limitations / deferred to later phase:**
- Inventory auto-deduction on order (requires backend signal — Phase 5)
- Inventory history / audit trail
- Vendor CRUD with phone/email/gstin (Phase 5)
- CSV export (Phase 5 — Reports)
- Recurring expenses

---

## Key Architecture Decisions (don't change without reason)

- **org-scoping** — every queryset filters by `request.user.organization`; returns `.none()` when user has no org
- **`organization` injected in `perform_create`** — never accepted from request body
- **Cart is Zustand only** — no API call until "Place Order" is pressed
- **Decimal fields** — all money is `DecimalField(max_digits=10, decimal_places=2)`, never float
- **Order numbers** — sequential per branch (`ORD-0001`), race-safe with `select_for_update` inside `transaction.atomic`
- **Payment immutability** — no PATCH/PUT/DELETE on payments; status forced to `completed` server-side
- **JWT payload** — includes `role`, `org_id`, `name` in token claims
