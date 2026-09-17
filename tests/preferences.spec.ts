import { expect, test } from "./helpers/settings";

test.use({ trace: "off", screenshot: "off" });
import { readFile } from "node:fs/promises";
import { catalogRecords } from "./helpers/catalog";

for (const locale of ["en", "ru", "es", "pt", "fr", "de", "pl", "uk"]) {
  test(`loads only the ${locale} dictionary and renders localized login on mobile`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: `${locale}-${locale.toUpperCase()}`,
      viewport: { width: 390, height: 1000 },
    });
    const page = await context.newPage();
    const requests: string[] = [];
    const errors: string[] = [];
    page.on("request", (request) => {
      if (/\/locales\//.test(request.url()))
        requests.push(new URL(request.url()).pathname);
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const messages = JSON.parse(
      await readFile(`public/locales/${locale}.json`, "utf8"),
    );
    await page.goto("http://127.0.0.1:3100/login");
    await expect(page.locator("h1")).toHaveText(messages.auth_login);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    expect([...new Set(requests)]).toEqual([`/locales/${locale}.json`]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await expect(page.locator("#profile-name")).toHaveCount(0);
    await expect(page.locator(".account-button")).toHaveText(
      messages.auth_login,
    );
    expect(errors).toEqual([]);
    await context.close();
  });
}
test("saved language wins over browser language and theme survives reload", async ({
  settingsPage: page,
}) => {
  await page.goto("/profile");
  await page.locator("#language").selectOption("ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.getByRole("button", { name: "Светлая", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Личный кабинет");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Тёмная", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("guest cannot access profile settings or see preferences navigation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  const page = await context.newPage();
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#language")).toHaveCount(0);
  await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("navigation")).not.toContainText("Preferences");
  await context.close();
});
test("language loading failure preserves the current locale and can be retried", async ({
  settingsPage: page,
}) => {
  await page.goto("/profile");
  await page.route("**/locales/es.json", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.locator("#language").selectOption("es");
  await expect(page.locator("#language-error")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.unroute("**/locales/es.json");
  await page.locator("#language").selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});
test("rapid language selection only applies the final choice", async ({
  settingsPage: page,
}) => {
  await page.goto("/profile");
  await page.route("**/locales/es.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await page.locator("#language").selectOption("es");
  await page.locator("#language").selectOption("pl");
  await expect(page.locator("h1")).toHaveText("Ustawienia konta");
  await page.waitForTimeout(700);
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
});
test("server-rendered catalog preserves localized filtering", async ({
  settingsPage: page,
}) => {
  await page.goto("/");
  await expect(page.locator(".bounty-card")).toHaveCount(6);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Profile", exact: true })
    .click();
  await page.locator("#language").selectOption("ru");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Задания", exact: true })
    .click();
  await page.getByRole("button", { name: "Открыто", exact: true }).click();
  await expect(page.locator(".bounty-card")).toHaveCount(5);
  await page.keyboard.press("/");
  await expect(page.locator("#bounty-search")).toBeFocused();
});

test("real bounty categories use the selected interface language", async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: "ru-RU" });
  const page = await context.newPage();
  const bounties = await catalogRecords();
  const bounty = bounties.find((item) => item.category === "Development")!;
  expect(bounty).toBeTruthy();
  await page.goto(`http://127.0.0.1:3100/bounty/${bounty.id}`);
  await expect(page.locator(".detail-labels")).toContainText("Разработка");
  await expect(page.locator(".detail-labels")).not.toContainText("Development");
  await context.close();
});
