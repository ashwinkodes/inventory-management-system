import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema } from "zod";

type Sources = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

/**
 * Validate and replace req.body / req.query / req.params with parsed values.
 * Errors propagate to the central error handler (which maps ZodError → 400).
 */
export function validate(schemas: Sources): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      next(err);
    }
  };
}
