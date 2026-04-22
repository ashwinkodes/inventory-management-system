export const GEAR_CATEGORIES = [
  "Backpacks",
  "Tents",
  "Sleeping Bags",
  "Sleeping Mats",
  "Cooking",
  "Climbing",
  "Safety",
  "Navigation",
  "Lighting",
  "Clothing",
  "Footwear",
  "Paddling",
  "Other",
] as const;

export type GearCategory = (typeof GEAR_CATEGORIES)[number];

export const GEAR_CONDITIONS = [
  "NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
  "RETIRED",
] as const;

export type GearCondition = (typeof GEAR_CONDITIONS)[number];

export const REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "CHECKED_OUT",
  "RETURNED",
  "REJECTED",
  "CANCELLED",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ITEM_STATUSES = [
  "PENDING",
  "APPROVED",
  "CHECKED_OUT",
  "RETURNED",
  "DAMAGED",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const USER_ROLES = ["ADMIN", "MEMBER"] as const;

export type UserRole = (typeof USER_ROLES)[number];
