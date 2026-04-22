import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/member",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [activeRequests, pendingRequests, totalRequests, upcomingRentals] = await Promise.all([
      prisma.request.count({
        where: { userId, status: { in: ["APPROVED", "CHECKED_OUT"] } },
      }),
      prisma.request.count({ where: { userId, status: "PENDING" } }),
      prisma.request.count({ where: { userId } }),
      prisma.request.findMany({
        where: {
          userId,
          status: { in: ["APPROVED", "CHECKED_OUT"] },
          endDate: { gte: new Date() },
        },
        include: {
          club: { select: { name: true } },
          items: { include: { gear: { select: { name: true, category: true } } } },
        },
        orderBy: { startDate: "asc" },
        take: 5,
      }),
    ]);

    res.json({ activeRequests, pendingRequests, totalRequests, upcomingRentals });
  }),
);

dashboardRouter.get(
  "/admin",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const clubId = req.query.clubId as string | undefined;
    const requestWhere: Record<string, unknown> = {};
    if (clubId) requestWhere.clubId = clubId;

    const [pendingRequests, pendingUsers, checkedOutRequests, totalGear, overdueRequests] =
      await Promise.all([
        prisma.request.count({ where: { ...requestWhere, status: "PENDING" } }),
        prisma.user.count({ where: { isApproved: false } }),
        prisma.request.count({ where: { ...requestWhere, status: "CHECKED_OUT" } }),
        prisma.gearItem.count({
          where: { isActive: true, ...(clubId ? { ownerClubId: clubId } : {}) },
        }),
        prisma.request.count({
          where: { ...requestWhere, status: "CHECKED_OUT", endDate: { lt: new Date() } },
        }),
      ]);

    const recentRequests = await prisma.request.findMany({
      where: requestWhere,
      include: {
        user: { select: { name: true, email: true } },
        club: { select: { name: true } },
        items: { include: { gear: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const overdueDetails = await prisma.request.findMany({
      where: { ...requestWhere, status: "CHECKED_OUT", endDate: { lt: new Date() } },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        club: { select: { name: true } },
        items: { include: { gear: { select: { name: true, category: true } } } },
      },
      orderBy: { endDate: "asc" },
    });

    res.json({
      pendingRequests,
      pendingUsers,
      checkedOutRequests,
      totalGear,
      overdueRequests,
      recentRequests,
      overdueDetails,
    });
  }),
);
