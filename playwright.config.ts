import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  workers: 3,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [
    {
      name: "interface",
      workers: 1,
      testIgnore: [
        "**/accounts.spec.ts",
        "**/live.spec.ts",
        "**/server-actions.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "accounts",
      testMatch: [
        "**/accounts.spec.ts",
        "**/live.spec.ts",
        "**/server-actions.spec.ts",
      ],
      dependencies: ["interface"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    env: { APP_ORIGIN: "http://127.0.0.1:3100" },
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
