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

- **Pessimistic Locking on Orders** — Order creation uses `SELECT … FOR UPDATE` to acquire row-level locks on the referenced product rows before checking and decrementing stock. Product rows are locked in a consistent ID-sorted order to prevent deadlocks. The entire operation (stock validation, decrement, order + item creation) runs inside a single atomic transaction — if any product has insufficient stock, the whole transaction rolls back with no side effects.

- **Other Race Condition Prevention** — Product updates acquire row-level locks (`SELECT … FOR UPDATE`) to prevent lost updates when edits overlap with concurrent order creation. Order cancellation similarly locks affected product rows before restoring inventory, ensuring stock is never double-restored. Duplicate SKUs are guarded by a unique database index, with `IntegrityError` caught and surfaced as a 409 Conflict.

- **Price Snapshots** — Each order line item records the product's unit price at the time of purchase. This decouples historical order data from future price changes, so order totals remain accurate regardless of subsequent product updates.

- **User Deletion** — Customers cannot be deleted while they have active (non-cancelled) orders. The API returns a 409 Conflict in this case, preventing orphaned order records. If all of a customer's orders have been cancelled, deletion is allowed and those cancelled orders are cascade-deleted along with the customer.
