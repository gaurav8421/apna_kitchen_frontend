import { create } from 'zustand'

const useCartStore = create((set, get) => ({
  items: [],
  branchId: null,
  orderType: 'dine_in',
  tableNumber: '',
  customerName: '',
  customerPhone: '',
  discount: 0,

  addItem: (menuItem, variantName = '', modifiers = []) => {
    const key = variantName ? `${menuItem.id}__${variantName}` : menuItem.id
    set((state) => {
      const existing = state.items.find((i) => i.key === key)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      const unitPrice = Number(menuItem.price) + modifiers.reduce((s, m) => s + Number(m.price), 0)
      return {
        items: [
          ...state.items,
          { key, id: menuItem.id, name: menuItem.name, variantName, modifiers, unitPrice, quantity: 1 },
        ],
      }
    })
  },

  removeItem: (key) =>
    set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

  updateQuantity: (key, quantity) => {
    if (quantity <= 0) {
      get().removeItem(key)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
    }))
  },

  setOrderMeta: ({ branchId, orderType, tableNumber, customerName, customerPhone, discount } = {}) => {
    const patch = {}
    if (branchId      !== undefined) patch.branchId      = branchId
    if (orderType     !== undefined) patch.orderType     = orderType
    if (tableNumber   !== undefined) patch.tableNumber   = tableNumber
    if (customerName  !== undefined) patch.customerName  = customerName
    if (customerPhone !== undefined) patch.customerPhone = customerPhone
    if (discount      !== undefined) patch.discount      = discount
    set(patch)
  },

  clearCart: () =>
    set({
      items: [],
      tableNumber: '',
      customerName: '',
      customerPhone: '',
      discount: 0,
    }),

  subtotal: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),

  tax: (taxRatePercent) => {
    const sub = get().subtotal()
    return parseFloat(((sub * taxRatePercent) / 100).toFixed(2))
  },

  total: (taxRatePercent) => {
    const sub = get().subtotal()
    const tax = (sub * taxRatePercent) / 100
    return parseFloat((sub + tax - get().discount).toFixed(2))
  },
}))

export default useCartStore
