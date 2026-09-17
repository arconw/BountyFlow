import { afterEach, expect, it, vi } from "vitest";
import {
  accountOrigin,
  encryptionKey,
  googleConfiguration,
  trustedIpHeader,
} from "../../src/server/auth/runtime-config";

afterEach(() => {
  vi.unstubAllEnvs();
});
it("requires an explicit production origin and HTTPS for public hosts", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("APP_ORIGIN", undefined);
  expect(accountOrigin).toThrow("APP_ORIGIN is required");
  vi.stubEnv("APP_ORIGIN", "http://bounty.example.test");
  expect(accountOrigin).toThrow("HTTPS");
  vi.stubEnv("APP_ORIGIN", "https://bounty.example.test/path");
  expect(accountOrigin).toThrow("without a path");
  vi.stubEnv("APP_ORIGIN", "https://bounty.example.test/");
  expect(accountOrigin()).toBe("https://bounty.example.test");
});
it("requires a configured proxy header for public origins and ignores XFF by default locally", () => {
  vi.stubEnv("APP_ORIGIN", "https://bounty.example.test");
  vi.stubEnv("AUTH_TRUSTED_IP_HEADER", undefined);
  expect(trustedIpHeader).toThrow("trusted proxy");
  vi.stubEnv("AUTH_TRUSTED_IP_HEADER", "x-forwarded-for");
  expect(trustedIpHeader).toThrow("x-real-ip");
  vi.stubEnv("AUTH_TRUSTED_IP_HEADER", "x-real-ip");
  expect(trustedIpHeader()).toBe("x-real-ip");
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  vi.stubEnv("AUTH_TRUSTED_IP_HEADER", undefined);
  expect(trustedIpHeader()).toBeUndefined();
});
it("rejects short configured encryption values and incomplete OAuth settings without reading files", () => {
  vi.stubEnv("APP_ORIGIN", "https://bounty.example.test");
  vi.stubEnv("BETTER_AUTH_SECRET", "invalid-test-value");
  expect(encryptionKey).toThrow("invalid");
  vi.stubEnv("BETTER_AUTH_SECRET", undefined);
  expect(encryptionKey).toThrow("required");
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", undefined);
  expect(googleConfiguration).toThrow("both");
});
