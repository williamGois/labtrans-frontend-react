import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getMe, loginUser, registerUser } from '../api/authClient'
import type { AuthPayload } from '../api/authClient'
import type { User } from '../types'
import { AuthContext } from './authContextCore'
import type { AuthContextValue } from './authContextCore'

const TOKEN_KEY = 'labtrans_access_token'
const USER_KEY = 'labtrans_user'

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(() => readStoredUser())

  const persistSession = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const login = useCallback(
    async (payload: AuthPayload) => {
      const auth = await loginUser(payload)
      persistSession(auth.accessToken, auth.user)
    },
    [persistSession],
  )

  const registerAndLogin = useCallback(
    async (payload: AuthPayload) => {
      await registerUser(payload)
      await login(payload)
    },
    [login],
  )

  const refreshUser = useCallback(async () => {
    if (!token) {
      return
    }

    const currentUser = await getMe(token)
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
    setUser(currentUser)
  }, [token])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      registerAndLogin,
      refreshUser,
      logout,
    }),
    [login, logout, refreshUser, registerAndLogin, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
