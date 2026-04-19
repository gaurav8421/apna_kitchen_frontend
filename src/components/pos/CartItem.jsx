import { Minus, Plus, Trash2 } from 'lucide-react'
import useCartStore from '../../store/cartStore'

export default function CartItem({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.variantName && (
          <p className="text-xs text-gray-500">{item.variantName}</p>
        )}
        <p className="text-xs text-gray-500">₹{item.unitPrice}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.key, item.quantity - 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 transition"
        >
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.key, item.quantity + 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 transition"
        >
          <Plus size={12} />
        </button>
      </div>
      <p className="w-16 text-right text-sm font-medium text-gray-900">
        ₹{(item.unitPrice * item.quantity).toFixed(0)}
      </p>
      <button
        onClick={() => removeItem(item.key)}
        aria-label={`Remove ${item.name}`}
        className="text-gray-400 hover:text-red-400 transition"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
