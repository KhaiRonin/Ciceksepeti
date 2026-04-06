# Flower E-Commerce Backend (Enterprise & Secure)

Production-ready backend for a flower marketplace, built with NestJS + Prisma + PostgreSQL + Redis + Docker.

## Tech Stack

- NestJS (latest)
- Prisma ORM
- PostgreSQL
- Redis
- JWT (access + refresh token rotation)
- Docker / Docker Compose

## Security Highlights

- OWASP-oriented hardening
- Helmet with strict security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Strict CORS policy
- Global and Redis-backed rate limiting
- Brute-force protection on login
- CSRF support (toggle with `ENABLE_CSRF=true`)
- XSS mitigation (input sanitization)
- HTTP parameter pollution protection (`hpp`)
- Prisma-based SQL injection-safe query building
- Global validation pipes with whitelist + forbidden unknown fields
- Sensitive response data sanitization (password/refresh hash never returned)
- Production-safe exception handling (no stack trace leakage)

## Folder Structure

```text
src/
  modules/
    auth/
    user/
    product/
    category/
    cart/
    order/
    address/
    admin/
  common/
  guards/
  filters/
  interceptors/
  decorators/
  middleware/
  config/
  database/
  prisma/
  main.ts
  app.module.ts
prisma/
  schema.prisma
Dockerfile
docker-compose.yml
.env.example
```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/csrf-token` (when CSRF enabled)

### User
- `GET /api/user/me`
- `PUT /api/user/me`

### Product
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)

### Category
- `GET /api/categories`
- `POST /api/categories` (admin)
- `POST /api/categories/upload-image` (admin, multipart/form-data)

### Cart
- `GET /api/cart`
- `POST /api/cart/add`
- `POST /api/cart/remove`

### Order
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

### Admin
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/products`
- `GET /api/admin/reports`
- `GET /api/admin/reports/z`

## Notable Technical Decisions

- Write-method validation (`POST/PUT/PATCH`) explicitly accepts both `application/json` and `multipart/form-data` to support image upload endpoints safely.
- Category image upload is isolated under `/uploads/categories` and exposed via `/api/categories/upload-image` to keep media handling separate from category CRUD payloads.

## Authentication Design

- Access token: short-lived (`15m` default)
- Refresh token: long-lived (`7d` default), stored **hashed** in DB
- Refresh token rotation: old token revoked on refresh
- Token revocation: blacklist in Redis
- Reuse attack detection: invalid refresh replay revokes all active user tokens

## Data Model

All IDs are UUID (`@db.Uuid`) and follow requested entities:

- User
- Address
- Product
- Category
- Cart
- CartItem
- Order
- OrderItem
- Token

See full schema in `prisma/schema.prisma`.

## Local Setup (Step-by-Step)

1. Copy environment variables:
   - `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`)
2. Install dependencies:
   - `npm install`
3. Start PostgreSQL + Redis:
   - `docker compose up -d postgres redis`
4. Generate Prisma client:
   - `npm run prisma:generate`
5. Apply migrations:
   - `npm run prisma:migrate`
6. Run backend:
   - `npm run start:dev`

App runs at `http://localhost:3000` with API prefix `/api`.

## Full Docker Run

```bash
docker compose up --build
```

This starts:
- backend (`3000`)
- postgres (`5432`)
- redis (`6379`)

## Production Notes

- Use strong 32+ char JWT secrets
- Keep `NODE_ENV=production`
- Set `ENABLE_CSRF=true` if browser session/cookie flows are used
- Enforce HTTPS behind reverse proxy / load balancer
- Use managed PostgreSQL + Redis with backups and monitoring
- Add CI/CD security scans (`npm audit`, SAST, dependency scanning)
