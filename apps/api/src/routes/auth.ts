import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@gear/shared";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { logger } from "../lib/logger";
import { badRequest, forbidden, unauthorized } from "../lib/AppError";
import {
  SESSION_COOKIE,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  revokeSession,
} from "../lib/sessions";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw badRequest("Email already registered");

    const clubs = await prisma.club.findMany({ where: { id: { in: data.clubIds } } });
    if (clubs.length !== data.clubIds.length) throw badRequest("Invalid club selection");

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        clubs: { create: data.clubIds.map((clubId: string) => ({ clubId })) },
      },
    });

    res.status(201).json({
      message: "Registration successful. Awaiting admin approval.",
      userId: user.id,
    });
  }),
);

authRouter.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body;

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { clubs: { select: { clubId: true } } },
    });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw unauthorized("Invalid email or password");
    }
    if (!user.isApproved) throw forbidden("Account pending admin approval");

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(res, token, expiresAt);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clubIds: user.clubs.map((c) => c.clubId),
      },
    });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) await revokeSession(token);
    clearSessionCookie(res);
    res.json({ message: "Logged out" });
  }),
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString("hex");
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      logger.info({ email, token }, "Password reset token issued");
    }

    // Always return the same response to prevent email enumeration
    res.json({ message: "If that email exists, a reset link has been created" });
  }),
);

authRouter.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw badRequest("Invalid or expired reset link");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
      prisma.session.deleteMany({ where: { userId: reset.userId } }),
    ]);

    res.json({ message: "Password reset successful" });
  }),
);

authRouter.post(
  "/change-password",
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw unauthorized("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ message: "Password changed successfully" });
  }),
);
