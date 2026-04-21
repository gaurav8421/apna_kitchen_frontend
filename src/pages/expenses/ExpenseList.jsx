import { useState } from 'react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useCreateExpenseCategory,
} from '../../api/expenses'
import ExpenseFormModal from '../../components/expenses/ExpenseFormModal'

function fmtMoney(val) {
  const n = Number(val)
  if (isNaN(n)) return '—'
  return `₹${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ExpenseList() {
  const [filters, setFilters] = useState({ category: '', from: '', to: '' })
  const [modal, setModal] = useState(null) // null | 'add' | expense-object
  const [toast, setToast] = useState('')

  const activeFilters = {}
  if (filters.category) activeFilters.category = filters.category
  if (filters.from) activeFilters.from = filters.from
  if (filters.to) activeFilters.to = filters.to

  const { data: rawExpenses, isLoading, isError, refetch } = useExpenses(activeFilters)
  const expenses = rawExpenses ?? []
  const { data: rawCategories } = useExpenseCategories()
  const categories = rawCategories ?? []
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const createCategory = useCreateExpenseCategory()

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSubmit(form) {
    try {
      if (modal === 'add') {
        await createExpense.mutateAsync(form)
      } else {
        await updateExpense.mutateAsync({ id: modal.id, ...form })
      }
      setModal(null)
    } catch {
      showToast('Could not save expense. Please try again.')
    }
  }

  async function handleCreateCategory(name) {
    try {
      return await createCategory.mutateAsync({ name })
    } catch {
      showToast('Could not create category.')
      throw new Error('category create failed')
    }
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete this expense?`)) return
    try {
      await deleteExpense.mutateAsync(expense.id)
    } catch {
      showToast('Could not delete expense.')
    }
  }

  function resetFilters() {
    setFilters({ category: '', from: '', to: '' })
  }

  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0)

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {toast}
        </div>
      )}
      {isError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
          <span>Could not load expenses ·</span>
          <button onClick={() => refetch()} className="underline hover:no-underline font-medium">
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Expenses</h2>
        {!modal && (
          <button
            onClick={() => setModal('add')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            + Add Expense
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
        </div>
        <button
          onClick={resetFilters}
          className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No expenses found.
                </td>
              </tr>
            )}
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-gray-600">{fmtDate(expense.expense_date)}</td>
                <td className="px-4 py-3 text-gray-800">{expense.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{expense.vendor_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{expense.description || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{fmtMoney(expense.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      aria-label={`Edit ${expense.id}`}
                      onClick={() => setModal(expense)}
                      className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${expense.id}`}
                      onClick={() => handleDelete(expense)}
                      className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      {expenses.length > 0 && (
        <p className="text-sm text-gray-600 mt-3 text-right">
          Total shown: <span className="font-semibold text-gray-800">{fmtMoney(total)}</span>
        </p>
      )}

      {modal && (
        <ExpenseFormModal
          expense={modal === 'add' ? null : modal}
          categories={categories}
          onSubmit={handleSubmit}
          onCreateCategory={handleCreateCategory}
          onClose={() => setModal(null)}
          isSubmitting={createExpense.isPending || updateExpense.isPending}
        />
      )}
    </div>
  )
}
