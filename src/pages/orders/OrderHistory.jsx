import { useState } from 'react'
import { useOrders } from '../../api/orders'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const ORDER_TYPE_LABELS = {
  dine_in: 'Dine In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
  online: 'Online',
}

export default function OrderHistory() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: orders = [], isLoading } = useOrders(statusFilter ? { status: statusFilter } : {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm text-center mt-12">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400 text-sm text-center mt-12">No orders found</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Table</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{order.order_number}</td>
                  <td className="px-4 py-3 text-gray-600">{ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}</td>
                  <td className="px-4 py-3 text-gray-500">{order.table_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{order.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">₹{order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
