import { useContext } from 'react'
import { AuthContext } from './authContextCore'
import type { AuthContextValue } from './authContextCore'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.')
  }

  return context
}
