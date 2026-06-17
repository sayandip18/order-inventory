import { createContext } from "react"

export interface User {
  id: string
  name: string
  email: string
}

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
