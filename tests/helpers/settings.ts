import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { signInTestAccount } from "./account";
type AccountState = Awaited<ReturnType<BrowserContext["storageState"]>>;
export const test = base.extend<
  { settingsPage: Page },
  { accountState: AccountState }
>({
  accountState: [
    async ({ browser }, use, worker) => {
      const context = await browser.newContext({
        baseURL: "http://127.0.0.1:3100",
      });
      const page = await context.newPage();
      await signInTestAccount(page, `settings_${worker.workerIndex}`, "email");
      const state = await context.storageState();
      await context.close();
      await use(state);
    },
    { scope: "worker" },
  ],
  settingsPage: async ({ browser, accountState }, use) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:3100",
      storageState: accountState,
    });
    await use(await context.newPage());
    await context.close();
  },
});
export { expect } from "@playwright/test";
