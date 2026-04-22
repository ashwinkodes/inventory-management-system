FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm --filter @gear/shared build
RUN pnpm --filter @gear/api db:generate
RUN pnpm --filter @gear/api build
# Point shared package to compiled output for production Node.js runtime
RUN sed -i 's|"./src/index.ts"|"./dist/index.js"|g' packages/shared/package.json

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/packages packages/
COPY --from=builder /app/apps/api/dist apps/api/dist/
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/prisma apps/api/prisma/
COPY --from=builder /app/apps/api/node_modules apps/api/node_modules/

RUN mkdir -p /app/uploads/gear-images

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
