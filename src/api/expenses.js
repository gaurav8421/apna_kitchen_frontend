import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useExpenses(filters = {}) {
  const params = {}
  if (filters.category) params.category = filters.category
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => client.get('/expenses/', { params }).then((r) => r.data),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/expenses/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/expenses/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/expenses/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => client.get('/expenses/categories/').then((r) => r.data),
  })
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/expenses/categories/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense-categories'] }),
  })
}
