# Movies Backend API

REST API built with NestJS v11 for managing a movie catalog, with JWT authentication, role-based access control (RBAC), and automatic synchronization with the [Star Wars API (SWAPI)](https://swapi.dev).

## Tech Stack

- **Framework**: NestJS v11 + TypeScript
- **Database**: PostgreSQL + TypeORM
- **Auth**: JWT via `@nestjs/jwt` + `passport-jwt`
- **Validation**: `class-validator` + `class-transformer`
- **Docs**: Swagger UI (`@nestjs/swagger`) at `/api/docs`
- **Deploy**: Vercel (serverless) + Neon PostgreSQL

## Prerequisites

- Node.js 20+
- PostgreSQL running locally

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 3. Create the database
psql -U postgres -c "CREATE DATABASE movies_db;"

# 4. Start in development mode (auto-sync schema)
npm run start:dev
```

The API will be available at `http://localhost:3000`.
Swagger docs at `http://localhost:3000/api/docs`.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `secret` |
| `DB_NAME` | Database name | `movies_db` |
| `DATABASE_URL` | Full connection string (overrides above, used in production) | `postgresql://...` |
| `JWT_SECRET` | Secret for signing JWT tokens | `a-long-random-string` |
| `JWT_EXPIRES_IN` | Token expiry | `3600s` |
| `PORT` | HTTP port | `3000` |

## Running Tests

```bash
# Unit tests (21 tests)
npm test

# E2E tests — requires a running PostgreSQL instance
npm run test:e2e

# Coverage report
npm run test:cov
```

> E2E tests use the same database configured in `.env`. Each test suite registers its own users.

## API Endpoints

### Auth

| Method | Path | Description | Auth required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and get JWT token | No |

### Movies

| Method | Path | Description | Role required |
|---|---|---|---|
| `GET` | `/movies` | List all movies | Any authenticated |
| `GET` | `/movies/:id` | Get movie details | Any authenticated |
| `POST` | `/movies` | Create a movie | `admin` |
| `PATCH` | `/movies/:id` | Update a movie | `admin` |
| `DELETE` | `/movies/:id` | Delete a movie | `admin` |
| `POST` | `/movies/sync` | Sync movies from SWAPI | `admin` |

### Authentication flow

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123","role":"admin"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
# Returns: { "access_token": "eyJ..." }

# Use the token
curl http://localhost:3000/movies \
  -H "Authorization: Bearer eyJ..."
```

## Deployment (Vercel + Neon)

1. **Create a Neon database** at [neon.tech](https://neon.tech) and copy the connection string.

2. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

3. **Set environment variables** in the Vercel Dashboard:
   - `DATABASE_URL` — Neon connection string
   - `JWT_SECRET` — random secret string
   - `JWT_EXPIRES_IN` — e.g. `3600s`

The `vercel.json` cron job calls `POST /movies/sync` daily at midnight to keep the movie catalog in sync with SWAPI.

## Project Structure

```
src/
├── app.module.ts
├── bootstrap.ts          ← NestJS app factory (used by Vercel handler)
├── main.ts               ← Local dev entry point
├── config/
│   └── typeorm.config.ts
├── auth/                 ← JWT auth (register, login)
├── movies/               ← Movies CRUD + SWAPI sync
└── common/
    ├── enums/role.enum.ts
    ├── decorators/roles.decorator.ts
    └── guards/           ← JwtAuthGuard, RolesGuard
api/
└── index.ts              ← Vercel serverless handler
```
