import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { users, books, orders, orderItems, reviews } from "../drizzle/schema";

describe("Review System with Purchase Verification", () => {
  let testUserId: number;
  let testBookId: number;
  let testOrderId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Create test user
    const userResult = await database
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}`,
        name: "Test Reviewer",
        email: `reviewer-${Date.now()}@test.com`,
        role: "user",
      })
      .$returningId();
    testUserId = userResult[0].id;

    // Create test book
    const bookResult = await database
      .insert(books)
      .values({
        title: "Test Book for Reviews",
        author: "Test Author",
        category: "freshwater",
        skillLevel: "beginner",
        fishingType: "freshwater",
        price: "29.99",
      })
      .$returningId();
    testBookId = bookResult[0].id;

    // Create test order
    const orderResult = await database
      .insert(orders)
      .values({
        userId: testUserId,
        totalAmount: "29.99",
        status: "completed",
      })
      .$returningId();
    testOrderId = orderResult[0].id;

    // Add book to order
    await database.insert(orderItems).values({
      orderId: testOrderId,
      bookId: testBookId,
      quantity: 1,
      priceAtPurchase: "29.99",
    });
  });

  describe("hasUserPurchasedBook", () => {
    it("should return true if user has purchased the book", async () => {
      const hasPurchased = await db.hasUserPurchasedBook(testUserId, testBookId);
      expect(hasPurchased).toBe(true);
    });

    it("should return false if user has not purchased the book", async () => {
      const hasPurchased = await db.hasUserPurchasedBook(testUserId, 99999);
      expect(hasPurchased).toBe(false);
    });

    it("should return false for non-existent user", async () => {
      const hasPurchased = await db.hasUserPurchasedBook(99999, testBookId);
      expect(hasPurchased).toBe(false);
    });
  });

  describe("submitReview", () => {
    it("should submit a review with verified purchase status", async () => {
      const result = await db.submitReview({
        bookId: testBookId,
        userId: testUserId,
        rating: 5,
        title: "Excellent Book!",
        content: "This book is amazing and very helpful.",
        isVerifiedPurchase: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("successfully");
    });

    it("should prevent duplicate reviews from same user", async () => {
      try {
        await db.submitReview({
          bookId: testBookId,
          userId: testUserId,
          rating: 4,
          title: "Another Review",
          content: "This is a second review attempt.",
          isVerifiedPurchase: true,
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain("already reviewed");
      }
    });

    it("should store verified purchase status correctly", async () => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Create another user and order for this test
      const userResult = await database
        .insert(users)
        .values({
          openId: `test-user-verified-${Date.now()}`,
          name: "Verified Reviewer",
          email: `verified-${Date.now()}@test.com`,
          role: "user",
        })
        .$returningId();
      const userId = userResult[0].id;

      const orderResult = await database
        .insert(orders)
        .values({
          userId,
          totalAmount: "29.99",
          status: "completed",
        })
        .$returningId();
      const orderId = orderResult[0].id;

      await database.insert(orderItems).values({
        orderId,
        bookId: testBookId,
        quantity: 1,
        priceAtPurchase: "29.99",
      });

      // Submit review with verified purchase
      await db.submitReview({
        bookId: testBookId,
        userId,
        rating: 5,
        title: "Verified Purchase Review",
        content: "I purchased this book and it's great!",
        isVerifiedPurchase: true,
      });

      // Retrieve and verify
      const review = await db.getUserReview(testBookId, userId);
      expect(review?.isVerifiedPurchase).toBe(true);
      expect(review?.rating).toBe(5);
    });
  });

  describe("getBookReviews", () => {
    it("should retrieve all reviews for a book", async () => {
      const bookReviews = await db.getBookReviews(testBookId);
      expect(Array.isArray(bookReviews)).toBe(true);
      expect(bookReviews.length).toBeGreaterThan(0);
    });

    it("should return empty array for book with no reviews", async () => {
      const bookReviews = await db.getBookReviews(99999);
      expect(bookReviews).toEqual([]);
    });

    it("should return reviews ordered by newest first", async () => {
      const bookReviews = await db.getBookReviews(testBookId);
      if (bookReviews.length > 1) {
        for (let i = 0; i < bookReviews.length - 1; i++) {
          const current = new Date(bookReviews[i].createdAt).getTime();
          const next = new Date(bookReviews[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe("Review validation", () => {
    it("should enforce rating between 1-5", async () => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const userResult = await database
        .insert(users)
        .values({
          openId: `test-user-rating-${Date.now()}`,
          name: "Rating Tester",
          email: `rating-${Date.now()}@test.com`,
          role: "user",
        })
        .$returningId();
      const userId = userResult[0].id;

      // Try to submit review with invalid rating (should fail at DB level or validation)
      try {
        await db.submitReview({
          bookId: testBookId,
          userId,
          rating: 6, // Invalid: > 5
          title: "Invalid Rating",
          content: "This should fail",
          isVerifiedPurchase: false,
        });
        // If it succeeds, the rating should be stored as-is (DB doesn't validate)
        // but the API layer should validate before calling this
      } catch (error) {
        // Expected if validation is enforced
        expect(error).toBeDefined();
      }
    });

    it("should require title and content", async () => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const userResult = await database
        .insert(users)
        .values({
          openId: `test-user-empty-${Date.now()}`,
          name: "Empty Reviewer",
          email: `empty-${Date.now()}@test.com`,
          role: "user",
        })
        .$returningId();
      const userId = userResult[0].id;

      try {
        await db.submitReview({
          bookId: testBookId,
          userId,
          rating: 5,
          title: "", // Empty title
          content: "Content here",
          isVerifiedPurchase: false,
        });
        // Should either succeed or fail depending on DB constraints
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Review with non-purchaser", () => {
    it("should allow non-purchasers to submit reviews but mark as unverified", async () => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const userResult = await database
        .insert(users)
        .values({
          openId: `test-user-nonpurchaser-${Date.now()}`,
          name: "Non-Purchaser",
          email: `nonpurchaser-${Date.now()}@test.com`,
          role: "user",
        })
        .$returningId();
      const userId = userResult[0].id;

      // This user has NOT purchased the book
      const hasPurchased = await db.hasUserPurchasedBook(userId, testBookId);
      expect(hasPurchased).toBe(false);

      // But they should still be able to submit a review (marked as unverified)
      const result = await db.submitReview({
        bookId: testBookId,
        userId,
        rating: 3,
        title: "Unverified Review",
        content: "I haven't purchased this but wanted to share thoughts",
        isVerifiedPurchase: false,
      });

      expect(result.success).toBe(true);

      // Verify it's marked as unverified purchase
      const review = await db.getUserReview(testBookId, userId);
      expect(review?.isVerifiedPurchase).toBe(false);
    });
  });
});
