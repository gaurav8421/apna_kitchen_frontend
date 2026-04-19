import { useState } from 'react'
import { useCategories, useMenuItems } from '../../api/menu'
import ItemCard from '../../components/pos/ItemCard'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'

export default function MenuGrid() {
  const branchId = useAuthStore((s) => s.user?.branch_id)
  const [activeCatId, setActiveCatId] = useState(null)
  const [search, setSearch] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const { data: categories = [] } = useCategories(branchId ? { branch: branchId } : {})
  const { data: items = [], isLoading } = useMenuItems({
    ...(activeCatId ? { category: activeCatId } : {}),
    is_available: true,
  })

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex gap-2 px-3 py-2 overflow-x-auto bg-white border-b border-gray-200 scrollbar-hide">
        <button
          onClick={() => setActiveCatId(null)}
          className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeCatId === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCatId(cat.id)}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeCatId === cat.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center mt-8">Loading menu…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">No items found</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} onAdd={addItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
