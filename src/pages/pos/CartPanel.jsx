import useCartStore from '../../store/cartStore'
import CartItem from '../../components/pos/CartItem'

const ORDER_TYPES = [
  { value: 'dine_in', label: 'Dine In' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' },
]

export default function CartPanel({ taxRate = 5, onPay }) {
  const items = useCartStore((s) => s.items)
  const orderType = useCartStore((s) => s.orderType)
  const tableNumber = useCartStore((s) => s.tableNumber)
  const setOrderMeta = useCartStore((s) => s.setOrderMeta)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore((s) => s.subtotal)
  const tax = useCartStore((s) => s.tax)
  const total = useCartStore((s) => s.total)

  const sub = subtotal()
  const t = tax(taxRate)
  const tot = total(taxRate)

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex gap-1 mb-2">
          {ORDER_TYPES.map((ot) => (
            <button
              key={ot.value}
              onClick={() => setOrderMeta({ orderType: ot.value })}
              className={`flex-1 py-1 text-xs rounded-lg font-medium transition ${
                orderType === ot.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ot.label}
            </button>
          ))}
        </div>
        {orderType === 'dine_in' && (
          <input
            type="text"
            placeholder="Table number"
            value={tableNumber}
            onChange={(e) => setOrderMeta({ tableNumber: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 divide-y divide-gray-100">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-12">Cart is empty</p>
        ) : (
          items.map((item) => <CartItem key={item.key} item={item} />)
        )}
      </div>

      {items.length > 0 && (
        <div className="px-4 py-4 border-t border-gray-200 space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>₹{sub.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>GST ({taxRate}%)</span><span>₹{t.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Total</span><span>₹{tot.toFixed(2)}</span>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={clearCart}
              className="flex-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              Clear
            </button>
            <button
              onClick={onPay}
              disabled={orderType === 'dine_in' && !tableNumber.trim()}
              className="flex-1 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Pay ₹{tot.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
