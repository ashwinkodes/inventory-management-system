import { Request } from "express";

/** Extract a route parameter as a string (Express v5 returns string | string[]) */
export function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}
