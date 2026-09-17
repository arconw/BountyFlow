import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function accountOrigin() {
  const configured = process.env.APP_ORIGIN;
  if (!configured && process.env.NODE_ENV === "production")
    throw new Error("APP_ORIGIN is required in production");
  const value = new URL(configured ?? "http://localhost:3000");
  if (
    value.username ||
    value.password ||
    value.search ||
    value.hash ||
    value.pathname !== "/" ||
    !["http:", "https:"].includes(value.protocol)
  )
    throw new Error(
      "APP_ORIGIN must be an HTTP origin without a path or credentials",
    );
  if (!localOrigin(value) && value.protocol !== "https:")
    throw new Error("Public authentication requires HTTPS");
  return value.origin;
}
function localOrigin(value: URL) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(value.hostname);
}
export function trustedIpHeader() {
  const value = process.env.AUTH_TRUSTED_IP_HEADER;
  if (value && !["x-real-ip", "cf-connecting-ip"].includes(value))
    throw new Error(
      "AUTH_TRUSTED_IP_HEADER must be x-real-ip or cf-connecting-ip",
    );
  if (!localOrigin(new URL(accountOrigin())) && !value)
    throw new Error("Public authentication requires a trusted proxy IP header");
  return value;
}
export function encryptionKey() {
  const configured = process.env.BETTER_AUTH_SECRET;
  if (configured !== undefined) {
    if (configured.length < 32)
      throw new Error("Authentication encryption configuration is invalid");
    return configured;
  }
  if (!localOrigin(new URL(accountOrigin())))
    throw new Error("Authentication configuration is required");
  const directory = resolve("data");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = resolve(directory, "auth-material.bin");
  try {
    writeFileSync(path, randomBytes(48).toString("base64"), {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  return readFileSync(path, "utf8");
}
export function googleConfiguration() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!!clientId !== !!clientSecret)
    throw new Error("Google requires both client configuration values");
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}
