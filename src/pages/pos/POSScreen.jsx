import { useEffect, useState } from 'react'
import MenuGrid from './MenuGrid'
import CartPanel from './CartPanel'
import PaymentModal from './PaymentModal'
import useCartStore from '../../store/cartStore'

export default function POSScreen() {
  const [showPayment, setShowPayment] = useState(false)
  const clearCart = useCartStore((s) => s.clearCart)
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && items.length > 0) setShowPayment(true)
      if (e.key === 'Escape') clearCart()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items.length, clearCart])

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden border-r border-gray-200">
        <MenuGrid />
      </div>
      <div className="w-80 xl:w-96 flex-none bg-white border-l border-gray-200">
        <CartPanel onPay={() => setShowPayment(true)} />
      </div>
      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} />
      )}
    </div>
  )
}
