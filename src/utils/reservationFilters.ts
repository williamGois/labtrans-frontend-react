import type { Reservation } from '../types'

export interface ReservationFilters {
  locationId: string
  roomId: string
  dateFrom: string
  dateTo: string
  search: string
}

export interface ReservationDayGroup {
  dateKey: string
  label: string
  reservations: Reservation[]
}

export const emptyReservationFilters: ReservationFilters = {
  locationId: '',
  roomId: '',
  dateFrom: '',
  dateTo: '',
  search: '',
}

export function filterReservations(reservations: Reservation[], filters: ReservationFilters): Reservation[] {
  const locationId = Number(filters.locationId)
  const roomId = Number(filters.roomId)
  const search = normalize(filters.search)
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null
  const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`) : null

  return reservations.filter((reservation) => {
    if (locationId && reservation.location_id !== locationId) {
      return false
    }

    if (roomId && reservation.room_id !== roomId) {
      return false
    }

    const start = new Date(reservation.start_datetime)
    if (from && start < from) {
      return false
    }

    if (to && start > to) {
      return false
    }

    if (search && !reservationMatchesSearch(reservation, search)) {
      return false
    }

    return true
  })
}

export function groupReservationsByDay(reservations: Reservation[]): ReservationDayGroup[] {
  const groups = new Map<string, Reservation[]>()
  for (const reservation of reservations) {
    const key = toLocalDateKey(reservation.start_datetime)
    const current = groups.get(key) ?? []
    current.push(reservation)
    groups.set(key, current)
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, groupReservations]) => ({
      dateKey,
      label: formatDayLabel(groupReservations[0].start_datetime),
      reservations: groupReservations.toSorted(
        (left, right) => new Date(left.start_datetime).getTime() - new Date(right.start_datetime).getTime(),
      ),
    }))
}

export function hasActiveReservationFilters(filters: ReservationFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '')
}

function reservationMatchesSearch(reservation: Reservation, search: string): boolean {
  const searchable = [
    reservation.responsible,
    reservation.description ?? '',
    reservation.location.name,
    reservation.room.name,
  ]
    .map(normalize)
    .join(' ')

  return searchable.includes(search)
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toLocalDateKey(value: string): string {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDayLabel(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
