# Order and Inventory system

## Features

- **JWT Strategy** — Access tokens are held in-memory only (not in localstorage). This keeps the app safe from XSS attacks while refresh tokens are stored in localStorage for session continuity across reloads. On every app load, the client silently exchanges the stored refresh token for a fresh access/refresh pair, so users stay logged in without exposing long-lived credentials in memory. An Axios interceptor transparently retries any 401 response by refreshing the token, making re-authentication invisible to the rest of the app.
