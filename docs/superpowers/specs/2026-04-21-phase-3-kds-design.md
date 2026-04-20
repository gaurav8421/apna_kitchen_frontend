# Phase 3 — Kitchen Display System (KDS)
**Design Document** · 2026-04-21

---

## 1. Scope

Build a real-time Kitchen Display System for Pulse. When a cashier places an order via POS, kitchen staff see it instantly on the KDS screen. Kitchen staff advance the order status (pending → preparing → ready → completed) from the KDS. The POS screen and Order History reflect status changes in near-real-time.

This is a frontend-only phase. The Django Channels WebSocket backend is assumed to be live at `ws://<host>/ws/kitchen/<branch_id>/`.

---

## 2. Architecture

### WebSocket Connection

```
WS URL: ws://<VITE_WS_URL>/ws/kitchen/<branch_id>/?token=<accessToken>
```

- Auth is passed as a query param because WebSocket handshake cannot set custom headers.
- `branch_id` comes from `useAuthStore` → `user.branch_id`.
- `VITE_WS_URL` env var defaults to `ws://localhost:8000` if unset.

### Message Protocol (Server → Client)

```json
{ "type": "new_order",     "order": { ...full order object... } }
{ "type": "order_updated", "order": { ...full order object... } }
```

The client never sends messages over WebSocket — status changes go via REST `PATCH /orders/:id/status/`.

### State Ownership

`useKitchenSocket` hook owns a local `orders` array in `useState`. On mount:
1. Fetch active orders (status: pending/preparing/ready) via REST → seed local state.
2. Open WebSocket → `new_order` prepends to list; `order_updated` replaces in-place.

No Zustand store needed — the state is ephemeral and scoped to the KDS page lifetime.

### Reconnection

Exponential backoff: 1s → 2s → 4s → 8s → max 30s. While disconnected, a polling fallback re-fetches active orders every 30s. Connection indicator shows `● Connected` / `○ Reconnecting…`.

---

## 3. New Files

| File | Purpose |
|------|---------|
| `src/hooks/useKitchenSocket.js` | WebSocket lifecycle, reconnect, message dispatch, polling fallback |
| `src/pages/kitchen/KitchenDisplay.jsx` | Full-page KDS — 3-column kanban layout |
| `src/components/kitchen/OrderCard.jsx` | Individual order card: items list + status action button |

---

## 4. Modified Files

| File | Change |
|------|--------|
| `src/router/index.jsx` | Add `/kitchen` route. KDS uses its own bare layout (no Sidebar), so it is placed outside the `AppLayout` children but still inside `RequireAuth`. |
| `src/components/layout/Sidebar.jsx` | Add Kitchen nav item (ChefHat icon). Kitchen role: allowed = `['/kitchen', '/pos']`. All other roles: Kitchen appears as a normal nav link. |
| `src/api/orders.js` | Add `useActiveOrders()` — fetches orders with status in `pending,preparing,ready`, used as the initial seed and polling fallback. |

---

## 5. KDS Layout

Full-screen, no sidebar. Designed for a mounted tablet or wall screen.

```
┌─────────────────────────────────────────────────────────────┐
│  🍳 Kitchen Display        Main Outlet           ● Connected │
├───────────────────┬─────────────────────┬───────────────────┤
│   PENDING  (n)    │   PREPARING  (n)    │    READY  (n)     │
│                   │                     │                   │
│  ┌─────────────┐  │  ┌───────────────┐  │  ┌─────────────┐ │
│  │ ORD-0042    │  │  │  ORD-0040     │  │  │ ORD-0038    │ │
│  │ Dine · T:5  │  │  │  Takeaway     │  │  │ Dine · T:4  │ │
│  │ 5 min ago   │  │  │  8 min ago    │  │  │ 12 min ago  │ │
│  │ ──────────  │  │  │  ──────────   │  │  │ ──────────  │ │
│  │ 2× Biryani  │  │  │  1× Naan      │  │  │ 1× Dal Makh │ │
│  │ 1× Naan     │  │  │  2× Paneer    │  │  │ 2× Naan     │ │
│  │             │  │  │               │  │  │             │ │
│  │ [▶ Start]   │  │  │  [✓ Ready]    │  │  │ [✓ Complete]│ │
│  └─────────────┘  │  └───────────────┘  │  └─────────────┘ │
└───────────────────┴─────────────────────┴───────────────────┘
```

### Column → Status Mapping

| Column | Shows | Button | PATCH target |
|--------|-------|--------|-------------|
| PENDING | `pending` orders | "Start Preparing" | `preparing` |
| PREPARING | `preparing` orders | "Mark Ready" | `ready` |
| READY | `ready` orders | "Complete" | `completed` |

Cancelled orders: shown with a red border + strikethrough text for 10 seconds, then removed from the list.

### Order Card Content

- Order number + order type + table number (if dine-in)
- Age: "X min ago" (re-renders every 60s via `setInterval`)
- Item list: `quantity × item_name` (from `order.items`)
- Single action button (color-coded per status)
- While PATCH is in-flight: button shows spinner, disabled

---

## 6. Routing

KDS is full-screen (no sidebar/topbar). It lives outside `AppLayout` but inside `RequireAuth`:

```jsx
// Outside AppLayout children:
{ path: '/kitchen', element: <KitchenDisplay /> }
```

Role guard: any authenticated user can reach `/kitchen`. The Sidebar controls discoverability by role.

---

## 7. Sidebar Changes

- Add `{ to: '/kitchen', icon: ChefHat, label: 'Kitchen' }` to `navItems`.
- Kitchen role: `allowed = ['/kitchen', '/pos']` (replaces current `['/pos']`).
- All other roles: Kitchen appears as a regular nav link (owners/managers may monitor).

---

## 8. Environment Variable

```
VITE_WS_URL=ws://localhost:8000   # default if not set
```

The WS URL is constructed as:
```js
const base = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const url = `${base}/ws/kitchen/${branchId}/?token=${token}`
```

---

## 9. Error States

| State | UI |
|-------|----|
| No branch_id on user | Banner: "No branch assigned. Contact your manager." |
| WS connecting | `○ Connecting…` in header |
| WS disconnected / reconnecting | `○ Reconnecting…` + polling active |
| REST fetch fails | Toast error, retry button |
| Status PATCH fails | Toast error, button re-enables |

---

## 10. Out of Scope (deferred)

- Sound alerts on new order (Phase 4 or later)
- WS auth on the Django Channels backend (assumed implemented)
- Multiple branch switching on KDS
- Cancelled orders appearing from the server (frontend handles `order_updated` with `cancelled` status)
