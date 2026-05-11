import { AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { describe, expect, test } from 'vitest'
import { CORRELATION_HEADER, ensureCorrelationIdHeader } from '../utils/correlation'
import { extractApiError } from '../utils/errors'

describe('diagnostics helpers', () => {
  test('adds a correlation id header to axios requests', () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

    const result = ensureCorrelationIdHeader(config)
    const headers = AxiosHeaders.from(result.headers)

    expect(headers.has(CORRELATION_HEADER)).toBe(true)
    expect(headers.get(CORRELATION_HEADER)).toBeTruthy()
  })

  test('preserves an existing correlation id header', () => {
    const headers = new AxiosHeaders()
    headers.set(CORRELATION_HEADER, 'corr-client-123')
    const config = { headers } as InternalAxiosRequestConfig

    const result = ensureCorrelationIdHeader(config)

    expect(AxiosHeaders.from(result.headers).get(CORRELATION_HEADER)).toBe('corr-client-123')
  })

  test('shows support code when API error returns correlation id', () => {
    const message = extractApiError(
      {
        isAxiosError: true,
        response: {
          data: {
            message: 'Ja existe uma reserva para esta sala, local e horario.',
            correlationId: 'corr-api-123',
          },
        },
      },
      'Falha inesperada.',
    )

    expect(message).toBe(
      'Ja existe uma reserva para esta sala, local e horario. Codigo de suporte: corr-api-123',
    )
  })
})
