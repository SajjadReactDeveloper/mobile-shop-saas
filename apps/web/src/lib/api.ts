import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const onAuthPage = window.location.pathname.startsWith('/auth')
      if (!onAuthPage) {
        localStorage.removeItem('access_token')
        window.location.href = '/auth/login?reason=expired'
      }
    }
    return Promise.reject(err)
  },
)
