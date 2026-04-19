const TYPE_COLORS = { veg: 'border-green-500', non_veg: 'border-red-500', egg: 'border-yellow-500' }

export default function ItemCard({ item, onAdd }) {
  return (
    <button
      onClick={() => onAdd(item)}
      className="flex flex-col items-start p-3 bg-white rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-sm transition active:scale-95 min-h-[80px] w-full text-left"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span aria-hidden="true" className={`w-3 h-3 rounded-sm border-2 ${TYPE_COLORS[item.item_type] ?? 'border-gray-400'}`} />
        <span className="text-xs text-gray-500 truncate max-w-[90%]">{item.category_name}</span>
      </div>
      <p className="font-medium text-gray-900 text-sm leading-tight">{item.name}</p>
      <p className="mt-auto pt-1 text-brand-600 font-semibold text-sm">₹{item.price}</p>
    </button>
  )
}
