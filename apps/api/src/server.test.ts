import { describe, expect, it, vi, beforeAll } from "vitest";

// Provide required env before module import
beforeAll(() => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  process.env.SESSION_SECRET ??= "test-session-secret-long-enough";
  process.env.NODE_ENV = "test";
});

// Mock prisma so the server doesn't try to connect
vi.mock("./lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

describe("createApp", () => {
  it("mounts /api/health and returns ok when DB reachable", async () => {
    const { createApp } = await import("./server");
    const request = (await import("supertest")).default;
    const app = createApp();

    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "ok" });
  });
});
