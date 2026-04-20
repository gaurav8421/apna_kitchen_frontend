import { useState } from 'react'
import { X } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useCreateOrder, useRecordPayment } from '../../api/orders'

const METHODS = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'upi', label: '📱 UPI' },
  { value: 'card', label: '💳 Card' },
]

export default function PaymentModal({ onClose, taxRate = 5 }) {
  const [method, setMethod] = useState('cash')
  const [referenceId, setReferenceId] = useState('')
  const cartItems = useCartStore((s) => s.items)
  const orderType = useCartStore((s) => s.orderType)
  const tableNumber = useCartStore((s) => s.tableNumber)
  const customerName = useCartStore((s) => s.customerName)
  const customerPhone = useCartStore((s) => s.customerPhone)
  const discount = useCartStore((s) => s.discount)
  const subtotal = useCartStore((s) => s.subtotal)
  const tax = useCartStore((s) => s.tax)
  const total = useCartStore((s) => s.total)
  const clearCart = useCartStore((s) => s.clearCart)
  const activeBranchId = useAuthStore((s) => s.user?.branch_id)

  const createOrder = useCreateOrder()
  const recordPayment = useRecordPayment()

  const handlePlaceOrder = async () => {
    try {
      const sub = subtotal()
      const t = tax(taxRate)
      const tot = total(taxRate)
      const branch = activeBranchId

      const orderPayload = {
        branch,
        order_type: orderType,
        table_number: tableNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        subtotal: sub.toFixed(2),
        discount: Number(discount).toFixed(2),
        tax: t.toFixed(2),
        total: tot.toFixed(2),
        items: cartItems.map((i) => ({
          item: i.id,
          item_name: i.name,
          variant_name: i.variantName,
          unit_price: i.unitPrice.toFixed(2),
          quantity: i.quantity,
          modifiers: i.modifiers,
          subtotal: (i.unitPrice * i.quantity).toFixed(2),
        })),
      }

      const order = await createOrder.mutateAsync(orderPayload)
      await recordPayment.mutateAsync({
        order: order.id,
        amount: tot.toFixed(2),
        method,
        reference_id: referenceId,
      })

      clearCart()
      onClose()
    } catch {
      // errors surfaced via isError state
    }
  }

  const isPending = createOrder.isPending || recordPayment.isPending
  const sub = subtotal()
  const t = tax(taxRate)
  const tot = total(taxRate)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Payment</h2>
          <button onClick={onClose} disabled={isPending} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 mb-5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>₹{sub.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST ({taxRate}%)</span><span>₹{t.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
            <span>Total</span><span>₹{tot.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-2">Payment method</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`py-2 rounded-lg text-sm font-medium border transition ${
                method === m.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {(method === 'upi' || method === 'card') && (
          <input
            type="text"
            placeholder="Reference / Transaction ID"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}

        {(createOrder.isError || recordPayment.isError) && (
          <p className="text-xs text-red-500 mb-3">Failed to place order. Please try again.</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={isPending || cartItems.length === 0}
          className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? 'Placing…' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}
