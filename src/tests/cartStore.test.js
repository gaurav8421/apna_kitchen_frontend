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
