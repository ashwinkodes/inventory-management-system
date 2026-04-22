import { z } from "zod";
import { GEAR_CATEGORIES, GEAR_CONDITIONS, USER_ROLES } from "./constants";

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  clubIds: z.array(z.string()).min(1, "Select at least one club"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// Gear
export const createGearSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  category: z.enum(GEAR_CATEGORIES),
  description: z.string().max(1000).optional(),
  condition: z.enum(GEAR_CONDITIONS).default("GOOD"),
  size: z.string().max(50).optional(),
  weight: z.string().max(50).optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  ownerClubId: z.string(),
  notes: z.string().max(1000).optional(),
  quantity: z.number().int().positive().default(1),
});

export const updateGearSchema = createGearSchema.partial();

export const gearVisibilitySchema = z.object({
  clubIds: z.array(z.string()),
});

// Requests
export const createRequestSchema = z.object({
  clubId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  tripName: z.string().max(200).optional(),
  purpose: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        gearId: z.string(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .min(1, "Add at least one item"),
});

export const reviewRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().max(1000).optional(),
});

export const checkoutSchema = z.object({
  itemIds: z.array(z.string()).min(1),
});

export const checkinSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        condition: z.enum(GEAR_CONDITIONS).optional(),
        damageNotes: z.string().max(1000).optional(),
      }),
    )
    .min(1),
});

export const updateRequestItemsSchema = z.object({
  items: z
    .array(
      z.object({
        gearId: z.string(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .min(1),
});

// Users
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  clubIds: z.array(z.string()).optional(),
});

// Clubs
export const createClubSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateGearInput = z.infer<typeof createGearSchema>;
export type UpdateGearInput = z.infer<typeof updateGearSchema>;
export type GearVisibilityInput = z.infer<typeof gearVisibilitySchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type UpdateRequestItemsInput = z.infer<typeof updateRequestItemsSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
