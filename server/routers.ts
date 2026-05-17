import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { ENV } from "./_core/env";
import { getStripeSecretKey } from "./_core/stripeConfig";
import { TRPCError } from "@trpc/server";

// Stripe will be initialized lazily when needed
let stripe: any = null;
let stripeInitialized = false;

// Initialize Stripe on demand
async function initializeStripe() {
  if (stripeInitialized) return stripe;
  
  const stripeKey = getStripeSecretKey();
  console.log("[Stripe] Initializing...");
  
  if (!stripeKey) {
    console.warn("[Stripe] No API key configured");
    stripeInitialized = true;
    return null;
  }
  
  try {
    const Stripe = (await import("stripe")).default;
    stripe = new Stripe(stripeKey, {
      apiVersion: "2026-04-22.dahlia" as any,
    });
    console.log("[Stripe] ✓ Initialized successfully");
    stripeInitialized = true;
    return stripe;
  } catch (e) {
    console.error("[Stripe] ✗ Failed to initialize:", e);
    stripeInitialized = true;
    return null;
  }
}

// Initialize Stripe immediately
initializeStripe();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserProfile(ctx.user.id, input.name, input.email);
        return { success: true };
      }),
  }),

  stats: router({
    getSiteStats: publicProcedure.query(async () => {
      const stats = await db.getSiteStats();
      return stats || { totalVisitors: 0, totalPageViews: 0 };
    }),
    
    incrementVisitor: publicProcedure.mutation(async () => {
      await db.incrementVisitorCount();
      return { success: true };
    }),
  }),

  books: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        skillLevel: z.string().optional(),
        fishingType: z.string().optional(),
      }))
      .query(({ input }) => db.getBooks(input.category, input.skillLevel, input.fishingType)),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => db.getBookById(input)),
    
    search: publicProcedure
      .input(z.string())
      .query(({ input }) => db.searchBooks(input)),
    
    getFlagship: publicProcedure
      .query(() => db.getFlagshipBook()),
  }),

  orders: router({
    list: protectedProcedure
      .query(({ ctx }) => db.getUserOrdersWithItems(ctx.user.id)),
    
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderWithItems(input);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        return order;
      }),
  }),

  reviews: router({
    getForBook: publicProcedure
      .input(z.number())
      .query(({ input }) => db.getBookReviews(input)),
    
    canUserReview: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const hasPurchased = await db.hasUserPurchasedBook(ctx.user.id, input);
        const existingReview = await db.getUserReview(input, ctx.user.id);
        return {
          canReview: hasPurchased && !existingReview,
          hasPurchased,
          hasReviewed: !!existingReview,
        };
      }),
    
    getUserReview: protectedProcedure
      .input(z.number())
      .query(({ input, ctx }) => db.getUserReview(input, ctx.user.id)),
    
    submitReview: protectedProcedure
      .input(z.object({
        bookId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().min(1).max(100),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user has purchased this book
        const hasPurchased = await db.hasUserPurchasedBook(ctx.user.id, input.bookId);
        
        const result = await db.submitReview({
          bookId: input.bookId,
          userId: ctx.user.id,
          rating: input.rating,
          title: input.title,
          content: input.content,
          isVerifiedPurchase: hasPurchased,
        });
        return result;
      }),
  }),

  community: router({
    getPosts: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(({ input }) => db.getApprovedCommunityPosts(input.limit, input.offset)),
    
    getUserPosts: protectedProcedure
      .query(({ ctx }) => db.getUserCommunityPosts(ctx.user.id)),
    
    submitPost: protectedProcedure
      .input(z.object({
        species: z.string().min(1),
        location: z.string().min(1),
        weight: z.number().nullable().optional(),
        length: z.number().nullable().optional(),
        catchDate: z.date().optional(),
        description: z.string().optional(),
        photoUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createCommunityPost({
          userId: ctx.user.id,
          species: input.species,
          location: input.location,
          weight: input.weight || null,
          length: input.length || null,
          catchDate: input.catchDate || new Date(),
          description: input.description || null,
          photoUrl: input.photoUrl || null,
          status: "pending",
        });
      }),
  }),

  payments: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        bookIds: z.array(z.number()),
        origin: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          console.log("[Checkout] Starting session creation...");
          
          // Ensure Stripe is initialized
          const stripeInstance = await initializeStripe();
          
          if (!stripeInstance) {
            console.error("[Checkout] Stripe not available");
            throw new Error("Payment processing is temporarily unavailable");
          }

          // Get book details
          const books = await Promise.all(
            input.bookIds.map(id => db.getBookById(id))
          );

          const lineItems = books
            .filter((book): book is NonNullable<typeof book> => book !== null && book !== undefined)
            .map(book => ({
              price_data: {
                currency: "usd",
                product_data: {
                  name: book.title,
                  description: book.description,
                },
                unit_amount: Math.round(Number(book.price || 0) * 100),
              },
              quantity: 1,
            }));

          console.log("[Checkout] Creating session with", lineItems.length, "items");

          const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${input.origin}/orders?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://fishhub-nkwjs7vj.manus.space/library`,
            customer_email: ctx.user.email || undefined,
            client_reference_id: ctx.user.id.toString(),
            metadata: {
              user_id: ctx.user.id.toString(),
              book_ids: input.bookIds.join(","),
            },
          });

          console.log("[Checkout] ✓ Session created:", session.id);

          return {
            sessionId: session.id,
            url: session.url,
          };
        } catch (error) {
          console.error("[Checkout] ✗ Error:", error);
          throw new Error("Failed to create checkout session");
        }
      }),

    getCheckoutSession: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        try {
          const stripeInstance = await initializeStripe();
          if (!stripeInstance) throw new Error("Stripe not configured");
          
          const session = await stripeInstance.checkout.sessions.retrieve(input);
          return {
            id: session.id,
            payment_status: session.payment_status,
            customer_email: session.customer_email,
          };
        } catch (error) {
          console.error("Error retrieving session:", error);
          throw new Error("Failed to retrieve checkout session");
        }
      }),

    getPaymentConfig: publicProcedure
      .query(async () => {
        const config = await db.getPaymentConfig();
        return config[0] || null;
      }),

    setPaymentConfig: protectedProcedure
      .input(z.object({
        bankName: z.string().min(1, "Bank name is required"),
        accountHolder: z.string().min(1, "Account holder name is required"),
        accountNumber: z.string().min(1, "Account number is required"),
        branchCode: z.string().optional(),
        reference: z.string().min(1, "Payment reference is required"),
        instructions: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        try {
          await db.setPaymentConfig(input);
          return { success: true, message: "Payment configuration updated successfully" };
        } catch (error) {
          console.error("[Payment Config] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update payment configuration" });
        }
      }),

    getPayFastForm: protectedProcedure
      .input(z.object({
        bookIds: z.array(z.number()),
        amount: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        try {
          const { generatePayFastSignature, payfastConfig } = await import("./_core/payfastConfig");     
          
          // Build signature data (includes merchant_key for signature generation)
          // Ensure all required fields have values - PayFast requires name_last and email_address
          const userNameParts = ctx.user?.name?.split(" ") || ["Customer", "User"];
          const firstName = userNameParts[0] || "Customer";
          const lastName = userNameParts[1] || "User";
          const email = ctx.user?.email || "customer@example.com";
          
          // NOTE: merchant_key must be in the POST fields but NOT in the signature data.
          // The signature is computed over all other fields (plus the passphrase), then
          // merchant_key and signature are appended to the form separately.
          const signatureData: Record<string, string | number> = {
            merchant_id: payfastConfig.merchantId,
            return_url: `https://fishhub-nkwjs7vj.manus.space/orders`,
            cancel_url: `https://fishhub-nkwjs7vj.manus.space/library`,
            notify_url: `https://fishhub-nkwjs7vj.manus.space/api/payfast/webhook`,
            name_first: firstName,
            name_last: lastName,
            email_address: email,
            m_payment_id: `order_${Date.now()}_${ctx.user?.id || "guest"}`,
            amount: input.amount.toFixed(2),
            item_name: `Fishing Books (${input.bookIds.length} item${input.bookIds.length > 1 ? "s" : ""})`,
            item_description: "Purchase of fishing books",
            custom_int1: ctx.user?.id || 0,
            custom_str1: input.bookIds.join(","),
          };

          // Generate signature over signatureData (merchant_key excluded per PayFast spec)
          const signature = generatePayFastSignature(signatureData);

          // Build form fields — merchant_key and signature appended after signing
          const formFields = {
            merchant_id: String(signatureData.merchant_id),
            merchant_key: payfastConfig.merchantKey,
            return_url: String(signatureData.return_url),
            cancel_url: String(signatureData.cancel_url),
            notify_url: String(signatureData.notify_url),
            name_first: String(signatureData.name_first),
            name_last: String(signatureData.name_last),
            email_address: String(signatureData.email_address),
            m_payment_id: String(signatureData.m_payment_id),
            amount: String(signatureData.amount),
            item_name: String(signatureData.item_name),
            item_description: String(signatureData.item_description),
            custom_int1: String(signatureData.custom_int1),
            custom_str1: String(signatureData.custom_str1),
            signature: String(signature),
          };

          console.log('[PayFast Form] Merchant ID:', formFields.merchant_id);
          console.log('[PayFast Form] Amount:', formFields.amount);
          console.log('[PayFast Form] Signature:', formFields.signature);

          return {
            action: payfastConfig.baseUrl + "/eng/process",
            fields: formFields,
          };
        } catch (error) {
          console.error("[PayFast Form] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate PayFast form" });
        }
      }),

    createManualPaymentRequest: protectedProcedure
      .input(z.object({
        bookIds: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const books = await Promise.all(
            input.bookIds.map(id => db.getBookById(id))
          );

          const totalAmount = books
            .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined)
            .reduce((sum, book) => sum + Number(book.price || 0), 0);

          const order = await db.createOrder({
            userId: ctx.user.id,
            totalAmount: String(totalAmount),
            bookIds: input.bookIds,
          });

          await db.createManualPayment({
            orderId: order.id,
            userId: ctx.user.id,
            amount: String(totalAmount),
          });

          return {
            orderId: order.id,
            totalAmount: String(totalAmount),
            status: "pending",
          };
        } catch (error) {
          console.error("[Manual Payment] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    getMyPaymentRequests: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getManualPaymentsByUserId(ctx.user.id);
      }),

  }),
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await db.subscribeToNewsletter(input.email, input.name);
          return {
            success: true,
            email: result.email,
          };
        } catch (error) {
          console.error("[Newsletter] Subscription error:", error);
          throw new Error("Failed to subscribe to newsletter");
        }
      }),
    
    unsubscribe: publicProcedure
      .input(z.string().email())
      .mutation(async ({ input }) => {
        try {
          await db.unsubscribeFromNewsletter(input);
          return { success: true };
        } catch (error) {
          console.error("[Newsletter] Unsubscribe error:", error);
          throw new Error("Failed to unsubscribe from newsletter");
        }
      }),
  }),
  newsletterAdmin: router({
    getSubscribers: protectedProcedure
      .input(z.object({
        isActive: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        // Only admins can access this
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        return db.getNewsletterSubscribersWithFilters({
          isActive: input.isActive,
          search: input.search,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        // Only admins can access this
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        return db.getNewsletterSubscriberStats();
      }),

    deleteSubscriber: protectedProcedure
      .input(z.string().email())
      .mutation(async ({ input, ctx }) => {
        // Only admins can delete
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        await db.deleteNewsletterSubscriber(input);
        return { success: true };
      }),

    getAllForExport: protectedProcedure
      .query(async ({ ctx }) => {
        // Only admins can export
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        const result = await db.getNewsletterSubscribersWithFilters({
          limit: 10000, // Get all subscribers
          offset: 0,
        });
        return result.subscribers;
      }),
  }),
});

export type AppRouter = typeof appRouter;
