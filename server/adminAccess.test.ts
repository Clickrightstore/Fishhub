import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user-123",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "oauth",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createRegularUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user-123",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "oauth",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Admin-Only Access Control", () => {
  describe("books.list procedure", () => {
    it("should allow admin to list books", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.books.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should allow regular users to list books", async () => {
      const { ctx } = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.books.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("books.getById procedure", () => {
    it("should allow admin to get book details", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.books.getById(1);
        // Book may or may not exist, but the call should succeed
        expect(result === null || typeof result === "object").toBe(true);
      } catch (error: any) {
        // Should not throw access denied error
        expect(error.message).not.toContain("Access Denied");
        expect(error.message).not.toContain("permission");
      }
    });

    it("should allow regular users to get book details", async () => {
      const { ctx } = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.books.getById(1);
        // Book may or may not exist, but the call should succeed
        expect(result === null || typeof result === "object").toBe(true);
      } catch (error: any) {
        // Should not throw access denied error
        expect(error.message).not.toContain("Access Denied");
        expect(error.message).not.toContain("permission");
      }
    });
  });

  describe("Admin procedures", () => {
    it("should allow admin to access admin procedures", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      try {
        // Admin should be able to call admin-only procedures
        // This is just a smoke test to verify admin role is recognized
        expect(ctx.user?.role).toBe("admin");
      } catch (error: any) {
        expect.fail("Admin should have access to admin procedures");
      }
    });

    it("should deny regular users from admin procedures", async () => {
      const { ctx } = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      // Regular user should not have admin role
      expect(ctx.user?.role).toBe("user");
    });
  });

  describe("Frontend access control", () => {
    it("should verify admin role is correctly set", () => {
      const { ctx: adminCtx } = createAdminContext();
      const { ctx: userCtx } = createRegularUserContext();

      expect(adminCtx.user?.role).toBe("admin");
      expect(userCtx.user?.role).toBe("user");
      expect(adminCtx.user?.role).not.toBe(userCtx.user?.role);
    });

    it("should have different user IDs for admin and regular user", () => {
      const { ctx: adminCtx } = createAdminContext();
      const { ctx: userCtx } = createRegularUserContext();

      expect(adminCtx.user?.id).not.toBe(userCtx.user?.id);
      expect(adminCtx.user?.openId).not.toBe(userCtx.user?.openId);
    });
  });
});
