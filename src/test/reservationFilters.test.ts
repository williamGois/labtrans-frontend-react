import { describe, expect, test } from 'vitest'
import type { Reservation } from '../types'
import { emptyReservationFilters, filterReservations, groupReservationsByDay } from '../utils/reservationFilters'

const reservations: Reservation[] = [
  makeReservation({
    id: 1,
    location_id: 1,
    room_id: 1,
    start_datetime: '2026-05-12T09:00:00Z',
    end_datetime: '2026-05-12T10:00:00Z',
    responsible: 'Maria Silva',
    description: 'Planejamento',
    locationName: 'Matriz Florianopolis',
    roomName: 'Sala Azul',
  }),
  makeReservation({
    id: 2,
    location_id: 2,
    room_id: 3,
    start_datetime: '2026-05-13T14:00:00Z',
    end_datetime: '2026-05-13T15:00:00Z',
    responsible: 'Joao Souza',
    description: 'Comercial',
    locationName: 'Filial Sao Jose',
    roomName: 'Sala Executiva',
  }),
]

describe('reservation filters', () => {
  test('filters by location, room and text search', () => {
    const result = filterReservations(reservations, {
      ...emptyReservationFilters,
      locationId: '2',
      roomId: '3',
      search: 'executiva',
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  test('filters by date range using reservation start date', () => {
    const result = filterReservations(reservations, {
      ...emptyReservationFilters,
      dateFrom: '2026-05-13',
      dateTo: '2026-05-13',
    })

    expect(result.map((reservation) => reservation.id)).toEqual([2])
  })

  test('groups reservations by day for calendar view', () => {
    const groups = groupReservationsByDay(reservations)

    expect(groups).toHaveLength(2)
    expect(groups[0].dateKey).toBe('2026-05-12')
    expect(groups[0].reservations[0].id).toBe(1)
  })
})

function makeReservation(input: {
  id: number
  location_id: number
  room_id: number
  start_datetime: string
  end_datetime: string
  responsible: string
  description: string
  locationName: string
  roomName: string
}): Reservation {
  return {
    id: input.id,
    location_id: input.location_id,
    room_id: input.room_id,
    start_datetime: input.start_datetime,
    end_datetime: input.end_datetime,
    responsible: input.responsible,
    coffee_required: false,
    people_count: null,
    description: input.description,
    created_by_user_id: 'user-1',
    created_by_email: 'usuario@example.test',
    created_at: input.start_datetime,
    updated_at: null,
    location: {
      id: input.location_id,
      name: input.locationName,
      address: 'Endereco',
      created_at: input.start_datetime,
      updated_at: null,
    },
    room: {
      id: input.room_id,
      location_id: input.location_id,
      name: input.roomName,
      capacity: 8,
      active: true,
      created_at: input.start_datetime,
      updated_at: null,
    },
  }
}
