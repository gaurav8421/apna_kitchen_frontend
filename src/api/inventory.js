import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => client.get('/inventory/').then((r) => {
      const d = r.data
      return Array.isArray(d) ? d : (d?.results ?? [])
    }),
  })
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/inventory/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/inventory/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/inventory/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useAddStockTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/inventory/transactions/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
