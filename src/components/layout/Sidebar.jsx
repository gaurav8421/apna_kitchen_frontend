import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed,
  Package, Receipt, BarChart2, Settings, LogOut
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useLogout } from '../../api/auth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'POS' },
  { to: '/orders', icon: Receipt, label: 'Orders' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const roleNav = {
  kitchen: ['/pos'],
  cashier: ['/pos', '/orders', '/dashboard'],
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()

  const allowed = roleNav[user?.role]
  const items = allowed
    ? navItems.filter((i) => allowed.includes(i.to))
    : navItems

  return (
    <aside className="w-56 bg-gray-900 flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-lg">Pulse</span>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{user?.org_name}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
               ${isActive
                 ? 'bg-brand-600 text-white'
                 : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => logout(undefined, { onSettled: () => navigate('/login') })}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
