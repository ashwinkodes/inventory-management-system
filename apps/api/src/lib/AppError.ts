export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, "BAD_REQUEST", details);
export const unauthorized = (message = "Not authenticated") =>
  new AppError(401, message, "UNAUTHORIZED");
export const forbidden = (message = "Forbidden") => new AppError(403, message, "FORBIDDEN");
export const notFound = (message = "Not found") => new AppError(404, message, "NOT_FOUND");
export const conflict = (message: string, details?: unknown) =>
  new AppError(409, message, "CONFLICT", details);
