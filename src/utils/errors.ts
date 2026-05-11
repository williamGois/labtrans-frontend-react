import axios from 'axios'
import type { ApiErrorBody } from '../types'

export function extractApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data
    if (data?.message) {
      return data.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
