import { useEffect, useState } from 'react'
import MenuGrid from './MenuGrid'
import CartPanel from './CartPanel'
import PaymentModal from './PaymentModal'
import useCartStore from '../../store/cartStore'

export default function POSScreen() {
  const TAX_RATE = 5
  const [showPayment, setShowPayment] = useState(false)
  const clearCart = useCartStore((s) => s.clearCart)
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && items.length > 0 && !showPayment) setShowPayment(true)
      if (e.key === 'Escape') {
        if (showPayment) {
          setShowPayment(false)
        } else if (items.length > 0 && window.confirm('Clear cart?')) {
          clearCart()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items.length, clearCart, showPayment])

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden border-r border-gray-200">
        <MenuGrid />
      </div>
      <div className="w-80 xl:w-96 flex-none bg-white border-l border-gray-200">
        <CartPanel onPay={() => setShowPayment(true)} taxRate={TAX_RATE} />
      </div>
      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} taxRate={TAX_RATE} />
      )}
    </div>
  )
}
