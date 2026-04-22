import { Router } from "express";
import { updateUserSchema } from "@gear/shared";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { param } from "../lib/params";
import { validate } from "../middleware/validate";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const userRouter = Router();

userRouter.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { approved, clubId } = req.query;
    const where: Record<string, unknown> = {};
    if (approved !== undefined) where.isApproved = approved === "true";
    if (clubId) where.clubs = { some: { clubId: clubId as string } };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isApproved: true,
        approvedAt: true,
        createdAt: true,
        clubs: { select: { club: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  }),
);

userRouter.get(
  "/pending",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        clubs: { select: { club: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  }),
);

userRouter.put(
  "/:id/approve",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: param(req, "id") },
      data: { isApproved: true, approvedBy: req.user!.id, approvedAt: new Date() },
      select: { id: true, email: true, name: true, isApproved: true },
    });
    res.json(user);
  }),
);

userRouter.delete(
  "/:id/reject",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: param(req, "id") } });
    res.json({ message: "User rejected and removed" });
  }),
);

userRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validate({ body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const id = param(req, "id");
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isApproved: true,
        clubs: { select: { club: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (data.clubIds) {
      await prisma.userClub.deleteMany({ where: { userId: id } });
      await prisma.userClub.createMany({
        data: data.clubIds.map((clubId: string) => ({ userId: id, clubId })),
      });
    }

    res.json(user);
  }),
);
