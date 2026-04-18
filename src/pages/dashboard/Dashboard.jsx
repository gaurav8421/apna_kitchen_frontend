export default function Dashboard() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Overview</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales', value: '—' },
          { label: 'Orders', value: '—' },
          { label: 'Avg Order', value: '—' },
          { label: 'Expenses', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
