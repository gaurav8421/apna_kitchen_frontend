import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import AppLayout from '../components/layout/AppLayout'
import Dashboard from '../pages/dashboard/Dashboard'
import POSScreen from '../pages/pos/POSScreen'

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
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/pos', element: <POSScreen /> },
          { path: '/', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
])

export default router
