import { expect, test } from "@playwright/test";
import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { signInTestAccount, linkConnectedWallet } from "./helpers/account";
import { injectLocalWallet } from "./helpers/wallet";
test.use({ trace: "off", screenshot: "off" });

test("account screens expose email/username login and no wallet sign-in", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email or username")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with Ethereum" }),
  ).toHaveCount(0);
  await page
    .locator(".auth-links")
    .getByRole("link", { name: "Create account" })
    .click();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Username", { exact: true })).toBeVisible();
  expect(
    (
      await request.post("/api/auth/challenge", {
        headers: { origin: "http://127.0.0.1:3100" },
        data: { address: "0x1111111111111111111111111111111111111111" },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post("/api/auth/verify", {
        headers: { origin: "http://127.0.0.1:3100" },
        data: { signature: "0x12" },
      })
    ).status(),
  ).toBe(404);
});

test("one account links multiple wallets and survives wallet disconnect", async ({
  page,
}) => {
  await injectLocalWallet(page, 7);
  await signInTestAccount(page, "multi_builder");
  const before = await (await page.request.get("/api/auth/get-session")).json();
  await page
    .locator(".settings-aside")
    .getByRole("button", { name: "Connect wallet" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Browser wallet|MetaMask/ })
    .click();
  await page.keyboard.press("Escape");
  await linkConnectedWallet(page);
  const previousWallet = await page.locator(".profile-wallet").innerText();
  await page.evaluate(() =>
    (
      window as unknown as { setWalletAccount: (index: number) => void }
    ).setWalletAccount(8),
  );
  await expect(page.locator(".profile-wallet")).not.toHaveText(previousWallet);
  await linkConnectedWallet(page);
  await expect(page.locator(".wallet-list li")).toHaveCount(2);
  await page.getByRole("button", { name: "Disconnect wallet" }).click();
  const after = await (await page.request.get("/api/auth/get-session")).json();
  expect(before.user.id === after.user.id).toBe(true);
  await expect(page.locator("#profile-name")).toBeVisible();
  await expect(page.locator(".account-button")).toHaveText("multi_builder");
});

test("authenticator enrollment and recovery login work in the browser", async ({
  page,
}) => {
  const label = `factor_${Date.now()}`;
  await signInTestAccount(page, label);
  const enable = page.waitForResponse((response) =>
    response.url().endsWith("/two-factor/enable"),
  );
  await page
    .locator("form")
    .filter({
      has: page.getByRole("button", { name: "Enable 2FA", exact: true }),
    })
    .getByLabel("Current password")
    .fill("local-test-passphrase-123");
  await page.getByRole("button", { name: "Enable 2FA", exact: true }).click();
  const setup = await (await enable).json();
  await expect(page.locator(".auth-qr svg")).toBeVisible();
  const key = new URL(setup.totpURI).searchParams.get("secret")!;
  await page
    .getByLabel("Authenticator code")
    .fill(await createOTP(new TextDecoder().decode(base32.decode(key))).totp());
  await page.getByRole("button", { name: "Confirm and enable" }).click();
  await expect(
    page.getByRole("button", { name: "Disable 2FA", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/login");
  await page.getByLabel("Email or username").fill(label);
  await page
    .getByLabel("Password", { exact: true })
    .fill("local-test-passphrase-123");
  await page
    .locator(".auth-page")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(page).toHaveURL(/two-factor/);
  expect(
    (await (await page.request.get("/api/auth/get-session")).json()) === null,
  ).toBe(true);
  await page.getByRole("button", { name: "Use recovery code" }).click();
  await page.getByLabel("Recovery code").fill(setup.backupCodes[0]);
  await page
    .getByRole("button", { name: "Two-factor authentication", exact: true })
    .click();
  await expect(page.locator("#profile-name")).toBeVisible();
});
