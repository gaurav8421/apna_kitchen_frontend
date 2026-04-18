import axios from 'axios'
import useAuthStore from '../store/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const baseURL = client.defaults.baseURL ?? '/api/v1'
        const { data } = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })
        useAuthStore.getState().updateAccessToken(data.access)
        if (data.refresh) useAuthStore.getState().updateRefreshToken(data.refresh)
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${data.access}`
        return client(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
