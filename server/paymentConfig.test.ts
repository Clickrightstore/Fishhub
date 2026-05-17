import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { setPaymentConfig, getPaymentConfig } from "./db";

describe("Payment Configuration", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
  });

  it("should set payment configuration", async () => {
    const config = {
      bankName: "Test Bank",
      accountHolder: "Test Account",
      accountNumber: "1234567890",
      branchCode: "250155",
      reference: "TESTORDER",
      instructions: "Test instructions",
    };

    await setPaymentConfig(config);

    const savedConfig = await getPaymentConfig();
    expect(savedConfig).toBeDefined();
    expect(savedConfig.length).toBeGreaterThan(0);
    expect(savedConfig[0].bankName).toBe("Test Bank");
    expect(savedConfig[0].accountHolder).toBe("Test Account");
    expect(savedConfig[0].accountNumber).toBe("1234567890");
    expect(savedConfig[0].reference).toBe("TESTORDER");
  });

  it("should update payment configuration", async () => {
    const config1 = {
      bankName: "Bank A",
      accountHolder: "Account A",
      accountNumber: "1111111111",
      reference: "ORDERREF1",
    };

    await setPaymentConfig(config1);

    const config2 = {
      bankName: "Bank B",
      accountHolder: "Account B",
      accountNumber: "2222222222",
      reference: "ORDERREF2",
    };

    await setPaymentConfig(config2);

    const savedConfig = await getPaymentConfig();
    expect(savedConfig).toBeDefined();
    expect(savedConfig.length).toBeGreaterThan(0);
    // Should only have the latest config as active
    const activeConfigs = savedConfig.filter((c: any) => c.isActive);
    expect(activeConfigs.length).toBe(1);
    expect(activeConfigs[0].bankName).toBe("Bank B");
  });

  it("should retrieve payment configuration", async () => {
    const config = {
      bankName: "Main Bank",
      accountHolder: "Main Account",
      accountNumber: "9999999999",
      branchCode: "100001",
      reference: "MAIN",
      instructions: "Main instructions",
    };

    await setPaymentConfig(config);

    const retrievedConfig = await getPaymentConfig();
    expect(retrievedConfig).toBeDefined();
    expect(retrievedConfig.length).toBeGreaterThan(0);
    expect(retrievedConfig[0].isActive).toBe(true);
  });

  it("should handle optional fields", async () => {
    const config = {
      bankName: "Simple Bank",
      accountHolder: "Simple Account",
      accountNumber: "5555555555",
      reference: "SIMPLE",
    };

    await setPaymentConfig(config);

    const savedConfig = await getPaymentConfig();
    expect(savedConfig).toBeDefined();
    expect(savedConfig.length).toBeGreaterThan(0);
    expect(savedConfig[0].bankName).toBe("Simple Bank");
    // branchCode and instructions should be null or undefined
  });
});
