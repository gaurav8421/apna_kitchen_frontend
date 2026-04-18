import useAuthStore from '../../store/authStore'

export default function TopBar({ title }) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-semibold">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="text-xs">
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p className="text-gray-400 capitalize">{user?.role}</p>
        </div>
      </div>
    </header>
  )
}
