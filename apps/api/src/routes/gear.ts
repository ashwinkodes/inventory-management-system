import { Router } from "express";
import { createGearSchema, updateGearSchema, gearVisibilitySchema } from "@gear/shared";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { badRequest, notFound } from "../lib/AppError";
import { param } from "../lib/params";
import { validate } from "../middleware/validate";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { upload } from "../middleware/upload";

export const gearRouter = Router();

// Member catalog view (respects club visibility + availability)
gearRouter.get(
  "/catalog",
  requireAuth,
  asyncHandler(async (req, res) => {
    const clubId = req.query.clubId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    if (!clubId) throw badRequest("clubId query param required");

    const gear = await prisma.gearItem.findMany({
      where: {
        isActive: true,
        OR: [{ ownerClubId: clubId }, { visibleTo: { some: { clubId } } }],
      },
      include: { ownerClub: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (!startDate || !endDate) {
      res.json(gear.map((g) => ({ ...g, booked: 0, available: g.quantity })));
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const gearIds = gear.map((g) => g.id);

    const bookedItems = await prisma.requestItem.findMany({
      where: {
        gearId: { in: gearIds },
        request: {
          status: { in: ["APPROVED", "CHECKED_OUT"] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      },
      select: { gearId: true, quantity: true },
    });

    const bookedMap = new Map<string, number>();
    for (const item of bookedItems) {
      bookedMap.set(item.gearId, (bookedMap.get(item.gearId) ?? 0) + item.quantity);
    }

    res.json(
      gear.map((g) => ({
        ...g,
        booked: bookedMap.get(g.id) ?? 0,
        available: Math.max(0, g.quantity - (bookedMap.get(g.id) ?? 0)),
      })),
    );
  }),
);

// Admin catalog (unfiltered)
gearRouter.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const clubId = req.query.clubId as string | undefined;
    const gear = await prisma.gearItem.findMany({
      where: clubId ? { ownerClubId: clubId } : {},
      include: {
        ownerClub: { select: { id: true, name: true, slug: true } },
        visibleTo: { include: { club: { select: { id: true, name: true } } } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json(gear);
  }),
);

gearRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const gear = await prisma.gearItem.findUnique({
      where: { id: param(req, "id") },
      include: {
        ownerClub: { select: { id: true, name: true, slug: true } },
        visibleTo: { include: { club: { select: { id: true, name: true } } } },
      },
    });
    if (!gear) throw notFound("Gear item not found");
    res.json(gear);
  }),
);

gearRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validate({ body: createGearSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const gear = await prisma.gearItem.create({
      data: {
        name: data.name,
        brand: data.brand,
        model: data.model,
        category: data.category,
        description: data.description,
        condition: data.condition,
        size: data.size,
        weight: data.weight,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        purchasePrice: data.purchasePrice,
        ownerClubId: data.ownerClubId,
        notes: data.notes,
        quantity: data.quantity,
      },
      include: { ownerClub: { select: { id: true, name: true, slug: true } } },
    });
    res.status(201).json(gear);
  }),
);

gearRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validate({ body: updateGearSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const gear = await prisma.gearItem.update({
      where: { id: param(req, "id") },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
      include: { ownerClub: { select: { id: true, name: true, slug: true } } },
    });
    res.json(gear);
  }),
);

gearRouter.post(
  "/:id/image",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest("No image provided");
    const imageUrl = `/uploads/gear-images/${req.file.filename}`;
    const gear = await prisma.gearItem.update({
      where: { id: param(req, "id") },
      data: { imageUrl },
    });
    res.json({ imageUrl: gear.imageUrl });
  }),
);

gearRouter.put(
  "/:id/visibility",
  requireAuth,
  requireAdmin,
  validate({ body: gearVisibilitySchema }),
  asyncHandler(async (req, res) => {
    const { clubIds } = req.body;
    const gearId = param(req, "id");

    const gear = await prisma.gearItem.findUnique({ where: { id: gearId } });
    if (!gear) throw notFound("Gear item not found");

    const visibilityClubIds = clubIds.filter((id: string) => id !== gear.ownerClubId);
    await prisma.$transaction([
      prisma.gearVisibility.deleteMany({ where: { gearId } }),
      ...visibilityClubIds.map((clubId: string) =>
        prisma.gearVisibility.create({ data: { gearId, clubId } }),
      ),
    ]);

    const updated = await prisma.gearItem.findUnique({
      where: { id: gearId },
      include: { visibleTo: { include: { club: { select: { id: true, name: true } } } } },
    });
    res.json(updated);
  }),
);

gearRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.gearItem.update({
      where: { id: param(req, "id") },
      data: { isActive: false },
    });
    res.json({ message: "Gear item deactivated" });
  }),
);
