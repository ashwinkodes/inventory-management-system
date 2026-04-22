import { env } from "./config/env";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { asyncHandler } from "./lib/asyncHandler";

import { authRouter } from "./routes/auth";
import { gearRouter } from "./routes/gear";
import { requestRouter } from "./routes/requests";
import { userRouter } from "./routes/users";
import { clubRouter } from "./routes/clubs";
import { dashboardRouter } from "./routes/dashboard";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Allow /uploads images to be loaded cross-origin by the web app in dev.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger }));

  // Global baseline rate limit; stricter limiter layered on /api/auth below.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.use("/api/auth", authRouter);
  app.use("/api/gear", gearRouter);
  app.use("/api/requests", requestRouter);
  app.use("/api/users", userRouter);
  app.use("/api/clubs", clubRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.get(
    "/api/health",
    asyncHandler(async (_req, res) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", db: "ok" });
      } catch {
        res.status(503).json({ status: "degraded", db: "down" });
      }
    }),
  );

  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`API server running on port ${env.PORT}`);
  });
}
