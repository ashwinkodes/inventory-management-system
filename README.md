# Gear Inventory

Outdoor-gear rental management for university clubs (AUTC, AURAC, AUCC). Members browse and request gear; admins manage inventory, approve requests, and track check-in/out.

Full-stack TypeScript monorepo: React + Vite frontend, Express + Prisma API, PostgreSQL database.

## Quickstart

Requirements: **Node 20+**, **pnpm 9+**, **Docker** (for Postgres).

```bash
git clone <repo> && cd inventory-management-system

cp apps/api/.env.example apps/api/.env
pnpm install

docker compose up -d db          # start Postgres only
pnpm --filter @gear/api db:push  # apply schema
pnpm db:seed                     # seed test data

pnpm dev                         # web on :5173, api on :3001
```

Open <http://localhost:5173>. Log in with one of the seeded accounts:

| Role    | Email                  | Password    |
| ------- | ---------------------- | ----------- |
| Admin   | `admin@example.com`    | `admin123`  |
| Member  | `member@example.com`   | `member123` |
| Pending | `pending@example.com`  | `pending123` (awaits admin approval) |

## Scripts

Run from the repository root:

| Command              | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `pnpm dev`           | Run web + api in watch mode (turbo)            |
| `pnpm build`         | Build all workspaces                           |
| `pnpm lint`          | ESLint across all workspaces                   |
| `pnpm typecheck`     | `tsc --noEmit` across all workspaces           |
| `pnpm test`          | Vitest across all workspaces                   |
| `pnpm format`        | Prettier write                                 |
| `pnpm format:check`  | Prettier check (CI-friendly)                   |
| `pnpm db:push`       | Push Prisma schema to DB                       |
| `pnpm db:migrate`    | Create/apply a Prisma migration                |
| `pnpm db:studio`     | Open Prisma Studio (DB browser)                |
| `pnpm db:seed`       | Seed test clubs, users, and gear               |

## Workspace layout

```
apps/
  api/          Express + Prisma API           (@gear/api)
  web/          React + Vite frontend          (@gear/web)
packages/
  shared/       Zod schemas, enums, types      (@gear/shared)
  eslint-config/  Shared ESLint flat config    (@gear/eslint-config)
  typescript-config/  Base tsconfigs           (@gear/typescript-config)
```

## Architecture

- **Auth**: Session-in-cookie (HTTP-only, SameSite=Lax), sessions stored in the DB with 7-day expiry. Admin approval is required for new registrations.
- **Multi-club model**: AUTC/AURAC share gear via the `GearVisibility` table; AUCC is independent. The owner club always has implicit access.
- **Request lifecycle**: `PENDING → APPROVED → CHECKED_OUT → RETURNED` (or `REJECTED`/`CANCELLED`). Admins can modify items on a pending/approved request.
- **Validation**: Zod schemas in `@gear/shared` are used by both the API (via the `validate` middleware) and the web app (via `react-hook-form` resolvers).
- **Errors**: The API throws `AppError`s; a central error handler in [apps/api/src/middleware/errorHandler.ts](apps/api/src/middleware/errorHandler.ts) maps them to JSON responses. Zod failures become 400 automatically.

## Production (Docker)

`docker compose up -d db` boots only Postgres (what you want in dev). To run the full stack in containers, use the `prod` profile:

```bash
SESSION_SECRET=$(openssl rand -hex 32) docker compose --profile prod up -d
```

That builds the api and web images and serves the frontend via nginx on port 80.

## Environment

- [apps/api/.env.example](apps/api/.env.example) — copy to `apps/api/.env`
- [apps/web/.env.example](apps/web/.env.example) — none required for local dev (Vite proxies `/api` and `/uploads` to `localhost:3001`)
