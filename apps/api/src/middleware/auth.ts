import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { forbidden, unauthorized } from "../lib/AppError";
import { SESSION_COOKIE } from "../lib/sessions";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  clubIds: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next(unauthorized());

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { clubs: { select: { clubId: true } } } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return next(unauthorized("Session expired"));
  }

  if (!session.user.isApproved) {
    return next(forbidden("Account pending approval"));
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    clubIds: session.user.clubs.map((c) => c.clubId),
  };
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "ADMIN") {
    return next(forbidden("Admin access required"));
  }
  next();
}

export function requireClubMember(clubIdParam = "clubId") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const paramVal = req.params[clubIdParam];
    const clubId =
      (Array.isArray(paramVal) ? paramVal[0] : paramVal) || req.body?.clubId || req.query?.clubId;

    if (!clubId) return next(forbidden("Club ID required"));
    if (req.user?.role === "ADMIN") return next();
    if (!req.user?.clubIds.includes(clubId as string)) {
      return next(forbidden("Not a member of this club"));
    }
    next();
  };
}
