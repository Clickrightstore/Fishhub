import { describe, it, expect } from "vitest";
import { generatePayFastSignature, verifyPayFastSignature, validatePayFastConfig } from "./server/_core/payfastConfig";

describe("PayFast Configuration", () => {
  it("should validate PayFast config is loaded", () => {
    const isValid = validatePayFastConfig();
    expect(isValid).toBe(true);
  });

  it("should generate valid PayFast signature", () => {
    const testData = {
      merchant_id: "10000100",
      merchant_key: "46f0cd694581a",
      return_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      notify_url: "https://example.com/notify",
      name_first: "John",
      name_last: "Doe",
      email_address: "john@example.com",
      m_payment_id: "12345",
      amount: "100.00",
      item_name: "Test Book",
      item_description: "A test book",
    };

    const signature = generatePayFastSignature(testData);
    expect(signature).toBeDefined();
    expect(signature.length).toBe(32); // MD5 hash is 32 characters
  });

  it("should verify PayFast signature correctly", () => {
    const testData = {
      merchant_id: "10000100",
      return_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      notify_url: "https://example.com/notify",
      name_first: "John",
      name_last: "Doe",
      email_address: "john@example.com",
      m_payment_id: "12345",
      amount: "100.00",
      item_name: "Test Book",
    };

    const signature = generatePayFastSignature(testData);
    const isValid = verifyPayFastSignature(testData, signature);
    expect(isValid).toBe(true);
  });

  it("should reject invalid PayFast signature", () => {
    const testData = {
      merchant_id: "10000100",
      amount: "100.00",
    };

    const invalidSignature = "invalid_signature_123456789012345";
    const isValid = verifyPayFastSignature(testData, invalidSignature);
    expect(isValid).toBe(false);
  });
});
