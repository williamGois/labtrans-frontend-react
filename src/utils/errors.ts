import axios from 'axios'
import type { ApiErrorBody } from '../types'

export function extractApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data
    const message = data?.message ?? data?.detail
    if (message) {
      return formatWithSupportCode(message, data?.correlationId ?? readHeader(error.response?.headers, 'x-correlation-id'))
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }

  const maybeHeaders = headers as { get?: (headerName: string) => unknown }
  const fromGet = maybeHeaders.get?.(name)
  if (typeof fromGet === 'string' && fromGet.trim()) {
    return fromGet
  }

  const value = (headers as Record<string, unknown>)[name]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function formatWithSupportCode(message: string, correlationId?: string): string {
  return correlationId ? `${message} Codigo de suporte: ${correlationId}` : message
}
