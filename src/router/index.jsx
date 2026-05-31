import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy } from 'react'
import useAuthStore from '../store/authStore'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import AppLayout from '../components/layout/AppLayout'
import Dashboard from '../pages/dashboard/Dashboard'
import POSScreen from '../pages/pos/POSScreen'
import OrderHistory from '../pages/orders/OrderHistory'
import MenuManager from '../pages/menu/MenuManager'
import KitchenDisplay from '../pages/kitchen/KitchenDisplay'

const InventoryList = lazy(() => import('../pages/inventory/InventoryList'))
const ExpenseList = lazy(() => import('../pages/expenses/ExpenseList'))
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken))
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function GuestOnly() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken))
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/kitchen', element: <KitchenDisplay /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/pos', element: <POSScreen /> },
          { path: '/orders', element: <OrderHistory /> },
          { path: '/menu', element: <MenuManager /> },
          { path: '/inventory', element: <InventoryList /> },
          { path: '/expenses', element: <ExpenseList /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
])

export default router
