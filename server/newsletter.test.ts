import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";

describe("Newsletter", () => {
  describe("subscribeToNewsletter", () => {
    it("should subscribe a new email to the newsletter", async () => {
      const email = `test-${Date.now()}@example.com`;
      const name = "Test User";

      const result = await db.subscribeToNewsletter(email, name);

      expect(result.email).toBe(email);
      expect(result.name).toBe(name);
      expect(result.isActive).toBe(true);
    });

    it("should handle email without name", async () => {
      const email = `test-${Date.now()}@example.com`;

      const result = await db.subscribeToNewsletter(email);

      expect(result.email).toBe(email);
      expect(result.isActive).toBe(true);
    });

    it("should reactivate an unsubscribed email", async () => {
      const email = `test-${Date.now()}@example.com`;

      // First subscription
      await db.subscribeToNewsletter(email, "Test User");

      // Unsubscribe
      await db.unsubscribeFromNewsletter(email);

      // Resubscribe
      const result = await db.subscribeToNewsletter(email, "Test User");

      expect(result.email).toBe(email);
      expect(result.isActive).toBe(true);
    });
  });

  describe("unsubscribeFromNewsletter", () => {
    it("should unsubscribe an email from the newsletter", async () => {
      const email = `test-${Date.now()}@example.com`;

      // Subscribe first
      await db.subscribeToNewsletter(email, "Test User");

      // Unsubscribe
      await db.unsubscribeFromNewsletter(email);

      // Verify unsubscribed (by checking it's not in active list)
      const activeSubscribers = await db.getNewsletterSubscribers();
      const isStillActive = activeSubscribers.some(sub => sub.email === email);

      expect(isStillActive).toBe(false);
    });
  });

  describe("getNewsletterSubscribers", () => {
    it("should return only active subscribers", async () => {
      const email1 = `test-${Date.now()}-1@example.com`;
      const email2 = `test-${Date.now()}-2@example.com`;

      // Subscribe two users
      await db.subscribeToNewsletter(email1, "User 1");
      await db.subscribeToNewsletter(email2, "User 2");

      // Unsubscribe one
      await db.unsubscribeFromNewsletter(email2);

      // Get active subscribers
      const activeSubscribers = await db.getNewsletterSubscribers();

      // Check that only email1 is in the list
      const email1Exists = activeSubscribers.some(sub => sub.email === email1);
      const email2Exists = activeSubscribers.some(sub => sub.email === email2);

      expect(email1Exists).toBe(true);
      expect(email2Exists).toBe(false);
    });
  });
});
