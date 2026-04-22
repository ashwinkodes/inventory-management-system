import { Router } from "express";
import {
  createRequestSchema,
  reviewRequestSchema,
  checkoutSchema,
  checkinSchema,
  updateRequestItemsSchema,
} from "@gear/shared";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { badRequest, conflict, forbidden, notFound } from "../lib/AppError";
import { param } from "../lib/params";
import { validate } from "../middleware/validate";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const requestRouter = Router();

const REQUEST_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  club: { select: { id: true, name: true } },
  items: {
    include: {
      gear: { select: { id: true, name: true, category: true, brand: true } },
    },
  },
} as const;

requestRouter.get(
  "/my",
  requireAuth,
  asyncHandler(async (req, res) => {
    const requests = await prisma.request.findMany({
      where: { userId: req.user!.id },
      include: {
        club: { select: { id: true, name: true } },
        items: {
          include: { gear: { select: { id: true, name: true, category: true, brand: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  }),
);

requestRouter.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { clubId, status } = req.query;
    const where: Record<string, unknown> = {};
    if (clubId) where.clubId = clubId;
    if (status) where.status = status;

    const requests = await prisma.request.findMany({
      where,
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  }),
);

requestRouter.get(
  "/calendar",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { clubId, startDate, endDate } = req.query;
    const where: Record<string, unknown> = {
      status: { in: ["APPROVED", "CHECKED_OUT"] },
    };
    if (clubId) where.clubId = clubId;
    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { lte: new Date(endDate as string) },
          endDate: { gte: new Date(startDate as string) },
        },
      ];
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        user: { select: { name: true } },
        club: { select: { name: true } },
        items: { include: { gear: { select: { name: true, category: true } } } },
      },
    });
    res.json(requests);
  }),
);

requestRouter.post(
  "/",
  requireAuth,
  validate({ body: createRequestSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;

    if (req.user!.role !== "ADMIN" && !req.user!.clubIds.includes(data.clubId)) {
      throw forbidden("Not a member of this club");
    }

    const gearIds = data.items.map((i: { gearId: string }) => i.gearId);
    const gearItems = await prisma.gearItem.findMany({
      where: {
        id: { in: gearIds },
        isActive: true,
        OR: [{ ownerClubId: data.clubId }, { visibleTo: { some: { clubId: data.clubId } } }],
      },
    });
    if (gearItems.length !== gearIds.length) throw badRequest("Some gear items are unavailable");

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) throw badRequest("End date must be after start date");

    const bookedItems = await prisma.requestItem.findMany({
      where: {
        gearId: { in: gearIds },
        request: {
          status: { in: ["APPROVED", "CHECKED_OUT"] },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      },
      select: { gearId: true, quantity: true },
    });

    const bookedMap = new Map<string, number>();
    for (const item of bookedItems) {
      bookedMap.set(item.gearId, (bookedMap.get(item.gearId) ?? 0) + item.quantity);
    }

    const gearMap = new Map(gearItems.map((g) => [g.id, g]));
    const conflictingItems: string[] = [];
    for (const reqItem of data.items) {
      const gear = gearMap.get(reqItem.gearId);
      if (!gear) continue;
      const booked = bookedMap.get(reqItem.gearId) ?? 0;
      const available = gear.quantity - booked;
      if (reqItem.quantity > available) {
        conflictingItems.push(`${gear.name} (${available} of ${gear.quantity} available)`);
      }
    }
    if (conflictingItems.length > 0) {
      throw conflict("Insufficient availability for requested dates", { conflictingItems });
    }

    const request = await prisma.request.create({
      data: {
        userId: req.user!.id,
        clubId: data.clubId,
        startDate,
        endDate,
        tripName: data.tripName,
        purpose: data.purpose,
        notes: data.notes,
        items: {
          create: data.items.map((item: { gearId: string; quantity: number }) => ({
            gearId: item.gearId,
            quantity: item.quantity,
          })),
        },
      },
      include: REQUEST_INCLUDE,
    });
    res.status(201).json(request);
  }),
);

requestRouter.put(
  "/:id/review",
  requireAuth,
  requireAdmin,
  validate({ body: reviewRequestSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const request = await prisma.request.findUnique({ where: { id: param(req, "id") } });
    if (!request) throw notFound("Request not found");
    if (request.status !== "PENDING") throw badRequest("Can only review pending requests");

    const updated = await prisma.request.update({
      where: { id: param(req, "id") },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        items:
          data.status === "APPROVED"
            ? { updateMany: { where: {}, data: { status: "APPROVED" } } }
            : undefined,
      },
      include: REQUEST_INCLUDE,
    });
    res.json(updated);
  }),
);

requestRouter.post(
  "/:id/checkout",
  requireAuth,
  requireAdmin,
  validate({ body: checkoutSchema }),
  asyncHandler(async (req, res) => {
    const { itemIds } = req.body;
    const request = await prisma.request.findUnique({
      where: { id: param(req, "id") },
      include: { items: true },
    });
    if (!request) throw notFound("Request not found");
    if (!["APPROVED", "CHECKED_OUT"].includes(request.status)) {
      throw badRequest("Request must be approved first");
    }

    await prisma.requestItem.updateMany({
      where: { id: { in: itemIds }, requestId: param(req, "id"), status: "APPROVED" },
      data: { status: "CHECKED_OUT", checkedOutAt: new Date(), checkedOutBy: req.user!.id },
    });

    await prisma.request.update({
      where: { id: param(req, "id") },
      data: { status: "CHECKED_OUT" },
    });

    const updated = await prisma.request.findUnique({
      where: { id: param(req, "id") },
      include: REQUEST_INCLUDE,
    });
    res.json(updated);
  }),
);

requestRouter.post(
  "/:id/checkin",
  requireAuth,
  requireAdmin,
  validate({ body: checkinSchema }),
  asyncHandler(async (req, res) => {
    const { items: checkinItems } = req.body;
    const request = await prisma.request.findUnique({
      where: { id: param(req, "id") },
      include: { items: true },
    });
    if (!request) throw notFound("Request not found");
    if (request.status !== "CHECKED_OUT") throw badRequest("Items must be checked out first");

    for (const item of checkinItems) {
      await prisma.requestItem.update({
        where: { id: item.id },
        data: {
          status: item.damageNotes ? "DAMAGED" : "RETURNED",
          checkedInAt: new Date(),
          checkedInBy: req.user!.id,
          conditionOnReturn: item.condition,
          damageNotes: item.damageNotes,
        },
      });

      if (item.condition) {
        const requestItem = request.items.find((ri) => ri.id === item.id);
        if (requestItem) {
          await prisma.gearItem.update({
            where: { id: requestItem.gearId },
            data: { condition: item.condition },
          });
        }
      }
    }

    const updatedItems = await prisma.requestItem.findMany({
      where: { requestId: param(req, "id") },
    });
    const allReturned = updatedItems.every((i) => ["RETURNED", "DAMAGED"].includes(i.status));

    if (allReturned) {
      await prisma.request.update({
        where: { id: param(req, "id") },
        data: { status: "RETURNED" },
      });
    }

    const updated = await prisma.request.findUnique({
      where: { id: param(req, "id") },
      include: REQUEST_INCLUDE,
    });
    res.json(updated);
  }),
);

requestRouter.put(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const request = await prisma.request.findUnique({ where: { id: param(req, "id") } });
    if (!request) throw notFound("Request not found");

    if (request.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw forbidden();
    }
    if (!["PENDING", "APPROVED"].includes(request.status)) {
      throw badRequest("Cannot cancel this request");
    }

    const updated = await prisma.request.update({
      where: { id: param(req, "id") },
      data: { status: "CANCELLED" },
    });
    res.json(updated);
  }),
);

requestRouter.put(
  "/:id/items",
  requireAuth,
  requireAdmin,
  validate({ body: updateRequestItemsSchema }),
  asyncHandler(async (req, res) => {
    const { items } = req.body;
    const request = await prisma.request.findUnique({ where: { id: param(req, "id") } });
    if (!request) throw notFound("Request not found");
    if (!["PENDING", "APPROVED"].includes(request.status)) {
      throw badRequest("Can only modify pending or approved requests");
    }

    await prisma.$transaction([
      prisma.requestItem.deleteMany({ where: { requestId: param(req, "id") } }),
      ...items.map((item: { gearId: string; quantity: number }) =>
        prisma.requestItem.create({
          data: {
            requestId: param(req, "id"),
            gearId: item.gearId,
            quantity: item.quantity,
            status: request.status === "APPROVED" ? "APPROVED" : "PENDING",
          },
        }),
      ),
    ]);

    const updated = await prisma.request.findUnique({
      where: { id: param(req, "id") },
      include: REQUEST_INCLUDE,
    });
    res.json(updated);
  }),
);
