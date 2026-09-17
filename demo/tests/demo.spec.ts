import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("complete static demo journey never accesses a wallet or external service", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).hostname !== "127.0.0.1")
      external.push(request.url());
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, "ethereum", {
      get() {
        throw new Error("Demo accessed a real wallet");
      },
    });
  });
  await page.goto("./");
  await expect(page.locator(".bounty-card")).toHaveCount(6);
  await expect(page.locator(".demo-banner")).toBeVisible();
  await page.getByLabel("Filter by skill").selectOption("Figma");
  await expect(page.locator(".bounty-card")).toHaveCount(1);
  await page.getByLabel("Explore as").selectOption("creator");
  await page.goto("create/");
  await page
    .getByRole("textbox", { name: /^Title/ })
    .fill("Deliver a polished client showcase");
  await page
    .getByRole("textbox", { name: /^Description/ })
    .fill(
      "Create a clear and accessible interface with a fully demonstrated escrow workflow.",
    );
  await page.getByRole("button", { name: "React", exact: true }).click();
  await page.getByLabel("Bounty reward", { exact: false }).fill("0.01");
  await page.getByRole("button", { name: "Create bounty — 0.01 ETH" }).click();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Bounty created",
  );
  await page.getByRole("link", { name: "View bounty", exact: true }).click();
  await expect(page.locator("h1")).toHaveText(
    "Deliver a polished client showcase",
  );
  const detail = page.url();
  await page.reload();
  await expect(page.locator("h1")).toHaveText(
    "Deliver a polished client showcase",
  );
  await page.getByLabel("Explore as").selectOption("contributor");
  await page
    .locator(".reward-panel")
    .getByRole("button", { name: "Accept bounty", exact: true })
    .click();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Bounty accepted",
  );
  await page.keyboard.press("Escape");
  await page.getByLabel("Explore as").selectOption("creator");
  await page
    .locator(".reward-panel")
    .getByRole("button", { name: "Complete & release 0.01 ETH" })
    .click();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Payment released",
  );
  await page.keyboard.press("Escape");
  await page.goto(detail);
  await expect(page.locator(".reward-panel .status")).toHaveText("Completed");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("demo profile, reset, and mobile layouts work without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  for (const path of [
    "./",
    "create/",
    "profile/",
    "bounty/101/",
    "my-bounties/",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      path,
    ).toBe(false);
  }
  await page.goto("profile/");
  await page.locator("#language").selectOption("ru");
  await page.getByRole("button", { name: "Светлая", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

for (const locale of ["en", "ru", "es", "pt", "fr", "de", "pl", "uk"]) {
  test(`demo loads only ${locale} with complete shared and demo labels`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    const requests: string[] = [];
    const errors: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/locales/"))
        requests.push(new URL(request.url()).pathname);
    });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const dictionary = JSON.parse(
      await readFile(
        new URL(`../locales/${locale}.json`, import.meta.url),
        "utf8",
      ),
    );
    await page.goto("http://127.0.0.1:3200/BountyFlow/");
    await expect(page.locator(".demo-banner strong")).toHaveText(
      dictionary.demo_label,
    );
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    expect(requests).toEqual([`/BountyFlow/locales/${locale}.json`]);
    expect(errors).toEqual([]);
    await context.close();
  });
}
