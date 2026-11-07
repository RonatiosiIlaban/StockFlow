# StockFlow

Aplikasi manajemen stok produk dan sales order.

## Tech Stack

**Backend**
- Go 1.27
- Fiber v3
- GORM
- PostgreSQL 16

**Frontend**
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router
- Axios
- React Hook Form + Yup
- Headless UI, MUI, Lucide React

## Port

| Service    | Docker                  | Lokal (development)     |
|------------|-------------------------|-------------------------|
| Frontend   | http://localhost:3000   | http://localhost:5173   |
| Backend    | http://localhost:8080   | http://localhost:8080   |
| PostgreSQL | localhost:5433          | localhost:5432          |

## Improvement

- **Unit test** — belum ada test sama sekali. Prioritas: service & repository sales order (idempotency, pengurangan/pengembalian stok, cancel) di backend, lalu form dan validasi di frontend.
- **Docker Compose** — file `docker-compose.yml` dan Dockerfile sudah dibuat tapi belum diuji end to end. Perlu dijalankan dan diverifikasi seluruh alur (db → backend → frontend) berjalan normal.
