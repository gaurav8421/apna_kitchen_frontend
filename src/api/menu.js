import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

export function useCategories(params = {}) {
  return useQuery({
    queryKey: ['menu-categories', params],
    queryFn: () => client.get('/menu/categories/', { params }).then((r) => r.data),
  })
}

export function useMenuItems(params = {}) {
  return useQuery({
    queryKey: ['menu-items', params],
    queryFn: () => client.get('/menu/items/', { params }).then((r) => r.data),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/menu/categories/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/menu/categories/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/menu/categories/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-categories'] }),
  })
}

export function useCreateMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/menu/items/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}

export function useUpdateMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.patch(`/menu/items/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}

export function useDeleteMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/menu/items/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}
