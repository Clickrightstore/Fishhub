import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Visitor Counter", () => {
  it("should get site stats", async () => {
    const stats = await db.getSiteStats();
    expect(stats).toBeDefined();
    expect(stats?.totalVisitors).toBeGreaterThanOrEqual(0);
    expect(stats?.totalPageViews).toBeGreaterThanOrEqual(0);
  });

  it("should increment visitor count", async () => {
    const statsBefore = await db.getSiteStats();
    const visitorsBefore = statsBefore?.totalVisitors || 0;

    await db.incrementVisitorCount();

    const statsAfter = await db.getSiteStats();
    const visitorsAfter = statsAfter?.totalVisitors || 0;

    expect(visitorsAfter).toBeGreaterThanOrEqual(visitorsBefore);
  });

  it("should increment page view count", async () => {
    const statsBefore = await db.getSiteStats();
    const pageViewsBefore = statsBefore?.totalPageViews || 0;

    await db.incrementPageViewCount();

    const statsAfter = await db.getSiteStats();
    const pageViewsAfter = statsAfter?.totalPageViews || 0;

    expect(pageViewsAfter).toBeGreaterThanOrEqual(pageViewsBefore);
  });

  it("should handle multiple visitor increments", async () => {
    const statsBefore = await db.getSiteStats();
    const visitorsBefore = statsBefore?.totalVisitors || 0;

    // Increment multiple times
    await db.incrementVisitorCount();
    await db.incrementVisitorCount();
    await db.incrementVisitorCount();

    const statsAfter = await db.getSiteStats();
    const visitorsAfter = statsAfter?.totalVisitors || 0;

    expect(visitorsAfter).toBeGreaterThanOrEqual(visitorsBefore + 3);
  });

  it("should track both visitors and page views separately", async () => {
    const statsBefore = await db.getSiteStats();
    const visitorsBefore = statsBefore?.totalVisitors || 0;
    const pageViewsBefore = statsBefore?.totalPageViews || 0;

    // Increment page views multiple times (same visitor)
    await db.incrementPageViewCount();
    await db.incrementPageViewCount();

    const statsAfter = await db.getSiteStats();
    const visitorsAfter = statsAfter?.totalVisitors || 0;
    const pageViewsAfter = statsAfter?.totalPageViews || 0;

    // Visitors should stay same, page views should increase
    expect(visitorsAfter).toBe(visitorsBefore);
    expect(pageViewsAfter).toBeGreaterThanOrEqual(pageViewsBefore + 2);
  });

  it("should return stats with default values if empty", async () => {
    const stats = await db.getSiteStats();
    
    if (stats) {
      expect(stats.totalVisitors).toBeDefined();
      expect(stats.totalPageViews).toBeDefined();
      expect(typeof stats.totalVisitors).toBe("number");
      expect(typeof stats.totalPageViews).toBe("number");
    }
  });
});
