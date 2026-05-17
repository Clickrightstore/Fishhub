import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Books table - stores all fishing ebooks available on the platform
 */
export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  author: varchar("author", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["deep_sea", "fly_fishing", "freshwater", "saltwater", "ice_fishing", "general"]).notNull(),
  skillLevel: mysqlEnum("skillLevel", ["beginner", "intermediate", "advanced", "expert"]).notNull(),
  fishingType: mysqlEnum("fishingType", ["saltwater", "freshwater", "both"]).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  coverImageUrl: varchar("coverImageUrl", { length: 512 }),
  fileUrl: varchar("fileUrl", { length: 512 }),
  tableOfContents: text("tableOfContents"),
  isFlagship: boolean("isFlagship").default(false),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: int("reviewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

/**
 * Orders table - tracks book purchases
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * OrderItems table - individual books in an order
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  bookId: int("bookId").notNull(),
  quantity: int("quantity").default(1),
  priceAtPurchase: decimal("priceAtPurchase", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Reviews table - user reviews and ratings for books
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  isVerifiedPurchase: boolean("isVerifiedPurchase").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * CommunityPosts table - catch logs and trophy board posts
 */
export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  species: varchar("species", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  length: decimal("length", { precision: 8, scale: 2 }),
  catchDate: timestamp("catchDate"),
  photoUrl: varchar("photoUrl", { length: 512 }),
  description: text("description"),
  likes: int("likes").default(0),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

/**
 * UserProfiles table - extended user information
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  fishingLevel: mysqlEnum("fishingLevel", ["beginner", "intermediate", "advanced", "expert"]),
  favoriteLocations: text("favoriteLocations"),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * NewsletterSubscribers table - email subscribers for marketing and announcements
 */
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

/**
 * Manual Payment Configuration - stores bank details for manual payments
 */
export const paymentConfig = mysqlTable("paymentConfig", {
  id: int("id").autoincrement().primaryKey(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  accountHolder: varchar("accountHolder", { length: 255 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  branchCode: varchar("branchCode", { length: 50 }),
  reference: varchar("reference", { length: 255 }).notNull(),
  instructions: text("instructions"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentConfig = typeof paymentConfig.$inferSelect;
export type InsertPaymentConfig = typeof paymentConfig.$inferInsert;

/**
 * Manual Payments table - tracks manual payment requests and status
 */
export const manualPayments = mysqlTable("manualPayments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "verified", "failed"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).default("bank_transfer").notNull(),
  transactionReference: varchar("transactionReference", { length: 255 }),
  notes: text("notes"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManualPayment = typeof manualPayments.$inferSelect;
export type InsertManualPayment = typeof manualPayments.$inferInsert;

/**
 * SiteStats table - tracks site-wide statistics like visitor count
 */
export const siteStats = mysqlTable("siteStats", {
  id: int("id").autoincrement().primaryKey(),
  totalVisitors: int("totalVisitors").default(0).notNull(),
  totalPageViews: int("totalPageViews").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type SiteStat = typeof siteStats.$inferSelect;
export type InsertSiteStat = typeof siteStats.$inferInsert;
