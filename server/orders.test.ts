import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as db from "./db";

describe("Orders API", () => {
  let testUserId: number;
  let testBookId: number;
  let testOrderId: number;

  beforeAll(async () => {
    // Create test user with unique ID
    testUserId = Math.floor(Math.random() * 1000000);
    await db.upsertUser({
      openId: `test-order-user-${Date.now()}`,
      name: "Test Order User",
      email: `test-order-${Date.now()}@example.com`,
      loginMethod: "email",
    });

    // Create test book
    const bookResult = await db.createBook({
      title: "Test Fishing Guide",
      description: "A test fishing guide for orders",
      author: "Test Author",
      category: "general",
      skillLevel: "beginner",
      fishingType: "both",
      price: "29.99",
      coverImageUrl: "https://example.com/cover.jpg",
    });
    testBookId = bookResult.id;
  });

  it("should create an order with items", async () => {
    const orderResult = await db.createOrder({
      userId: testUserId,
      totalAmount: "29.99",
      bookIds: [testBookId],
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.userId).toBe(testUserId);
    expect(orderResult.totalAmount).toBe("29.99");
    expect(orderResult.status).toBe("completed");
    testOrderId = orderResult.id;
  });

  it("should retrieve user orders with items", async () => {
    const orders = await db.getUserOrdersWithItems(testUserId);

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);

    const order = orders[0];
    expect(order.userId).toBe(testUserId);
    expect(order.items).toBeDefined();
    expect(Array.isArray(order.items)).toBe(true);
  });

  it("should retrieve order details with items", async () => {
    const order = await db.getOrderWithItems(testOrderId);

    expect(order).toBeDefined();
    expect(order.id).toBe(testOrderId);
    expect(order.userId).toBe(testUserId);
    expect(order.items).toBeDefined();
    expect(order.items.length).toBeGreaterThan(0);

    const item = order.items[0];
    expect(item.bookTitle).toBeDefined();
    expect(item.priceAtPurchase).toBeDefined();
  });

  it("should retrieve user orders without items", async () => {
    const orders = await db.getUserOrders(testUserId);

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);

    const order = orders[0];
    expect(order.userId).toBe(testUserId);
    expect(order.status).toBe("completed");
  });

  it("should return empty array for non-existent user", async () => {
    const orders = await db.getUserOrders(999999);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(0);
  });

  it("should handle order with Stripe payment intent ID", async () => {
    const orderResult = await db.createOrder({
      userId: testUserId,
      totalAmount: "49.99",
      stripePaymentIntentId: "pi_test_123456",
      bookIds: [testBookId],
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.status).toBe("completed");
  });
});
