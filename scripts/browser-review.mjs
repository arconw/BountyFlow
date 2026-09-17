const reviewAccount = {
  username: process.env.REVIEW_LOGIN,
  password: process.env.REVIEW_ACCOUNT_PASSWORD,
};
if (!reviewAccount.username || !reviewAccount.password)
  throw new Error(
    "Set REVIEW_LOGIN and REVIEW_ACCOUNT_PASSWORD for the local review account",
  );
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const origin = process.env.REVIEW_ORIGIN ?? "http://localhost:3000";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  locale: "en-US",
});
const issues = [];
page.on("response", (response) => {
  if (response.status() >= 400)
    process.stdout.write(
      `HTTP ${response.status()}: ${new URL(response.url()).pathname}\n`,
    );
});
page.on("pageerror", (error) => issues.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") issues.push(message.text());
});
await page.goto(origin);
await page.locator(".bounty-card").first().waitFor();
await page.getByRole("button", { name: "Open", exact: true }).click();
await page.locator(".bounty-card").first().hover();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({
  path: "docs/screenshots/working-board-dark.png",
  fullPage: true,
});
await page.locator(".bounty-card").first().click();
await page.locator(".reward-panel").waitFor();
await page.screenshot({
  path: "docs/screenshots/working-detail-dark.png",
  fullPage: true,
});
await expect(
  page
    .getByRole("navigation")
    .getByRole("link", { name: "Profile", exact: true }),
).toHaveCount(0);
await page
  .locator(".reward-panel")
  .getByRole("button", { name: "Sign in", exact: true })
  .click();
await expect(page).toHaveURL(`${origin}/login`);
await expect(page.getByRole("dialog")).toHaveCount(0);
await page.goto(`${origin}/profile`);
await expect(page).toHaveURL(`${origin}/login`);
await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(1);
await page.getByLabel("Email or username").fill(reviewAccount.username);
await page.getByLabel("Password", { exact: true }).fill(reviewAccount.password);
await page
  .locator(".auth-page")
  .getByRole("button", { name: "Sign in", exact: true })
  .click();
await expect(page.locator("#profile-name")).toBeVisible();
await expect(
  page
    .getByRole("navigation")
    .getByRole("link", { name: "Preferences", exact: true }),
).toHaveCount(0);
await page.locator("#language").selectOption("ru");
await page.getByRole("button", { name: "Светлая", exact: true }).click();
await page.screenshot({
  path: "docs/screenshots/preferences-light-ru.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 1000 });
await page.screenshot({
  path: "docs/screenshots/preferences-mobile-ru.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Выйти", exact: true }).click();
await page.locator(".auth-page input[name=identifier]").waitFor();
await page.screenshot({
  path: "docs/screenshots/login-mobile-ru.png",
  fullPage: true,
});
await page
  .locator(".auth-links")
  .getByRole("link", { name: "Создать аккаунт" })
  .click();
await page.locator("input[name=username]").waitFor();
await page.screenshot({
  path: "docs/screenshots/register-mobile-ru.png",
  fullPage: true,
});
process.stdout.write(
  JSON.stringify({ browser: "headed Chromium in WSL", issues }) + "\n",
);
await browser.close();
if (issues.length) process.exitCode = 1;
