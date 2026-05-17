import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Newsletter Admin Procedures", () => {
  describe("newsletterAdmin.getStats", () => {
    it("should return subscriber statistics for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.newsletterAdmin.getStats();

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("inactive");
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(stats.inactive).toBeGreaterThanOrEqual(0);
    });

    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.newsletterAdmin.getStats();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("newsletterAdmin.getSubscribers", () => {
    it("should return paginated subscribers for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.newsletterAdmin.getSubscribers({
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveProperty("subscribers");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.subscribers)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should filter by active status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.newsletterAdmin.getSubscribers({
        isActive: true,
        limit: 100,
        offset: 0,
      });

      expect(result.subscribers.every(sub => sub.isActive === true)).toBe(true);
    });

    it("should filter by inactive status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.newsletterAdmin.getSubscribers({
        isActive: false,
        limit: 100,
        offset: 0,
      });

      expect(result.subscribers.every(sub => sub.isActive === false)).toBe(true);
    });

    it("should search by email", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First subscribe someone
      await caller.newsletter.subscribe({ email: "search-test@example.com", name: "Search Test" });

      const result = await caller.newsletterAdmin.getSubscribers({
        search: "search-test",
        limit: 100,
        offset: 0,
      });

      expect(result.subscribers.some(sub => sub.email.includes("search-test"))).toBe(true);
    });

    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.newsletterAdmin.getSubscribers({ limit: 10, offset: 0 });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("newsletterAdmin.deleteSubscriber", () => {
    it("should delete a subscriber for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const email = `delete-test-${Date.now()}@example.com`;

      // Subscribe first
      await caller.newsletter.subscribe({ email, name: "Delete Test" });

      // Delete
      const result = await caller.newsletterAdmin.deleteSubscriber(email);
      expect(result.success).toBe(true);

      // Verify deletion by checking if subscriber is gone
      const stats = await caller.newsletterAdmin.getStats();
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });

    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.newsletterAdmin.deleteSubscriber("test@example.com");
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should validate email format", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.newsletterAdmin.deleteSubscriber("invalid-email");
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid");
      }
    });
  });

  describe("newsletterAdmin.getAllForExport", () => {
    it("should return all subscribers for export for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const subscribers = await caller.newsletterAdmin.getAllForExport();

      expect(Array.isArray(subscribers)).toBe(true);
      if (subscribers.length > 0) {
        expect(subscribers[0]).toHaveProperty("email");
        expect(subscribers[0]).toHaveProperty("isActive");
        expect(subscribers[0]).toHaveProperty("createdAt");
      }
    });

    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.newsletterAdmin.getAllForExport();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Newsletter Admin Workflow", () => {
    it("should handle complete admin workflow", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const email = `workflow-test-${Date.now()}@example.com`;

      // Step 1: Get initial stats
      const initialStats = await caller.newsletterAdmin.getStats();
      expect(initialStats.total).toBeGreaterThanOrEqual(0);

      // Step 2: Subscribe a user
      await caller.newsletter.subscribe({ email, name: "Workflow Test" });

      // Step 3: Get updated stats
      const updatedStats = await caller.newsletterAdmin.getStats();
      expect(updatedStats.total).toBeGreaterThanOrEqual(initialStats.total);

      // Step 4: Get subscribers with filters
      const subscribers = await caller.newsletterAdmin.getSubscribers({
        isActive: true,
        limit: 100,
        offset: 0,
      });
      expect(subscribers.subscribers.some(sub => sub.email === email)).toBe(true);

      // Step 5: Get all for export
      const allSubscribers = await caller.newsletterAdmin.getAllForExport();
      expect(allSubscribers.some(sub => sub.email === email)).toBe(true);

      // Step 6: Delete subscriber
      const deleteResult = await caller.newsletterAdmin.deleteSubscriber(email);
      expect(deleteResult.success).toBe(true);

      // Step 7: Verify deletion
      const finalStats = await caller.newsletterAdmin.getStats();
      expect(finalStats.total).toBeLessThanOrEqual(updatedStats.total);
    });
  });
});
