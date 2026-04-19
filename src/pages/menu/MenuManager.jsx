import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useCategories, useMenuItems,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
} from '../../api/menu'

const ITEM_TYPE_LABELS = { veg: '🟢 Veg', non_veg: '🔴 Non-Veg', egg: '🟡 Egg' }

export default function MenuManager() {
  const [activeCatId, setActiveCatId] = useState(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [catName, setCatName] = useState('')
  const [itemForm, setItemForm] = useState({ name: '', price: '', item_type: 'veg', description: '' })

  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useMenuItems(activeCatId ? { category: activeCatId } : {})

  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()

  const handleSaveCat = () => {
    if (editingCat) {
      updateCat.mutate({ id: editingCat.id, name: catName }, { onSuccess: () => { setShowCatForm(false); setEditingCat(null); setCatName('') } })
    } else {
      createCat.mutate({ name: catName, sort_order: categories.length }, { onSuccess: () => { setShowCatForm(false); setCatName('') } })
    }
  }

  const handleSaveItem = () => {
    const payload = { ...itemForm, category: activeCatId, price: parseFloat(itemForm.price || 0).toFixed(2) }
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload }, { onSuccess: () => { setShowItemForm(false); setEditingItem(null); setItemForm({ name: '', price: '', item_type: 'veg', description: '' }) } })
    } else {
      createItem.mutate(payload, { onSuccess: () => { setShowItemForm(false); setItemForm({ name: '', price: '', item_type: 'veg', description: '' }) } })
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Category sidebar */}
      <div className="w-56 flex-none border-r border-gray-200 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Categories</span>
          <button onClick={() => { setShowCatForm(true); setEditingCat(null); setCatName('') }} className="text-brand-600 hover:text-brand-700">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => setActiveCatId(null)}
            className={`w-full text-left px-4 py-2 text-sm transition ${activeCatId === null ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className={`flex items-center group px-4 py-2 cursor-pointer transition ${activeCatId === cat.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveCatId(cat.id)}>
              <span className="flex-1 text-sm truncate">{cat.name}</span>
              <div className="hidden group-hover:flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setCatName(cat.name); setShowCatForm(true) }} className="text-gray-400 hover:text-gray-600"><Pencil size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${cat.name}"?`)) deleteCat.mutate(cat.id, { onSuccess: () => { if (activeCatId === cat.id) setActiveCatId(null) } }) }} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900">Menu Items</h1>
          {activeCatId && (
            <button
              onClick={() => { setShowItemForm(true); setEditingItem(null); setItemForm({ name: '', price: '', item_type: 'veg', description: '' }) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
            >
              <Plus size={14} /> Add Item
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-12">
              {activeCatId ? 'No items in this category' : 'Select a category'}
            </p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-left">Available</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500">{ITEM_TYPE_LABELS[item.item_type]}</td>
                      <td className="px-4 py-3 text-right text-gray-900">₹{item.price}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.is_available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingItem(item); setItemForm({ name: item.name, price: item.price, item_type: item.item_type, description: item.description || '' }); setShowItemForm(true) }} className="text-gray-400 hover:text-gray-600"><Pencil size={14} /></button>
                          <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item.id) }} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category form modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editingCat ? 'Edit Category' : 'New Category'}</h2>
            <input
              type="text" placeholder="Category name" value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowCatForm(false); setEditingCat(null); setCatName('') }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveCat} disabled={!catName.trim()} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Item form modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Item' : 'New Item'}</h2>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Item name" value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input type="number" placeholder="Price (₹)" value={itemForm.price}
                onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <select value={itemForm.item_type}
                onChange={(e) => setItemForm((f) => ({ ...f, item_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="veg">Veg</option>
                <option value="non_veg">Non-Veg</option>
                <option value="egg">Egg</option>
              </select>
              <textarea placeholder="Description (optional)" value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" rows={2} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowItemForm(false); setEditingItem(null); setItemForm({ name: '', price: '', item_type: 'veg', description: '' }) }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveItem} disabled={!itemForm.name.trim() || itemForm.price === ''}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
