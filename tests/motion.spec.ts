import { expect, test } from "./helpers/settings";

test.use({ trace: "off", screenshot: "off" });

test("rapid filtering settles on the final selection without duplicate cards", async ({
  settingsPage: page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await page.getByRole("button", { name: "In progress", exact: true }).click();
  await expect(page.locator(".bounty-card")).toHaveCount(2);
  await expect(page.locator(".bounty-grid-item[inert]")).toHaveCount(0);
  await expect(page.locator(".bounty-card .status-in-progress")).toHaveCount(2);
  await page.getByLabel("Search bounties").fill("no matching task");
  await expect(page.locator(".bounty-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".bounty-card")).toHaveCount(6);
  const links = await page
    .locator(".bounty-card")
    .evaluateAll((cards) => cards.map((card) => card.getAttribute("href")));
  expect(new Set(links).size).toBe(6);
});

test("navigation line moves only when the current page changes", async ({
  settingsPage: page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const bounties = nav.getByRole("link", { name: "Bounties", exact: true });
  const personal = nav.getByRole("link", { name: "Profile" });
  const line = nav.locator(".nav-indicator");
  const aligned = async (link: typeof bounties) => {
    await expect
      .poll(async () => {
        const target = await link.boundingBox();
        const actual = await line.boundingBox();
        return target && actual
          ? Math.abs(target.x - actual.x) +
              Math.abs(target.width - actual.width)
          : Infinity;
      })
      .toBeLessThan(1);
  };
  await aligned(bounties);
  await personal.hover();
  await aligned(bounties);
  await personal.focus();
  await aligned(bounties);
  await personal.click();
  await expect(personal).toHaveAttribute("aria-current", "page");
  await aligned(personal);
  await bounties.hover();
  await aligned(personal);
  await page.goBack();
  await expect(bounties).toHaveAttribute("aria-current", "page");
  await aligned(bounties);
});

for (const width of [390, 1440]) {
  test(`navigation line stays pinned during delayed navigation at ${width}px`, async ({
    settingsPage: page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/profile*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.evaluate(() => {
      const samples: number[] = [];
      Object.assign(window, { navSamples: samples, navSampling: true });
      const sample = () => {
        const nav = document.querySelector(".main-nav");
        const line = document.querySelector(".nav-indicator");
        if (nav && line)
          samples.push(
            Math.abs(
              line.getBoundingClientRect().bottom -
                nav.getBoundingClientRect().bottom -
                1,
            ),
          );
        if ((window as unknown as { navSampling: boolean }).navSampling)
          requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Profile" })
      .click();
    await expect(page).toHaveURL(/profile$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const samples = await page.evaluate(() => {
      const state = window as unknown as {
        navSamples: number[];
        navSampling: boolean;
      };
      state.navSampling = false;
      return state.navSamples;
    });
    expect(samples.length).toBeGreaterThan(2);
    expect(Math.max(...samples)).toBeLessThan(1);
  });
}

test("reduced motion disables continuous effects and keeps filtering usable", async ({
  settingsPage: page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const card = page.locator(".bounty-card").first();
  await card.hover();
  expect(
    await card.evaluate((el) => getComputedStyle(el, "::before").animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".status-open > span")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.locator(".bounty-card")).toHaveCount(1);
  await expect(page.locator(".bounty-grid-item")).toHaveCSS(
    "transform",
    "none",
  );
});
