import axios from 'axios'
import type { AuthResponse, User } from '../types'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:5001',
})

export interface AuthPayload {
  email: string
  password: string
}

export async function registerUser(payload: AuthPayload): Promise<User> {
  const response = await authApi.post<User>('/api/auth/register', payload)
  return response.data
}

export async function loginUser(payload: AuthPayload): Promise<AuthResponse> {
  const response = await authApi.post<AuthResponse>('/api/auth/login', payload)
  return response.data
}

export async function getMe(token: string): Promise<User> {
  const response = await authApi.get<User>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}
