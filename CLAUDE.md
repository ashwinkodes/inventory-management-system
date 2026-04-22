# CLAUDE.md

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **API**: Express 4 + Prisma 6 + PostgreSQL 16, session auth via HTTP-only cookie
- **Web**: React 18 + Vite 6 + TailwindCSS 3 + shadcn/ui (Radix primitives) + React Query 5 + React Router 6 + React Hook Form + Zod
- **Shared**: `@gear/shared` exports Zod schemas, enums, and type definitions used by both sides
- **Tooling**: ESLint 9 (flat config), Prettier 3, Vitest, Node 20+

## Layout

```
apps/
  api/                        Express API
    src/
      config/env.ts           Zod-validated env (throws on boot if invalid)
      lib/
        prisma.ts             Prisma client singleton
        logger.ts             Pino logger (pretty in dev, JSON in prod)
        AppError.ts           HTTP error class + helpers (badRequest, unauthorized, ...)
        asyncHandler.ts       Express async-to-middleware wrapper
        sessions.ts           Create/set/clear/revoke session cookies
        params.ts             Type-safe req.params accessor
      middleware/
        auth.ts               requireAuth, requireAdmin, requireClubMember
        validate.ts           Zod body/query/params validator
        errorHandler.ts       Central error handler (mounted last)
        upload.ts             Multer config for gear images
      routes/                 auth, gear, requests, users, clubs, dashboard
      scripts/seed.ts         Test data seeder
      server.ts               createApp() factory + listen
    prisma/schema.prisma      DB schema (do not modify lightly)

  web/                        React app
    src/
      lib/
        api.ts                Typed fetch wrapper + ApiError
        query-client.ts       React Query client (centralised config)
        utils.ts              cn() helper (clsx + tailwind-merge)
      components/ui/          shadcn components (Radix-backed)
      components/             App-level components (Layout, ProtectedRoute, etc.)
      contexts/               AuthContext, ClubContext
      pages/                  Route components (admin/* for admin routes)
      App.tsx, main.tsx, index.css

packages/
  shared/                     Zod schemas + enums (no build step, TS source)
  eslint-config/              Flat config: base / react / node
  typescript-config/          Base tsconfigs: base / node / react
```

## Commands

- `pnpm dev` — web (5173) + api (3001) in watch mode
- `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm db:push` / `pnpm db:migrate` / `pnpm db:studio` / `pnpm db:seed`
- Run a single workspace task: `pnpm --filter @gear/api <script>`

## Conventions

- **Writing a new API route**: wrap the handler in `asyncHandler`, validate with `validate({ body: <schema> })`, throw `AppError`s (or the helpers `badRequest`, `unauthorized`, etc.) — never call `res.status(...).json(...)` for errors. The error middleware handles the rest.
- **Sharing a schema**: add to [packages/shared/src/schemas.ts](packages/shared/src/schemas.ts) and export its inferred type. Use on both sides.
- **Route params**: read with `param(req, "id")` — Express 5 types treat params as `string | string[]`.
- **Logging**: import `logger` from [apps/api/src/lib/logger.ts](apps/api/src/lib/logger.ts); don't use `console.log`. `pino-http` automatically logs request/response.
- **Web UI**: prefer shadcn components in `@/components/ui/`. The Dialog uses the standard Radix API (`<Dialog open={o} onOpenChange={...}><DialogContent>...</DialogContent></Dialog>`).
- **Toasts**: `import { toast } from "sonner"` — `toast.success(...)`, `toast.error(...)`.
- **File imports in web**: use `@/...` (aliased to `src/`).
- **Naming**: PascalCase components, camelCase funcs/vars, SCREAMING_SNAKE_CASE enums/constants.

## Dev setup

- Postgres runs in Docker: `docker compose up -d db`
- API and web run on the host: `pnpm dev`
- Seed test accounts: `admin@example.com/admin123`, `member@example.com/member123`, `pending@example.com/pending123`
- Schema changes: edit `apps/api/prisma/schema.prisma`, then `pnpm db:push` (dev) or `pnpm db:migrate` (to create a migration).

## Production

`docker compose --profile prod up -d` runs the full stack (db + api + web-on-nginx). Default `docker compose up -d` brings up Postgres only — ideal for dev.

## Gotchas

- **Session cookie requires `secure: true` in production** — works only behind HTTPS. For local dev, `NODE_ENV` being anything other than `production` disables the flag.
- **Image uploads** live in `apps/api/uploads/` (volume-mounted in Docker). Helmet's `crossOriginResourcePolicy` is set to `cross-origin` so the web app can load them.
- **The shared package** is TS-source-only (no build step); consumers import directly from `./src/index.ts`. Keep it ESM-friendly (no Node built-ins).
