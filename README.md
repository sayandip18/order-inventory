# Order and Inventory system

## How to run

Make sure you have [Docker](https://www.docker.com/) installed and running.

Start all services (PostgreSQL, backend, and frontend) with a single command:

```bash
docker compose up --build
```

This will:

- Start a PostgreSQL database
- Build and start the FastAPI backend (auto-runs database migrations)
- Build and start the Vite React frontend

Once everything is up:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

To stop all services:

```bash
docker compose down
```

To stop and remove the database volume:

```bash
docker compose down -v
```

## Features

- **JWT Strategy** — Access tokens are held in-memory only (not in localstorage). This keeps the app safe from XSS attacks while refresh tokens are stored in localStorage for session continuity across reloads. On every app load, the client silently exchanges the stored refresh token for a fresh access/refresh pair, so users stay logged in without exposing long-lived credentials in memory. An Axios interceptor transparently retries any 401 response by refreshing the token, making re-auth invisible to the rest of the app.

- **API Gateway** — The Vite dev server doubles as a reverse proxy, forwarding requests to the backend. This avoids introducing a separate Nginx container (and the overhead of managing it), sidesteps silent WebSocket disconnect issues common with Nginx in Docker, and keeps it simple — one `docker compose up` runs everything.
