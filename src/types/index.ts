export interface User {
  id: string
  email: string
  createdAt?: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: User
}

export interface Location {
  id: number
  name: string
  address: string
  created_at: string
  updated_at: string | null
}

export interface Room {
  id: number
  location_id: number
  name: string
  capacity: number
  active: boolean
  created_at: string
  updated_at: string | null
}

export interface Reservation {
  id: number
  location_id: number
  room_id: number
  start_datetime: string
  end_datetime: string
  responsible: string
  coffee_required: boolean
  people_count: number | null
  description: string | null
  created_by_user_id: string
  created_by_email: string
  created_at: string
  updated_at: string | null
  location: Location
  room: Room
}

export interface ReservationPayload {
  location_id: number
  room_id: number
  start_datetime: string
  end_datetime: string
  responsible: string
  coffee_required: boolean
  people_count: number | null
  description: string | null
}

export interface ApiErrorBody {
  message?: string
  detail?: string
  correlationId?: string
  conflictingReservationId?: number
  details?: unknown
}
