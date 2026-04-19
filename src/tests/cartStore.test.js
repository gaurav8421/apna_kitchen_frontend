import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react'
import useCartStore from '../store/cartStore'

beforeEach(() => {
  useCartStore.setState({
    items: [],
    branchId: null,
    orderType: 'dine_in',
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    discount: 0,
  })
})

const fakeItem = { id: 'abc-123', name: 'Butter Chicken', price: 320, item_type: 'non_veg' }

describe('addItem', () => {
  it('adds a new item to cart', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
  })

  it('increments quantity when same item added again', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().addItem(fakeItem))
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })
})

describe('removeItem', () => {
  it('removes item from cart', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().removeItem('abc-123'))
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('updateQuantity', () => {
  it('updates item quantity', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().updateQuantity('abc-123', 5))
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('removes item when quantity set to 0', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().updateQuantity('abc-123', 0))
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('totals', () => {
  it('calculates subtotal correctly', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().updateQuantity('abc-123', 2))
    expect(useCartStore.getState().subtotal()).toBe(640)
  })

  it('calculates tax at 5% by default', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    expect(useCartStore.getState().tax(5)).toBeCloseTo(16, 1)
  })
})

describe('clearCart', () => {
  it('empties cart', () => {
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().clearCart())
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('setOrderMeta', () => {
  it('sets allowed fields', () => {
    act(() => useCartStore.getState().setOrderMeta({ orderType: 'takeaway', tableNumber: '7' }))
    const state = useCartStore.getState()
    expect(state.orderType).toBe('takeaway')
    expect(state.tableNumber).toBe('7')
  })

  it('does not overwrite store actions', () => {
    act(() => useCartStore.getState().setOrderMeta({ addItem: 'corrupted' }))
    expect(typeof useCartStore.getState().addItem).toBe('function')
  })
})

describe('clearCart preserves session fields', () => {
  it('preserves branchId and orderType after clearCart', () => {
    act(() => useCartStore.getState().setOrderMeta({ branchId: 'branch-1', orderType: 'takeaway' }))
    act(() => useCartStore.getState().addItem(fakeItem))
    act(() => useCartStore.getState().clearCart())
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(0)
    expect(state.branchId).toBe('branch-1')
    expect(state.orderType).toBe('takeaway')
  })
})

describe('addItem with modifiers', () => {
  it('includes modifier prices in unitPrice', () => {
    const itemWithModifiers = { id: 'pizza-1', name: 'Pizza', price: 300, item_type: 'veg' }
    const modifiers = [{ name: 'Extra Cheese', price: 30 }, { name: 'Jalapenos', price: 20 }]
    act(() => useCartStore.getState().addItem(itemWithModifiers, '', modifiers))
    const item = useCartStore.getState().items[0]
    expect(item.unitPrice).toBe(350)
  })
})
