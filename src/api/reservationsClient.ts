import axios from 'axios'
import type { Location, Reservation, ReservationPayload, Room } from '../types'
import { ensureCorrelationIdHeader } from '../utils/correlation'

const reservationsApi = axios.create({
  baseURL: import.meta.env.VITE_RESERVATIONS_API_URL ?? 'http://localhost:8000',
})

reservationsApi.interceptors.request.use(ensureCorrelationIdHeader)

function authConfig(token: string) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export async function fetchLocations(token: string): Promise<Location[]> {
  const response = await reservationsApi.get<Location[]>('/api/locations', authConfig(token))
  return response.data
}

export async function fetchRooms(token: string, locationId?: number): Promise<Room[]> {
  const response = await reservationsApi.get<Room[]>('/api/rooms', {
    ...authConfig(token),
    params: locationId ? { location_id: locationId } : undefined,
  })
  return response.data
}

export async function fetchReservations(token: string): Promise<Reservation[]> {
  const response = await reservationsApi.get<Reservation[]>('/api/reservations', authConfig(token))
  return response.data
}

export async function createReservation(token: string, payload: ReservationPayload): Promise<Reservation> {
  const response = await reservationsApi.post<Reservation>('/api/reservations', payload, authConfig(token))
  return response.data
}

export async function updateReservation(token: string, id: number, payload: ReservationPayload): Promise<Reservation> {
  const response = await reservationsApi.put<Reservation>(`/api/reservations/${id}`, payload, authConfig(token))
  return response.data
}

export async function deleteReservation(token: string, id: number): Promise<void> {
  await reservationsApi.delete(`/api/reservations/${id}`, authConfig(token))
}

export async function bulkDeleteReservations(token: string, ids: number[]): Promise<number> {
  const response = await reservationsApi.post<{ deleted: number }>('/api/reservations/bulk-delete', { ids }, authConfig(token))
  return response.data.deleted
}
