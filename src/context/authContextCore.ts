import { createContext } from 'react'
import type { AuthPayload } from '../api/authClient'
import type { User } from '../types'

export interface AuthContextValue {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (payload: AuthPayload) => Promise<void>
  registerAndLogin: (payload: AuthPayload) => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
