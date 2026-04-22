import { Router } from "express";
import { createClubSchema } from "@gear/shared";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { badRequest } from "../lib/AppError";
import { validate } from "../middleware/validate";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const clubRouter = Router();

clubRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const clubs = await prisma.club.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true },
    });
    res.json(clubs);
  }),
);

clubRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validate({ body: createClubSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const existing = await prisma.club.findUnique({ where: { slug: data.slug } });
    if (existing) throw badRequest("Club slug already in use");

    const club = await prisma.club.create({ data });
    res.status(201).json(club);
  }),
);
