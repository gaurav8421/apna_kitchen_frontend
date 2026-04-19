import MenuGrid from './MenuGrid'

export default function POSScreen() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden border-r border-gray-200">
        <MenuGrid />
      </div>
      <div className="w-80 xl:w-96 flex-none bg-gray-50">
        {/* CartPanel rendered in Task 10 */}
        <p className="p-4 text-sm text-gray-400">Cart panel coming in next task</p>
      </div>
    </div>
  )
}
