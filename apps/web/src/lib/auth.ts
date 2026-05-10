import { api } from './api'

export interface AuthTokens {
  accessToken: string
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; shopName: string; city?: string }) =>
    api.post<AuthTokens>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>('/auth/login', data).then((r) => r.data),

  sendOtp: (phone: string) =>
    api.post('/auth/otp/send', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, otp: string) =>
    api.post<AuthTokens>('/auth/otp/verify', { phone, otp }).then((r) => r.data),

  getMe: () => api.get('/auth/me').then((r) => r.data),
}

export const saveToken = (token: string) => localStorage.setItem('access_token', token)
export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
export const clearToken = () => localStorage.removeItem('access_token')
