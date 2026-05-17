import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Newsletter Integration Tests", () => {
  describe("newsletter.subscribe procedure", () => {
    it("should subscribe a new email via tRPC", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `integration-test-${Date.now()}@example.com`;
      
      const result = await caller.newsletter.subscribe({
        email,
        name: "Test User",
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe(email);
    });

    it("should validate email format", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.newsletter.subscribe({
          email: "invalid-email",
          name: "Test User",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid");
      }
    });

    it("should handle subscription without name", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `integration-test-${Date.now()}@example.com`;
      
      const result = await caller.newsletter.subscribe({
        email,
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe(email);
    });

    it("should allow resubscription after unsubscribe", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `integration-test-${Date.now()}@example.com`;
      
      // Subscribe
      const subscribe1 = await caller.newsletter.subscribe({
        email,
        name: "Test User",
      });
      expect(subscribe1.success).toBe(true);
      
      // Unsubscribe
      const unsubscribe = await caller.newsletter.unsubscribe(email);
      expect(unsubscribe.success).toBe(true);
      
      // Resubscribe
      const subscribe2 = await caller.newsletter.subscribe({
        email,
        name: "Test User",
      });
      expect(subscribe2.success).toBe(true);
      expect(subscribe2.email).toBe(email);
    });
  });

  describe("newsletter.unsubscribe procedure", () => {
    it("should unsubscribe an email via tRPC", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `integration-test-${Date.now()}@example.com`;
      
      // Subscribe first
      await caller.newsletter.subscribe({
        email,
        name: "Test User",
      });
      
      // Unsubscribe
      const result = await caller.newsletter.unsubscribe(email);
      expect(result.success).toBe(true);
    });

    it("should validate email format on unsubscribe", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.newsletter.unsubscribe("invalid-email");
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid");
      }
    });
  });

  describe("Newsletter workflow", () => {
    it("should handle complete newsletter signup workflow", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `workflow-test-${Date.now()}@example.com`;
      const name = "Workflow Test User";
      
      // Step 1: Subscribe
      const subscribeResult = await caller.newsletter.subscribe({
        email,
        name,
      });
      expect(subscribeResult.success).toBe(true);
      expect(subscribeResult.email).toBe(email);
      
      // Step 2: Attempt to subscribe again (should be idempotent)
      const resubscribeResult = await caller.newsletter.subscribe({
        email,
        name,
      });
      expect(resubscribeResult.success).toBe(true);
      expect(resubscribeResult.email).toBe(email);
      
      // Step 3: Unsubscribe
      const unsubscribeResult = await caller.newsletter.unsubscribe(email);
      expect(unsubscribeResult.success).toBe(true);
      
      // Step 4: Resubscribe
      const finalSubscribeResult = await caller.newsletter.subscribe({
        email,
        name: "Updated Name",
      });
      expect(finalSubscribeResult.success).toBe(true);
      expect(finalSubscribeResult.email).toBe(email);
    });
  });
});
