import { describe, it, expect, beforeEach } from 'vitest'
import useAuthStore from '../store/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null })
  })

  it('sets auth state', () => {
    const user = { id: '1', name: 'Test', role: 'owner' }
    useAuthStore.getState().setAuth(user, 'access123', 'refresh123')
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().accessToken).toBe('access123')
  })

  it('clears auth state', () => {
    useAuthStore.getState().setAuth({ id: '1' }, 'tok', 'ref')
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('isAuthenticated returns true when token exists', () => {
    useAuthStore.getState().setAuth({ id: '1' }, 'tok', 'ref')
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })
})
