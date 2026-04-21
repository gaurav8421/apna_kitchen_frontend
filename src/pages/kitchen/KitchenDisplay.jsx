import { useKitchenSocket } from '../../hooks/useKitchenSocket'
import OrderCard from '../../components/kitchen/OrderCard'

const COLUMNS = [
  { status: 'pending',   label: 'PENDING',   header: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { status: 'preparing', label: 'PREPARING', header: 'bg-blue-50 border-blue-200 text-blue-800' },
  { status: 'ready',     label: 'READY',     header: 'bg-green-50 border-green-200 text-green-800' },
]

export default function KitchenDisplay() {
  const { orders, connected, connecting, noBranch, updateOrderLocally } = useKitchenSocket()

  if (noBranch) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <p className="text-white text-lg">No branch assigned. Contact your manager.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <h1 className="font-bold text-base">Kitchen Display</h1>
        <span
          className={`text-sm flex items-center gap-2 ${connected ? 'text-green-400' : 'text-yellow-400'}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'}`}
          />
          {connected ? 'Connected' : connecting ? 'Connecting…' : 'Reconnecting…'}
        </span>
      </header>

      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {COLUMNS.map(({ status, label, header }) => {
          const col = orders.filter(
            (o) =>
              o.status === status ||
              (status === 'pending' && o.status === 'cancelled')
          )
          const count = orders.filter((o) => o.status === status).length

          return (
            <div key={status} className="flex flex-col gap-3 min-h-0">
              <div className={`rounded-lg border px-3 py-2 shrink-0 ${header}`}>
                <span className="text-xs font-bold tracking-widest">
                  {label} ({count})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {col.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusUpdate={updateOrderLocally}
                  />
                ))}
                {count === 0 && (
                  <p className="text-center text-gray-600 text-sm mt-8">No orders</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
