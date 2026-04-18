import { useMutation } from '@tanstack/react-query'
import client from './client'
import useAuthStore from '../store/authStore'

export function useLogin() {
  return useMutation({
    mutationFn: (credentials) =>
      client.post('/auth/login/', credentials).then((r) => r.data),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.access, data.refresh)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload) =>
      client.post('/auth/register/', payload).then((r) => r.data),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.access, data.refresh)
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: () => {
      const refresh = useAuthStore.getState().refreshToken
      return client.post('/auth/logout/', { refresh })
    },
    onSettled: () => {
      useAuthStore.getState().clearAuth()
    },
  })
}
