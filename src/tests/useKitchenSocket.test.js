import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKitchenSocket } from '../hooks/useKitchenSocket'

// Minimal MockWebSocket with addEventListener/close
class MockWebSocket {
  static instances = []
  constructor(url) {
    this.url = url
    this.readyState = 0
    this._handlers = {}
    MockWebSocket.instances.push(this)
  }
  addEventListener(event, fn) { this._handlers[event] = fn }
  close() { this.readyState = 3 }
  _fire(event, payload) { this._handlers[event]?.(payload) }
}

vi.mock('../store/authStore', () => ({
  default: (selector) =>
    selector({ user: { branch_id: 'b-1' }, accessToken: 'tok' }),
}))

vi.mock('../api/client', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}))

describe('useKitchenSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('opens WS with branch_id and token in URL', () => {
    renderHook(() => useKitchenSocket())
    expect(MockWebSocket.instances[0].url).toMatch(/b-1/)
    expect(MockWebSocket.instances[0].url).toMatch(/tok/)
  })

  it('sets connected=true on open', () => {
    const { result } = renderHook(() => useKitchenSocket())
    act(() => MockWebSocket.instances[0]._fire('open', {}))
    expect(result.current.connected).toBe(true)
  })

  it('prepends new_order to orders on WS message', () => {
    const order = { id: '1', status: 'pending', order_number: 'ORD-0001', items: [] }
    const { result } = renderHook(() => useKitchenSocket())
    act(() => MockWebSocket.instances[0]._fire('open', {}))
    act(() =>
      MockWebSocket.instances[0]._fire('message', {
        data: JSON.stringify({ type: 'new_order', order }),
      })
    )
    expect(result.current.orders[0].id).toBe('1')
  })

  it('updates existing order in place on order_updated', () => {
    const order = { id: '1', status: 'pending', order_number: 'ORD-0001', items: [] }
    const { result } = renderHook(() => useKitchenSocket())
    act(() => MockWebSocket.instances[0]._fire('open', {}))
    act(() =>
      MockWebSocket.instances[0]._fire('message', {
        data: JSON.stringify({ type: 'new_order', order }),
      })
    )
    act(() =>
      MockWebSocket.instances[0]._fire('message', {
        data: JSON.stringify({ type: 'order_updated', order: { ...order, status: 'preparing' } }),
      })
    )
    expect(result.current.orders[0].status).toBe('preparing')
    expect(result.current.orders).toHaveLength(1)
  })

  it('reconnects after WS close (1 s backoff)', () => {
    renderHook(() => useKitchenSocket())
    act(() => MockWebSocket.instances[0]._fire('close', {}))
    act(() => vi.advanceTimersByTime(1000))
    expect(MockWebSocket.instances).toHaveLength(2)
  })

  it('updateOrderLocally mutates status in list', () => {
    const order = { id: '1', status: 'pending', order_number: 'ORD-0001', items: [] }
    const { result } = renderHook(() => useKitchenSocket())
    act(() => MockWebSocket.instances[0]._fire('open', {}))
    act(() =>
      MockWebSocket.instances[0]._fire('message', {
        data: JSON.stringify({ type: 'new_order', order }),
      })
    )
    act(() => result.current.updateOrderLocally('1', 'preparing'))
    expect(result.current.orders[0].status).toBe('preparing')
  })

  it('returns noBranch=false when branch_id present', () => {
    const { result } = renderHook(() => useKitchenSocket())
    expect(result.current.noBranch).toBe(false)
  })
})
