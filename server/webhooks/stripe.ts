import { Request, Response } from "express";
import { getDb } from "../db";
import { orders, orderItems } from "../../drizzle/schema";
import { getStripeSecretKey } from "../_core/stripeConfig";

let stripeInstance: any = null;
let stripeInitialized = false;

async function getStripe() {
  if (stripeInitialized) return stripeInstance;
  
  const stripeKey = getStripeSecretKey();
  
  if (!stripeKey) {
    console.error("[Stripe Webhook] No API key configured");
    stripeInitialized = true;
    return null;
  }

  try {
    const Stripe = (await import("stripe")).default;
    stripeInstance = new Stripe(stripeKey, {
      apiVersion: "2026-04-22.dahlia" as any,
    });
    console.log("[Stripe Webhook] ✓ Initialized successfully");
    stripeInitialized = true;
    return stripeInstance;
  } catch (error) {
    console.error("[Stripe Webhook] ✗ Failed to initialize:", error);
    stripeInitialized = true;
    return null;
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(400).send("Webhook secret not configured");
  }

  const stripe = await getStripe();
  if (!stripe) {
    console.error("[Stripe Webhook] Stripe not available");
    return res.status(400).send("Stripe not configured");
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected");
    return res.json({ verified: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(`[Stripe Webhook] Payment successful for session: ${session.id}`);

        // Extract metadata
        const userId = parseInt(session.metadata?.user_id || "0");
        const bookIds = session.metadata?.book_ids?.split(",").map(Number) || [];
        const amount = (session.amount_total || 0) / 100; // Convert cents to dollars

        if (userId && bookIds.length > 0) {
          const db = await getDb();
          if (db) {
            try {
              // Create order record
              const result = await db.insert(orders).values({
                userId,
                totalAmount: amount.toString(),
                status: "completed",
                stripePaymentIntentId: session.payment_intent as string,
              });

              // Get the inserted order ID
              const orderId = (result as any)[0]?.insertId || (result as any).insertId;
              console.log(`[Stripe Webhook] Order created with ID: ${orderId}`);

              // Create order items for each book
              for (const bookId of bookIds) {
                await db.insert(orderItems).values({
                  orderId,
                  bookId,
                  quantity: 1,
                  priceAtPurchase: (amount / bookIds.length).toString(),
                });
              }

              console.log(`[Stripe Webhook] Order items created for order ${orderId} with ${bookIds.length} books`);
            } catch (error) {
              console.error(`[Stripe Webhook] Failed to create order: ${error}`);
            }
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`[Stripe Webhook] PaymentIntent succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
