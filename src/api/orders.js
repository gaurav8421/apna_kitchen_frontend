import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useOrders(params = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => client.get('/orders/', { params }).then((r) => r.data),
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/orders/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) =>
      client.patch(`/orders/${id}/status/`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/payments/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
