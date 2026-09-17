import { catalogRecords } from "./helpers/catalog";
import { expect, test } from "@playwright/test";

test("board filters, search, sorting and empty state", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".bounty-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.locator(".bounty-card")).toHaveCount(5);
  await page.getByLabel("Sort bounties").selectOption("highest");
  await expect(page.locator(".bounty-card").first()).toContainText(
    "Add test coverage",
  );
  await page.getByLabel("Search bounties").fill("does not exist");
  await expect(
    page.getByRole("heading", { name: "No bounties found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Filter by skill").selectOption("Figma");
  await expect(page.locator(".bounty-card")).toHaveCount(1);
  await expect(page.locator(".bounty-card")).toContainText(
    "Design an on-chain activity dashboard",
  );
});

test("load more and list view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore more bounties" }).click();
  await expect(page.locator(".bounty-card")).toHaveCount(9);
  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.locator(".bounty-grid")).toHaveClass(/bounty-list/);
});

test("guests see account entry points instead of profile, personal tabs or wallet actions", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation");
  await expect(
    nav.getByRole("link", { name: "Preferences", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("link", { name: "Profile", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("link", { name: "My bounties", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Review states/ })).toHaveCount(
    0,
  );
  for (const route of ["/profile", "/my-bounties", "/create"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: "Connect wallet", exact: true }),
    ).toHaveCount(0);
  }
});
test("a database-backed bounty sends a guest to login before wallet connection", async ({
  page,
}) => {
  const tasks = await catalogRecords();
  const task = tasks.find(
    (value: { status: string }) => value.status === "Open",
  );
  expect(tasks.every((value) => !!value.onchainId && !!value.creatorId)).toBe(
    true,
  );
  await page.goto(`/bounty/${task!.id}`);
  await expect(page.locator(".creator-byline")).toContainText(
    task!.creator!.username!,
  );
  await expect(page.locator(".creator-byline")).not.toContainText("0x");
  await page
    .locator(".reward-panel")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("legacy design-preview tasks are not served by the application", async ({
  page,
}) => {
  await page.goto("/bounty/128");
  await expect(
    page.getByRole("heading", { name: "This bounty isn’t here" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview confirmation" }),
  ).toHaveCount(0);
});
test("unknown bounty has a useful not-found page", async ({ page }) => {
  const response = await page.goto("/bounty/9999");
  expect([200, 404]).toContain(response?.status());
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(
    page.getByRole("heading", { name: "This bounty isn’t here" }),
  ).toBeVisible();
});

for (const width of [390, 768, 1440]) {
  test(`responsive review at ${width}px without runtime errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/login",
      "/create",
      "/my-bounties",
      "/profile",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${route} overflows at ${width}px`).toBe(false);
    }
    expect(errors).toEqual([]);
  });
}
