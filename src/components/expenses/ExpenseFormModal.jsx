import { useState, useEffect } from 'react'

export default function ExpenseFormModal({
  expense,
  categories,
  onSubmit,
  onCreateCategory,
  onClose,
  isSubmitting,
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    amount: '',
    category: '',
    vendor: '',
    date: today,
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [creatingCat, setCreatingCat] = useState(false)

  useEffect(() => {
    if (expense) {
      setForm({
        amount: expense.amount,
        category: typeof expense.category === 'string' ? expense.category : (expense.category?.id ?? ''),
        vendor: expense.vendor ?? '',
        date: expense.date,
        description: expense.description ?? '',
      })
    }
  }, [expense])

  function handleCategoryChange(e) {
    if (e.target.value === '__new__') {
      setShowNewCat(true)
      setForm((f) => ({ ...f, category: '' }))
    } else {
      setShowNewCat(false)
      setForm((f) => ({ ...f, category: e.target.value }))
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setCreatingCat(true)
    try {
      const cat = await onCreateCategory(newCatName.trim())
      setForm((f) => ({ ...f, category: cat.id }))
      setShowNewCat(false)
      setNewCatName('')
    } catch {
      // error shown by parent via toast
    } finally {
      setCreatingCat(false)
    }
  }

  function validate() {
    const e = {}
    const amt = Number(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = 'Amount must be > 0'
    if (!form.category) e.category = 'Category is required'
    if (!form.date) e.date = 'Date is required'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    onSubmit({
      amount: form.amount,
      category: form.category,
      vendor: form.vendor || undefined,
      date: form.date,
      description: form.description || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Amount (₹)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={showNewCat ? '__new__' : form.category}
              onChange={handleCategoryChange}
            >
              <option value="">Select category…</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__new__">＋ New category</option>
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            {showNewCat && (
              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <button
                  type="button"
                  disabled={creatingCat}
                  onClick={handleCreateCategory}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingCat ? '…' : 'Create'}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vendor (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.vendor}
              onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
              {isSubmitting ? 'Saving…' : expense ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
