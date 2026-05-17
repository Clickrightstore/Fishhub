import { describe, expect, it, vi } from "vitest";

// Increase timeout for database operations
vi.setConfig({ testTimeout: 10000 });
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "email",
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

describe("community posts", () => {
  it("allows authenticated users to submit posts", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.community.submitPost({
      species: "Marlin",
      location: "Gulf of Mexico",
      weight: 450,
      length: 12.5,
      catchDate: new Date(),
      description: "Amazing catch!",
      photoUrl: "/manus-storage/test-photo.jpg",
    });

    expect(result).toEqual({ success: true, message: "Post submitted successfully" });
  });

  it("requires species and location", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.community.submitPost({
        species: "",
        location: "Gulf of Mexico",
        weight: null,
        length: null,
        catchDate: new Date(),
        description: "Test",
        photoUrl: null,
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Too small");
    }
  });

  it("allows optional weight and length", async () => {
    const { ctx } = createAuthContext(3);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.community.submitPost({
      species: "Tuna",
      location: "Atlantic Ocean",
      weight: null,
      length: null,
      catchDate: new Date(),
      description: "Caught a tuna",
      photoUrl: null,
    });

    expect(result).toEqual({ success: true, message: "Post submitted successfully" });
  });
});

describe("book reviews", () => {
  it("allows authenticated users to submit reviews", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.submitReview({
      bookId: 1,
      rating: 5,
      title: "Excellent guide!",
      content: "This book is comprehensive and well-written.",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("requires rating between 1 and 5", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.reviews.submitReview({
        bookId: 1,
        rating: 6,
        title: "Great book",
        content: "Really enjoyed it",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Too big");
    }
  });

  it("allows minimal review submission", async () => {
    const { ctx } = createAuthContext(3);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.submitReview({
      bookId: 1,
      rating: 4,
      title: "Good",
      content: "I liked it",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
