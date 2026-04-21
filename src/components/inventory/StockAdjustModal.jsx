import { useState } from 'react'

export default function StockAdjustModal({ item, onSubmit, onClose, isSubmitting }) {
  const [form, setForm] = useState({ transaction_type: 'add', quantity: '', notes: '' })
  const [error, setError] = useState('')

  const currentStock = Number(item.current_stock)
  const qty = Number(form.quantity)
  const showDeductWarning =
    form.transaction_type === 'deduct' && form.quantity !== '' && qty > currentStock

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0')
      return
    }
    setError('')
    onSubmit({ item: item.id, transaction_type: form.transaction_type, quantity: form.quantity, notes: form.notes })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-1">Adjust Stock</h2>
        <p className="text-sm text-gray-500 mb-4">
          {item.name} — Current: {item.current_stock} {item.unit}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.transaction_type}
              onChange={(e) => setForm((f) => ({ ...f, transaction_type: e.target.value }))}
            >
              <option value="add">Add</option>
              <option value="deduct">Deduct</option>
              <option value="adjust">Set Exact (Adjust)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            {showDeductWarning && (
              <p className="text-amber-600 text-xs mt-1">
                Warning: deducting more than current stock ({item.current_stock} {item.unit})
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
