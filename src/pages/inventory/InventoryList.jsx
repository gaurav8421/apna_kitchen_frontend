import { useState } from 'react'
import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useAddStockTransaction,
} from '../../api/inventory'
import InventoryItemModal from '../../components/inventory/InventoryItemModal'
import StockAdjustModal from '../../components/inventory/StockAdjustModal'

export default function InventoryList() {
  const { data, isLoading, isError, refetch } = useInventoryItems()
  const items = data ?? []
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const deleteItem = useDeleteInventoryItem()
  const addTransaction = useAddStockTransaction()

  const [itemModal, setItemModal] = useState(null) // null | 'add' | item-object
  const [adjustItem, setAdjustItem] = useState(null)
  const [toast, setToast] = useState('')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleItemSubmit(form) {
    try {
      if (itemModal === 'add') {
        await createItem.mutateAsync(form)
      } else {
        await updateItem.mutateAsync({ id: itemModal.id, ...form })
      }
      setItemModal(null)
    } catch {
      showToast('Could not save item. Please try again.')
    }
  }

  async function handleAdjustSubmit(payload) {
    try {
      await addTransaction.mutateAsync(payload)
      setAdjustItem(null)
    } catch {
      showToast('Could not adjust stock. Please try again.')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await deleteItem.mutateAsync(item.id)
    } catch {
      showToast('Could not delete item.')
    }
  }

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
          <span>Could not load inventory</span>
          <button onClick={() => refetch()} className="underline hover:no-underline font-medium">
            Retry
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Inventory</h2>
        <button
          aria-label="Add Item"
          onClick={() => setItemModal('add')}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          + New Item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Threshold</th>
              <th className="px-4 py-3 font-medium">Cost/Unit</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No items yet. Add your first inventory item.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold)
              return (
                <tr
                  key={item.id}
                  data-testid={`row-${item.id}`}
                  className={`border-b last:border-0 ${isLow ? 'border-l-4 border-l-red-400' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                  <td
                    data-testid={`stock-${item.id}`}
                    className={`px-4 py-3 font-medium ${isLow ? 'text-red-600' : 'text-gray-800'}`}
                  >
                    {item.current_stock}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.low_stock_threshold}</td>
                  <td className="px-4 py-3 text-gray-600">₹{item.cost_per_unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        aria-label={`Adjust ${item.name}`}
                        onClick={() => setAdjustItem(item)}
                        className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
                      >
                        Adjust
                      </button>
                      <button
                        aria-label={`Edit ${item.name}`}
                        onClick={() => setItemModal(item)}
                        className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${item.name}`}
                        onClick={() => handleDelete(item)}
                        className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {itemModal && (
        <InventoryItemModal
          item={itemModal === 'add' ? null : itemModal}
          onSubmit={handleItemSubmit}
          onClose={() => setItemModal(null)}
          isSubmitting={createItem.isPending || updateItem.isPending}
        />
      )}
      {adjustItem && (
        <StockAdjustModal
          item={adjustItem}
          onSubmit={handleAdjustSubmit}
          onClose={() => setAdjustItem(null)}
          isSubmitting={addTransaction.isPending}
        />
      )}
    </div>
  )
}
