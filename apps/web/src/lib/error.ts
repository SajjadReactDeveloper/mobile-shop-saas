import type { AxiosError } from 'axios'

export function getApiError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr?.response?.data?.message ?? fallback
}
