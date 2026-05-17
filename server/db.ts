import { eq, desc, like, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, books, orders, orderItems, reviews, communityPosts, userProfiles, newsletterSubscribers, paymentConfig, manualPayments, siteStats, Book, Order, OrderItem, Review, CommunityPost, UserProfile, PaymentConfig, ManualPayment, SiteStat } from "../drizzle/schema";
import { ENV } from './_core/env';


let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function updateUserProfile(userId: number, name: string, email: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user profile: database not available");
    return;
  }

  try {
    await db.update(users).set({
      name: name || null,
      email: email || null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user profile:", error);
    throw error;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Book queries
export async function getBooks(category?: string, skillLevel?: string, fishingType?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (category) conditions.push(eq(books.category, category as any));
  if (skillLevel) conditions.push(eq(books.skillLevel, skillLevel as any));
  if (fishingType) conditions.push(eq(books.fishingType, fishingType as any));

  if (conditions.length > 0) {
    return db.select().from(books).where(and(...conditions)).orderBy(desc(books.isFlagship), desc(books.createdAt));
  }

  return db.select().from(books).orderBy(desc(books.isFlagship), desc(books.createdAt));
}

export async function getBookById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchBooks(searchQuery: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(books).where(like(books.title, `%${searchQuery}%`));
}

export async function getFlagshipBook() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(books).where(eq(books.isFlagship, true)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Order queries
export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderWithItems(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const orderData = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (orderData.length === 0) return undefined;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  
  // Fetch book details for each item
  const itemsWithBooks = await Promise.all(
    items.map(async (item) => {
      const bookData = await getBookById(item.bookId);
      return {
        ...item,
        bookTitle: bookData?.title || 'Unknown Book',
        bookDescription: bookData?.description,
        downloadUrl: bookData?.coverImageUrl, // Using coverImageUrl as the download URL for now
      };
    })
  );

  return { ...orderData[0], items: itemsWithBooks };
}

export async function getUserOrdersWithItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  
  // Fetch items and books for each order
  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      
      const itemsWithBooks = await Promise.all(
        items.map(async (item) => {
          const bookData = await getBookById(item.bookId);
          return {
            ...item,
            bookTitle: bookData?.title || 'Unknown Book',
            bookDescription: bookData?.description,
            downloadUrl: bookData?.coverImageUrl,
          };
        })
      );
      
      return { ...order, items: itemsWithBooks };
    })
  );
  
  return ordersWithItems;
}

// Review queries
export async function getBookReviews(bookId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.bookId, bookId)).orderBy(desc(reviews.createdAt));
}

export async function getUserReview(bookId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(and(eq(reviews.bookId, bookId), eq(reviews.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Community post queries
export async function getApprovedCommunityPosts(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityPosts).where(eq(communityPosts.status, "approved")).orderBy(desc(communityPosts.createdAt)).limit(limit).offset(offset);
}

export async function getUserCommunityPosts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityPosts).where(eq(communityPosts.userId, userId)).orderBy(desc(communityPosts.createdAt));
}

export async function getPendingCommunityPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityPosts).where(eq(communityPosts.status, "pending")).orderBy(desc(communityPosts.createdAt));
}

// User profile queries
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateUserProfile(userId: number, data: Partial<UserProfile>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserProfile(userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
}


// Check if user has purchased a specific book
export async function hasUserPurchasedBook(userId: number, bookId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.bookId, bookId),
        eq(orders.status, "completed")
      )
    )
    .limit(1);
  
  return result.length > 0;
}

export async function submitReview(data: {
  bookId: number;
  userId: number;
  rating: number;
  title: string;
  content: string;
  isVerifiedPurchase?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already reviewed this book
  const existingReview = await getUserReview(data.bookId, data.userId);
  if (existingReview) {
    throw new Error("You have already reviewed this book. You can only submit one review per book.");
  }
  
  await db.insert(reviews).values({
    bookId: data.bookId,
    userId: data.userId,
    rating: data.rating,
    title: data.title,
    content: data.content,
    isVerifiedPurchase: data.isVerifiedPurchase ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return { success: true, message: "Review submitted successfully" };
}


export async function createCommunityPost(data: {
  userId: number;
  species: string;
  location: string;
  weight: number | null;
  length: number | null;
  catchDate: Date;
  description: string | null;
  photoUrl: string | null;
  status: "pending" | "approved" | "rejected";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const insertData: any = {
    userId: data.userId,
    species: data.species,
    location: data.location,
    catchDate: data.catchDate,
    status: data.status,
    likes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  if (data.weight !== null) insertData.weight = data.weight;
  if (data.length !== null) insertData.length = data.length;
  if (data.description !== null) insertData.description = data.description;
  if (data.photoUrl !== null) insertData.photoUrl = data.photoUrl;
  
  await db.insert(communityPosts).values(insertData);
  
  return { success: true, message: "Post submitted successfully" };
}


export async function subscribeToNewsletter(email: string, name?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Check if already subscribed
    const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
    
    if (existing.length > 0) {
      // If they were unsubscribed, reactivate them
      if (!existing[0].isActive) {
        await db.update(newsletterSubscribers)
          .set({ isActive: true, unsubscribedAt: null, updatedAt: new Date() })
          .where(eq(newsletterSubscribers.email, email));
        // Fetch the updated record
        const updated = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
        return updated[0];
      }
      return existing[0];
    }

    // Insert new subscriber
    const result = await db.insert(newsletterSubscribers).values({
      email,
      name: name || null,
      isActive: true,
    });

    return { email, name: name || null, isActive: true };
  } catch (error) {
    console.error("[Newsletter] Subscription error:", error);
    throw error;
  }
}

export async function unsubscribeFromNewsletter(email: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(newsletterSubscribers)
    .set({ isActive: false, unsubscribedAt: new Date(), updatedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email));
}

export async function getNewsletterSubscribers() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.isActive, true));
}


export async function getNewsletterSubscribersWithFilters(filters?: {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { subscribers: [], total: 0 };

  // Build conditions
  const conditions = [];
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(newsletterSubscribers.isActive, filters.isActive));
  }

  if (filters?.search) {
    conditions.push(like(newsletterSubscribers.email, `%${filters.search}%`));
  }

  // Get all matching results first for count
  const allResults = conditions.length > 0
    ? await db.select().from(newsletterSubscribers).where(and(...conditions))
    : await db.select().from(newsletterSubscribers);
  const total = allResults.length;

  // Build paginated query - apply all operations in one chain
  const subscribers = conditions.length > 0
    ? await db.select().from(newsletterSubscribers)
        .where(and(...conditions))
        .orderBy(desc(newsletterSubscribers.createdAt))
        .limit(filters?.limit || 1000)
        .offset(filters?.offset || 0)
    : await db.select().from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.createdAt))
        .limit(filters?.limit || 1000)
        .offset(filters?.offset || 0);

  return { subscribers, total };
}

export async function deleteNewsletterSubscriber(email: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
}

export async function getNewsletterSubscriberStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, inactive: 0 };

  const allSubscribers = await db.select().from(newsletterSubscribers);
  const activeSubscribers = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.isActive, true));
  const inactiveSubscribers = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.isActive, false));

  return {
    total: allSubscribers.length,
    active: activeSubscribers.length,
    inactive: inactiveSubscribers.length,
  };
}

export async function createOrder(data: {
  userId: number;
  totalAmount: string | number;
  stripePaymentIntentId?: string;
  bookIds: number[];
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Create order
    const insertData: any = {
      userId: data.userId,
      totalAmount: String(data.totalAmount),
      status: "completed",
    };
    
    if (data.stripePaymentIntentId) {
      insertData.stripePaymentIntentId = data.stripePaymentIntentId;
    }

    await db.insert(orders).values(insertData);

    // Get the created order
    const createdOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, data.userId))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    if (!createdOrders || createdOrders.length === 0) {
      throw new Error("Failed to retrieve created order");
    }

    const orderId = createdOrders[0].id;

    // Create order items
    for (const bookId of data.bookIds) {
      const book = await getBookById(bookId);
      if (book) {
        await db.insert(orderItems).values({
          orderId,
          bookId,
          quantity: 1,
          priceAtPurchase: String(book.price),
        });
      }
    }

    return {
      id: orderId,
      userId: data.userId,
      totalAmount: String(data.totalAmount),
      status: "completed",
    };
  } catch (error) {
    console.error("[Orders] Failed to create order:", error);
    throw error;
  }
}


// Manual Payment Configuration

export async function getPaymentConfig() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentConfig).where(eq(paymentConfig.isActive, true));
}

export async function setPaymentConfig(config: {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode?: string;
  reference: string;
  instructions?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deactivate all existing configs
  await db.update(paymentConfig).set({ isActive: false });

  // Insert new config
  return db.insert(paymentConfig).values({
    bankName: config.bankName,
    accountHolder: config.accountHolder,
    accountNumber: config.accountNumber,
    branchCode: config.branchCode,
    reference: config.reference,
    instructions: config.instructions,
    isActive: true,
  });
}

// Manual Payments

export async function createManualPayment(data: {
  orderId: number;
  userId: number;
  amount: string | number;
  paymentMethod?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(manualPayments).values({
    orderId: data.orderId,
    userId: data.userId,
    amount: String(data.amount),
    paymentMethod: data.paymentMethod || "bank_transfer",
    status: "pending",
  });

  return result;
}

export async function getManualPaymentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(manualPayments)
    .where(eq(manualPayments.userId, userId))
    .orderBy(desc(manualPayments.createdAt));
}

export async function getManualPaymentsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(manualPayments)
    .where(eq(manualPayments.orderId, orderId))
    .limit(1);

  return result[0];
}

export async function getPendingManualPayments() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(manualPayments)
    .where(eq(manualPayments.status, "pending"))
    .orderBy(desc(manualPayments.createdAt));
}

export async function verifyManualPayment(paymentId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(manualPayments)
    .set({
      status: "verified",
      verifiedAt: new Date(),
      verifiedBy: adminId,
    })
    .where(eq(manualPayments.id, paymentId));

  // Update the order status to completed
  const payment = await db
    .select()
    .from(manualPayments)
    .where(eq(manualPayments.id, paymentId))
    .limit(1);

  if (payment && payment[0]) {
    await db
      .update(orders)
      .set({ status: "completed" })
      .where(eq(orders.id, payment[0].orderId));
  }

  return result;
}

export async function rejectManualPayment(paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(manualPayments)
    .set({ status: "failed" })
    .where(eq(manualPayments.id, paymentId));
}

export async function updateManualPaymentReference(
  paymentId: number,
  transactionReference: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(manualPayments)
    .set({
      transactionReference,
      notes,
    })
    .where(eq(manualPayments.id, paymentId));
}


// Site Statistics - Visitor Counter

export async function getSiteStats(): Promise<SiteStat | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(siteStats).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementVisitorCount(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot increment visitor count: database not available");
    return;
  }

  try {
    const stats = await getSiteStats();
    
    if (stats) {
      // Update existing stats
      await db.update(siteStats)
        .set({
          totalVisitors: stats.totalVisitors + 1,
          totalPageViews: stats.totalPageViews + 1,
          lastUpdated: new Date(),
        })
        .where(eq(siteStats.id, stats.id));
    } else {
      // Create initial stats if they don't exist
      await db.insert(siteStats).values({
        totalVisitors: 1,
        totalPageViews: 1,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to increment visitor count:", error);
  }
}

export async function incrementPageViewCount(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot increment page view count: database not available");
    return;
  }

  try {
    const stats = await getSiteStats();
    
    if (stats) {
      // Update existing stats
      await db.update(siteStats)
        .set({
          totalPageViews: stats.totalPageViews + 1,
          lastUpdated: new Date(),
        })
        .where(eq(siteStats.id, stats.id));
    } else {
      // Create initial stats if they don't exist
      await db.insert(siteStats).values({
        totalVisitors: 0,
        totalPageViews: 1,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to increment page view count:", error);
  }
}
