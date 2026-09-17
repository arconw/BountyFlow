import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./tests",
  outputDir: resolve(import.meta.dirname, "test-results"),
  fullyParallel: true,
  workers: 3,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3200/BountyFlow/",
    trace: "off",
    locale: "en-US",
  },
  webServer: {
    command: "node scripts/serve-demo.mjs",
    cwd: resolve(import.meta.dirname, ".."),
    url: "http://127.0.0.1:3200/BountyFlow/",
    reuseExistingServer: !process.env.CI,
  },
});
