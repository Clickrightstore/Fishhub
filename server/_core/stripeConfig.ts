/**
 * Stripe Configuration
 * This file handles Stripe key initialization from environment variables.
 *
 * IMPORTANT: Never hardcode API keys in source code.
 * Set these environment variables in your deployment platform:
 *   STRIPE_SECRET_KEY      — your Stripe secret key (sk_live_... or sk_test_...)
 *   VITE_STRIPE_PUBLISHABLE_KEY — your Stripe publishable key (pk_live_... or pk_test_...)
 */

export const getStripeSecretKey = (): string => {
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }
  // Not configured — will be caught by initialization code
  return "";
};

export const getStripePublishableKey = (): string => {
  if (process.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  }
  // Not configured — will be caught by initialization code
  return "";
};
