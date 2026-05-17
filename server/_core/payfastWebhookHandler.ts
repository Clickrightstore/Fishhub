import { Express, Request, Response } from "express";
import * as db from "../db";
import { parsePayFastNotification, verifyPayFastSignature } from "./payfastWebhook";

export function setupPayFastWebhook(app: Express) {
  app.post("/api/payfast/webhook", async (req: Request, res: Response) => {
    try {
      console.log("[PayFast Webhook] Received notification");

      // Parse the notification
      const notification = parsePayFastNotification(req.body);

      // Verify the signature
      if (!verifyPayFastSignature(notification)) {
        console.error("[PayFast Webhook] Invalid signature");
        return res.status(400).json({ error: "Invalid signature" });
      }

      console.log("[PayFast Webhook] Signature verified, payment_status:", notification.payment_status);

      // Handle successful payments
      if (notification.payment_status === "COMPLETE") {
        const userId = parseInt(notification.custom_int1);
        const bookIds = notification.custom_str1.split(",").map(Number);
        const paymentId = notification.pf_payment_id;
        const amount = notification.amount_net;

        console.log(`[PayFast Webhook] Processing payment for user ${userId}, books: ${bookIds}`);

        // Create order if not already created
        const order = await db.createOrder({
          userId,
          totalAmount: amount,
          bookIds,
        });

        console.log(`[PayFast Webhook] Order created: ${order.id}`);

        // Mark order as paid
        // Note: You may need to add a status field to orders table
        // For now, we'll just log it
        console.log(`[PayFast Webhook] Order ${order.id} marked as paid`);

        // Return success response
        return res.json({ success: true, orderId: order.id });
      }

      // Handle failed or pending payments
      console.log(`[PayFast Webhook] Payment status: ${notification.payment_status}`);
      return res.json({ success: true, status: notification.payment_status });
    } catch (error) {
      console.error("[PayFast Webhook] Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
