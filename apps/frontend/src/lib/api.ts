import axios from "axios"

const api = axios.create({
  baseURL: "/auth",
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        try {
          const { data } = await axios.post("/auth/refresh", {
            refresh_token: refreshToken,
          })
          setAccessToken(data.access_token)
          localStorage.setItem("refresh_token", data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch {
          setAccessToken(null)
          localStorage.removeItem("refresh_token")
        }
      }
    }
    return Promise.reject(error)
  }
)

interface SignUpPayload {
  name: string
  email: string
  password: string
}

interface SignInPayload {
  email: string
  password: string
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export async function signUp(payload: SignUpPayload): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/signup", payload)
  return data
}

export async function signIn(payload: SignInPayload): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/signin", payload)
  return data
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/refresh", { refresh_token: refreshToken })
  return data
}

export const client = axios.create({ baseURL: "/" })

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        try {
          const { data } = await axios.post("/auth/refresh", {
            refresh_token: refreshToken,
          })
          setAccessToken(data.access_token)
          localStorage.setItem("refresh_token", data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return client(originalRequest)
        } catch {
          setAccessToken(null)
          localStorage.removeItem("refresh_token")
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
