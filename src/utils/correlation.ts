import { AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

export const CORRELATION_HEADER = 'X-Correlation-ID'

export function createCorrelationId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function ensureCorrelationIdHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const headers = AxiosHeaders.from(config.headers)
  if (!headers.has(CORRELATION_HEADER)) {
    headers.set(CORRELATION_HEADER, createCorrelationId())
  }

  config.headers = headers
  return config
}
