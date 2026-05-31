import useAuthStore from '../../store/authStore'

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  kitchen: 'Kitchen Staff',
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  const fields = [
    { label: 'Name',         value: user?.name },
    { label: 'Email',        value: user?.email },
    { label: 'Role',         value: ROLE_LABELS[user?.role] ?? user?.role },
    { label: 'Organisation', value: user?.org_name },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Account</h2>
        </div>
        <dl className="divide-y divide-gray-100">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex items-center px-5 py-4">
              <dt className="w-36 text-sm text-gray-500 shrink-0">{label}</dt>
              <dd className="text-sm font-medium text-gray-900">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        To update account details, contact your administrator.
      </p>
    </div>
  )
}
