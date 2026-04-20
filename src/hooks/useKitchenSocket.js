import { useState, useEffect, useRef, useCallback } from 'react'
import useAuthStore from '../store/authStore'
import client from '../api/client'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export function useKitchenSocket() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.accessToken)
  const branchId = user?.branch_id

  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)

  const wsRef = useRef(null)
  const retryTimerRef = useRef(null)
  const pollTimerRef = useRef(null)
  const retryDelayRef = useRef(1000)

  const fetchActive = useCallback(async () => {
    if (!branchId) return
    try {
      const { data } = await client.get('/orders/', {
        params: { status: 'pending,preparing,ready' },
      })
      setOrders(data)
    } catch {}
  }, [branchId])

  const updateOrderLocally = useCallback((id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }, [])

  useEffect(() => {
    if (!branchId || !token) return

    let cancelled = false

    fetchActive()

    function openSocket() {
      setConnecting(true)
      const ws = new WebSocket(`${WS_BASE}/ws/kitchen/${branchId}/?token=${token}`)
      wsRef.current = ws

      ws.addEventListener('open', () => {
        if (cancelled) return
        setConnected(true)
        setConnecting(false)
        retryDelayRef.current = 1000
        clearInterval(pollTimerRef.current)
      })

      ws.addEventListener('message', (event) => {
        if (cancelled) return
        let msg
        try { msg = JSON.parse(event.data) } catch { return }
        if (msg.type === 'new_order') {
          setOrders((prev) =>
            prev.some((o) => o.id === msg.order.id) ? prev : [msg.order, ...prev]
          )
        } else if (msg.type === 'order_updated') {
          setOrders((prev) =>
            prev.map((o) => (o.id === msg.order.id ? msg.order : o))
          )
        }
      })

      ws.addEventListener('close', () => {
        if (cancelled) return
        setConnected(false)
        setConnecting(true)
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = setInterval(fetchActive, 30_000)
        retryTimerRef.current = setTimeout(() => {
          retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30_000)
          openSocket()
        }, retryDelayRef.current)
      })

      ws.addEventListener('error', () => ws.close())
    }

    openSocket()

    return () => {
      cancelled = true
      retryDelayRef.current = 1000
      wsRef.current?.close()
      clearTimeout(retryTimerRef.current)
      clearInterval(pollTimerRef.current)
    }
  }, [branchId, token, fetchActive])

  return { orders, connected, connecting, noBranch: !branchId, updateOrderLocally }
}
