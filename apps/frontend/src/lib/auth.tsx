import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { setAccessToken, refreshTokens } from "./api"
import { AuthContext, type User } from "./auth-context"

function decodePayload(token: string): Record<string, unknown> {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
  return JSON.parse(atob(base64))
}

function userFromToken(token: string): User {
  const payload = decodePayload(token)
  return {
    id: payload.sub as string,
    name: payload.name as string,
    email: payload.email as string,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(
    () => !!localStorage.getItem("refresh_token")
  )

  const login = useCallback((accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken)
    localStorage.setItem("refresh_token", refreshToken)
    setUser(userFromToken(accessToken))
  }, [])

  const logout = useCallback(() => {
    setAccessToken(null)
    localStorage.removeItem("refresh_token")
    setUser(null)
  }, [])

  useEffect(() => {
    const storedRefresh = localStorage.getItem("refresh_token")
    if (!storedRefresh) return

    refreshTokens(storedRefresh)
      .then((data) => {
        login(data.access_token, data.refresh_token)
      })
      .catch(() => {
        localStorage.removeItem("refresh_token")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [login])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
