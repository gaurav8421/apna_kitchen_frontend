import { useState, useEffect } from 'react'
import { useUpdateOrderStatus } from '../../api/orders'

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'completed' }

const ACTION_LABEL = {
  pending: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Complete',
}

const ACTION_COLOR = {
  pending: 'bg-blue-500 hover:bg-blue-600 text-white',
  preparing: 'bg-green-500 hover:bg-green-600 text-white',
  ready: 'bg-gray-500 hover:bg-gray-600 text-white',
}

const CARD_BORDER = {
  pending: 'border-yellow-300',
  preparing: 'border-blue-300',
  ready: 'border-green-400',
  cancelled: 'border-red-300',
}

const TYPE_LABEL = {
  dine_in: 'Dine-In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
  online: 'Online',
}

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60_000)
  return mins < 1 ? 'just now' : `${mins} min ago`
}

export default function OrderCard({ order, onStatusUpdate }) {
  const [, setTick] = useState(0)
  const [hidden, setHidden] = useState(false)
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus()

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (order.status === 'cancelled') {
      const t = setTimeout(() => setHidden(true), 10_000)
      return () => clearTimeout(t)
    }
  }, [order.status])

  if (hidden) return null

  const isCancelled = order.status === 'cancelled'
  const nextStatus = NEXT_STATUS[order.status]

  const handleAction = () => {
    updateStatus(
      { id: order.id, status: nextStatus },
      { onSuccess: () => onStatusUpdate(order.id, nextStatus) }
    )
  }

  return (
    <div
      className={`bg-white rounded-xl border-2 ${CARD_BORDER[order.status] ?? 'border-gray-200'} p-4 space-y-3 shadow-sm ${isCancelled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
        <span className="text-xs text-gray-400">
          {order.created_at ? timeAgo(order.created_at) : ''}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        {TYPE_LABEL[order.order_type] ?? order.order_type}
        {order.table_number ? ` · T:${order.table_number}` : ''}
      </p>

      <div className="border-t border-gray-100 pt-2 space-y-1">
        {(order.items ?? []).map((item, i) => (
          <p
            key={i}
            className={`text-sm text-gray-700 ${isCancelled ? 'line-through' : ''}`}
          >
            {item.quantity}× {item.item_name}
          </p>
        ))}
      </div>

      {!isCancelled && nextStatus && (
        <button
          onClick={handleAction}
          disabled={isPending}
          className={`w-full py-2 rounded-lg text-sm font-medium transition ${ACTION_COLOR[order.status]} disabled:opacity-50`}
        >
          {isPending ? 'Updating…' : ACTION_LABEL[order.status]}
        </button>
      )}

      {isCancelled && (
        <p className="text-xs text-red-500 font-medium text-center">Cancelled</p>
      )}
    </div>
  )
}
