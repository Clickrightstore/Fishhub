import crypto from "crypto";
import { payfastConfig } from "./payfastConfig";

export interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_int1: string;
  custom_str1: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
  [key: string]: string;
}

/**
 * Verify the PayFast ITN (Instant Transaction Notification) signature.
 *
 * The "signature" field is stripped from the data before building the
 * hash string, then the passphrase (from PAYFAST_PASSPHRASE env var) is
 * appended if configured — matching what generatePayFastSignature does.
 */
export function verifyPayFastSignature(data: PayFastNotification): boolean {
  const signature = data.signature;
  const { signature: _sig, ...dataCopy } = data;

  // Build query string sorted alphabetically, excluding empty values
  const queryString = Object.keys(dataCopy)
    .sort()
    .filter((key) => dataCopy[key] !== "" && dataCopy[key] !== undefined)
    .map((key) => `${key}=${dataCopy[key]}`)
    .join("&");

  // Append passphrase only if one is configured (must match what was used to sign)
  const withPassphrase = payfastConfig.passphrase
    ? `${queryString}&passphrase=${payfastConfig.passphrase}`
    : queryString;

  const hash = crypto.createHash("md5").update(withPassphrase).digest("hex");

  return hash === signature;
}

export function parsePayFastNotification(body: Record<string, string>): PayFastNotification {
  return {
    m_payment_id: body.m_payment_id || "",
    pf_payment_id: body.pf_payment_id || "",
    payment_status: body.payment_status || "",
    item_name: body.item_name || "",
    item_description: body.item_description || "",
    amount_gross: body.amount_gross || "",
    amount_fee: body.amount_fee || "",
    amount_net: body.amount_net || "",
    custom_int1: body.custom_int1 || "",
    custom_str1: body.custom_str1 || "",
    name_first: body.name_first || "",
    name_last: body.name_last || "",
    email_address: body.email_address || "",
    merchant_id: body.merchant_id || "",
    signature: body.signature || "",
  };
}
