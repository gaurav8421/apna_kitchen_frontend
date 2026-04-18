# Pulse — Restaurant SaaS Platform
**Design Document** · 2026-04-19

---

## 1. What We're Building

Pulse is a multi-tenant Restaurant ERP + POS SaaS platform. Restaurant owners sign up, add their branches, and get a complete operating system: billing, kitchen display, inventory, expenses, and reports — all in one place.

Target market: Indian restaurants and cloud kitchens.

---

## 2. Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| Multi-tenancy | Shared DB + shared schema (`organization_id` on every table) | Simplest for MVP, cheap to operate, easy to scale |
| Auth | JWT + refresh tokens | Stateless, works for web + tablet |
| Realtime | Django Channels (WebSocket) | Kitchen display needs instant order updates |
| State (frontend) | Zustand + React Query | Zustand for UI state, React Query for server state |
| Payments (India) | Razorpay | Subscriptions + UPI + card in one SDK |
| DB | PostgreSQL with UUID PKs | UUID avoids tenant data leaks via sequential IDs |
| Cache / WS Layer | Redis | Required by Django Channels |
| File storage | AWS S3 (configurable) | Invoice PDFs, menu images |
| CSS | Tailwind CSS | Fast UI, tablet-friendly |

---

## 3. Subscription Tiers

| Tier | Branches | Features | Target |
|---|---|---|---|
| **Starter** | 1 | POS + basic reports | Small single-outlet |
| **Pro** | Up to 5 | + KDS + inventory + advanced reports | Growing chain |
| **Enterprise** | Unlimited | + API access + custom branding + priority support | Large chains |

---

## 4. User Roles

```
Super Admin (Pulse team)
└── Org Owner         ← restaurant business owner
    └── Manager       ← branch manager
        ├── Cashier   ← handles billing / POS
        └── Kitchen   ← sees KDS only, marks orders ready
```

Each user belongs to one `organization` and optionally one `branch`. Super Admin can access all orgs.

---

## 5. Database Schema

### Core / Tenancy

```
organizations
  id (uuid), name, slug, logo_url, phone, email,
  gstin, address, created_at

subscription_plans
  id, name (Starter/Pro/Enterprise), price_monthly, price_yearly,
  max_branches, features (jsonb)

organization_subscriptions
  id, org_id → organizations, plan_id → subscription_plans,
  status (trial/active/expired), trial_ends_at, current_period_end,
  razorpay_subscription_id
```

### Auth

```
users
  id (uuid), org_id → organizations, branch_id → branches (nullable),
  name, email, phone, password_hash,
  role (super_admin/owner/manager/cashier/kitchen),
  is_active, created_at
```

### Branches

```
branches
  id (uuid), org_id, name, address, phone,
  gstin, tax_rate (decimal), currency (default INR),
  is_active, created_at
```

### Menu

```
menu_categories
  id (uuid), org_id, branch_id (nullable — null = all branches),
  name, sort_order, is_active

menu_items
  id (uuid), org_id, category_id → menu_categories,
  name, description, price (decimal), image_url,
  item_type (veg/non_veg/egg), is_available,
  track_inventory (bool), created_at

item_variants
  id (uuid), item_id → menu_items,
  name (e.g. Small/Large), price_delta (decimal)

item_modifiers
  id (uuid), item_id → menu_items,
  name (e.g. Extra Cheese), price (decimal)
```

### Orders & POS

```
orders
  id (uuid), org_id, branch_id,
  order_number (human-readable, e.g. ORD-0042),
  order_type (dine_in/takeaway/delivery/online),
  table_number (nullable), customer_name, customer_phone,
  status (pending/preparing/ready/completed/cancelled),
  subtotal, discount, tax, total,
  created_by → users, created_at, updated_at

order_items
  id (uuid), order_id → orders, item_id → menu_items,
  item_name (snapshot), variant_name (snapshot), unit_price,
  quantity, modifiers (jsonb), notes, subtotal

payments
  id (uuid), org_id, order_id → orders (nullable),
  amount, method (cash/upi/card/online),
  reference_id (UPI/card ref), status (pending/completed/failed/refunded),
  razorpay_payment_id, created_at
```

### Inventory

```
inventory_items
  id (uuid), org_id, branch_id,
  name, unit (kg/litre/piece/etc), current_stock (decimal),
  low_stock_threshold, cost_per_unit, created_at

stock_transactions
  id (uuid), org_id, branch_id, item_id → inventory_items,
  transaction_type (add/deduct/adjust),
  quantity, notes, order_id (nullable), created_by, created_at

menu_item_ingredients (links menu items to inventory)
  id (uuid), menu_item_id, inventory_item_id,
  quantity_used (decimal)
```

### Expenses

```
expense_categories
  id (uuid), org_id, name (Rent/Salary/Supplies/etc)

expenses
  id (uuid), org_id, branch_id, category_id,
  amount, description, vendor_name,
  expense_date, receipt_url, created_by, created_at

vendors
  id (uuid), org_id,
  name, phone, email, gstin, address
```

### Reports (derived — no separate tables, queried from above)

---

## 6. API Structure (Django REST Framework)

```
/api/v1/

auth/
  POST  /register/          ← org signup
  POST  /login/
  POST  /token/refresh/
  POST  /logout/

organizations/
  GET   /me/                ← current org details
  PATCH /me/

subscription/
  GET   /plans/
  POST  /subscribe/
  GET   /current/

branches/
  GET   /
  POST  /
  GET   /:id/
  PATCH /:id/

users/
  GET   /
  POST  /
  PATCH /:id/
  DELETE /:id/

menu/
  categories/  GET POST PATCH/:id DELETE/:id
  items/       GET POST PATCH/:id DELETE/:id
  items/:id/variants/
  items/:id/modifiers/

orders/
  GET   /                   ← list (filter by branch, date, status)
  POST  /                   ← create order (POS)
  GET   /:id/
  PATCH /:id/status/        ← update status (KDS)
  POST  /:id/pay/           ← attach payment

payments/
  GET   /
  POST  /                   ← record manual payment

inventory/
  GET   /
  POST  /
  PATCH /:id/
  POST  /transactions/      ← add/adjust stock

expenses/
  GET   /
  POST  /
  PATCH /:id/
  DELETE /:id/
  categories/  GET POST

vendors/  GET POST PATCH/:id

reports/
  GET   /daily-summary/     ?branch_id=&date=
  GET   /sales/             ?from=&to=&branch_id=
  GET   /payment-breakdown/ ?from=&to=
  GET   /expense-summary/   ?from=&to=
  GET   /profit-loss/       ?from=&to=
  GET   /export/            ?type=sales&format=pdf|excel

ws/
  ws://host/ws/kitchen/:branch_id/   ← KDS WebSocket
```

---

## 7. WebSocket Flow (KDS)

```
Cashier creates order (POST /api/v1/orders/)
         ↓
Django saves order to DB
         ↓
Django Channels sends event to group "kitchen_<branch_id>"
         ↓
Kitchen screen (connected to ws/kitchen/<branch_id>/)
receives { type: "new_order", order: {...} } instantly
         ↓
Chef marks order ready → PATCH /orders/:id/status/ → broadcasts
{ type: "order_ready" } back to POS screen
```

---

## 8. Frontend Structure (React + Vite)

```
src/
├── main.jsx
├── App.jsx
├── router/
│   └── index.jsx               ← React Router v6 with role guards
│
├── store/                      ← Zustand stores
│   ├── authStore.js
│   ├── cartStore.js            ← active POS order
│   └── branchStore.js
│
├── api/                        ← React Query hooks + axios
│   ├── client.js               ← axios instance (JWT interceptor)
│   ├── auth.js
│   ├── orders.js
│   ├── menu.js
│   ├── reports.js
│   └── ...
│
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx        ← org signup + onboarding wizard
│   │   └── Onboarding.jsx
│   │
│   ├── dashboard/
│   │   └── Dashboard.jsx       ← KPI cards + quick charts
│   │
│   ├── pos/
│   │   ├── POSScreen.jsx       ← main billing UI (tablet)
│   │   ├── MenuGrid.jsx
│   │   ├── CartPanel.jsx
│   │   └── PaymentModal.jsx
│   │
│   ├── kitchen/
│   │   └── KitchenDisplay.jsx  ← KDS (WebSocket)
│   │
│   ├── orders/
│   │   └── OrderHistory.jsx
│   │
│   ├── menu/
│   │   ├── MenuManager.jsx
│   │   ├── CategoryList.jsx
│   │   └── ItemForm.jsx
│   │
│   ├── inventory/
│   │   ├── InventoryList.jsx
│   │   └── StockAdjust.jsx
│   │
│   ├── expenses/
│   │   ├── ExpenseList.jsx
│   │   └── ExpenseForm.jsx
│   │
│   ├── reports/
│   │   ├── DailySummary.jsx
│   │   ├── SalesReport.jsx
│   │   ├── ProfitLoss.jsx
│   │   └── PaymentBreakdown.jsx
│   │
│   └── settings/
│       ├── OrgSettings.jsx
│       ├── BranchSettings.jsx
│       ├── UserManagement.jsx
│       └── Subscription.jsx
│
└── components/
    ├── ui/                     ← Button, Input, Modal, Table, Badge
    ├── layout/                 ← Sidebar, TopBar, PageWrapper
    ├── pos/                    ← ItemCard, CartItem, NumPad
    ├── kitchen/                ← OrderCard, StatusBadge
    └── charts/                 ← SalesChart, PaymentPieChart
```

---

## 9. POS UI Design (Most Important)

The POS screen is split into 2 panels:

```
┌─────────────────────────────┬──────────────────────┐
│  LEFT: Menu Grid             │  RIGHT: Cart Panel    │
│                              │                       │
│  [Search bar]                │  Table: 4 | Dine-in   │
│                              │  ─────────────────    │
│  [Cat1] [Cat2] [Cat3] ...    │  Butter Chicken  x2   │
│                              │  Naan             x3  │
│  ┌──────┐ ┌──────┐          │  ─────────────────    │
│  │Item 1│ │Item 2│          │  Subtotal    ₹480     │
│  │ ₹120 │ │ ₹85  │          │  GST (5%)    ₹24      │
│  └──────┘ └──────┘          │  ─────────────────    │
│                              │  TOTAL       ₹504     │
│  [+ New Order] [Hold]        │                       │
│                              │  [💵 Cash] [📱 UPI]   │
│                              │  [💳 Card] [🔄 Split] │
│                              │                       │
│                              │  [PLACE ORDER]        │
└─────────────────────────────┴──────────────────────┘
```

Key rules:
- Max 2 clicks to add any item to cart
- Large touch targets (min 48px) for tablet use
- Category tabs across top of menu grid
- Cart updates instantly (Zustand, no API call until "Place Order")
- Keyboard shortcut: Enter = Place Order, Escape = Clear cart

---

## 10. Django Project Structure

```
pulse_backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py             ← Django Channels entry
│   └── wsgi.py
│
├── apps/
│   ├── core/               ← BaseModel (uuid pk, org_id, timestamps)
│   ├── accounts/           ← User, JWT auth, role permissions
│   ├── organizations/      ← Organization model + onboarding
│   ├── subscriptions/      ← Plans, org subscriptions, Razorpay webhooks
│   ├── branches/           ← Branch CRUD
│   ├── menu/               ← Category, Item, Variant, Modifier
│   ├── orders/             ← Order, OrderItem, order status machine
│   ├── payments/           ← Payment recording + Razorpay
│   ├── kitchen/            ← WebSocket consumer (KDS)
│   ├── inventory/          ← InventoryItem, StockTransaction
│   ├── expenses/           ← Expense, ExpenseCategory, Vendor
│   └── reports/            ← Aggregation views + export (PDF/Excel)
│
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
│
└── manage.py
```

**Key packages:**
```
djangorestframework
djangorestframework-simplejwt
django-channels
channels-redis
django-cors-headers
psycopg2-binary
razorpay
weasyprint          ← PDF export
openpyxl            ← Excel export
celery + redis      ← background jobs (email, reports)
django-filter
drf-spectacular     ← auto API docs (Swagger)
```

---

## 11. Build Order

### Phase 1 — Foundation
1. Django project setup (settings, Docker, PostgreSQL, Redis)
2. BaseModel (uuid, org_id, timestamps)
3. Auth (register org, login, JWT, role middleware)
4. Organization + Branch CRUD
5. React app setup (Vite, Tailwind, Router, Zustand, React Query)
6. Auth pages (login, register, onboarding wizard)
7. Layout (sidebar, protected routes by role)

### Phase 2 — Core POS
8. Menu management (backend + frontend CRUD)
9. POS screen (menu grid + cart)
10. Order creation API
11. Payment recording
12. Order history

### Phase 3 — Kitchen
13. Django Channels WebSocket setup
14. KDS screen (real-time order cards)
15. Order status updates

### Phase 4 — Operations
16. Inventory tracking + auto-deduction on order
17. Expense management + vendors
18. Dashboard KPI cards

### Phase 5 — Reports & Subscriptions
19. Report APIs (daily summary, sales, P&L)
20. PDF + Excel export
21. Subscription plans + Razorpay integration
22. Super admin panel

---

## 12. Key Design Principles

- Every API response includes only data for the request's `organization` (enforced in base queryset)
- `organization_id` is injected from JWT token — never trusted from request body
- POS screen works offline-first (cart lives in Zustand, syncs on "Place Order")
- All money stored as `decimal(10,2)` (Django `DecimalField`) — never float
- Order numbers are human-readable (`ORD-0042`) per branch, not UUIDs
- Reports are always real-time queries (no pre-aggregated tables at MVP stage)
