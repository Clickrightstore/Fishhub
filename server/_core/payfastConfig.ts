/**
 * PayFast Configuration
 * Handles PayFast payment gateway setup and utilities
 *
 * Required environment variables:
 *   PAYFAST_MERCHANT_ID  — your PayFast merchant ID
 *   PAYFAST_MERCHANT_KEY — your PayFast merchant key
 *   PAYFAST_PASSPHRASE   — your PayFast passphrase (set in PayFast dashboard)
 *
 * Set NODE_ENV=production for live payments; anything else uses the sandbox.
 */

import crypto from "crypto";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "";
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "";
// Passphrase is configured in your PayFast account under Settings → Security
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za";
const IS_SANDBOX = process.env.NODE_ENV !== "production";

export const payfastConfig = {
  merchantId: PAYFAST_MERCHANT_ID,
  merchantKey: PAYFAST_MERCHANT_KEY,
  passphrase: PAYFAST_PASSPHRASE,
  baseUrl: IS_SANDBOX ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL,
  isSandbox: IS_SANDBOX,
};

/**
 * Generate PayFast signature for payment form.
 *
 * PayFast spec:
 * 1. Sort fields alphabetically by key
 * 2. Build "key=value&key=value" string (no URL-encoding of values)
 * 3. Append "&passphrase=<your_passphrase>" only if a passphrase is set
 * 4. MD5-hash the resulting string
 *
 * Note: merchant_key is included in the POST form data but must NOT be
 * included in the signature string per PayFast documentation.
 */
export function generatePayFastSignature(data: Record<string, string | number>): string {
  const queryString = Object.keys(data)
    .sort()
    .filter((key) => {
      const val = data[key];
      return val !== "" && val !== null && val !== undefined;
    })
    .map((key) => `${key}=${String(data[key])}`)
    .join("&");

  const withPassphrase = PAYFAST_PASSPHRASE
    ? `${queryString}&passphrase=${PAYFAST_PASSPHRASE}`
    : queryString;

  return crypto.createHash("md5").update(withPassphrase).digest("hex");
}

/**
 * Verify PayFast webhook signature.
 * The "signature" field is excluded before hashing.
 */
export function verifyPayFastSignature(
  data: Record<string, string>,
  signature: string
): boolean {
  const { signature: _sig, ...dataWithoutSignature } = data;
  const calculatedSignature = generatePayFastSignature(dataWithoutSignature);
  return calculatedSignature === signature;
}

/**
 * Validate PayFast credentials on startup
 */
export function validatePayFastConfig(): boolean {
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    console.error("[PayFast] Missing credentials: PAYFAST_MERCHANT_ID or PAYFAST_MERCHANT_KEY");
    return false;
  }
  if (!PAYFAST_PASSPHRASE) {
    console.warn("[PayFast] Warning: PAYFAST_PASSPHRASE is not set. Set it in your PayFast account under Settings → Security.");
  }
  console.log(`[PayFast] Initialized (${IS_SANDBOX ? "Sandbox" : "Live"} Mode)`);
  return true;
}

// Validate on module load
validatePayFastConfig();
