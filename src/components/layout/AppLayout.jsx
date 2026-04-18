import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const titles = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/orders': 'Orders',
  '/menu': 'Menu',
  '/inventory': 'Inventory',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Pulse'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
