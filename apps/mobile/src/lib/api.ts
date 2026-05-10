import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('access_token')
    }
    return Promise.reject(err)
  },
)

export const saveToken = (token: string) => AsyncStorage.setItem('access_token', token)
export const getToken = () => AsyncStorage.getItem('access_token')
export const clearToken = () => AsyncStorage.removeItem('access_token')
