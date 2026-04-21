import { useState, useEffect } from 'react'

export default function InventoryItemModal({ item, onSubmit, onClose, isSubmitting }) {
  const [form, setForm] = useState({
    name: '',
    unit: '',
    low_stock_threshold: '',
    cost_per_unit: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        unit: item.unit,
        low_stock_threshold: item.low_stock_threshold,
        cost_per_unit: item.cost_per_unit,
      })
    }
  }, [item])

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.unit.trim()) e.unit = 'Unit is required'
    const thresh = Number(form.low_stock_threshold)
    if (isNaN(thresh) || thresh < 0) e.low_stock_threshold = 'Must be ≥ 0'
    const cost = Number(form.cost_per_unit)
    if (isNaN(cost) || cost < 0) e.cost_per_unit = 'Must be ≥ 0'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{item ? 'Edit Item' : 'Add Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Unit</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="kg, litre, piece…"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.low_stock_threshold}
              onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
            />
            {errors.low_stock_threshold && <p className="text-red-500 text-xs mt-1">{errors.low_stock_threshold}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cost per Unit (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.cost_per_unit}
              onChange={(e) => setForm((f) => ({ ...f, cost_per_unit: e.target.value }))}
            />
            {errors.cost_per_unit && <p className="text-red-500 text-xs mt-1">{errors.cost_per_unit}</p>}
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
              {isSubmitting ? 'Saving…' : item ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
