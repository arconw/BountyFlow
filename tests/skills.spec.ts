import { expect, test } from "./helpers/settings";

test.use({ trace: "off", screenshot: "off" });

test("profile and bounty forms share a searchable catalog and board matches exact skills", async ({
  settingsPage: page,
}) => {
  await page.goto("/profile");
  const picker = page.getByRole("group", { name: "Skills & tools" });
  await picker.getByRole("textbox", { name: "Search skills…" }).fill("tyPe");
  await picker.getByRole("button", { name: "TypeScript", exact: true }).click();
  await picker.getByRole("textbox").fill("not-a-skill");
  await expect(picker).toContainText("No matching skills");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.locator("#profile-feedback")).toHaveText(
    "Profile saved to your account.",
  );
  await page.reload();
  await expect(
    picker.getByRole("button", { name: "TypeScript", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/create");
  await page.getByRole("textbox", { name: "Search skills…" }).fill("tyPe");
  await page.getByRole("button", { name: "TypeScript", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove skill: TypeScript" }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByLabel("Filter by skill").selectOption("React");
  await expect(page.locator(".bounty-card")).toHaveCount(4);
  for (const card of await page.locator(".bounty-card").all())
    await expect(card.locator(".tags")).toContainText("React");
  await page.getByLabel("Filter by skill").selectOption("Figma");
  await expect(page.locator(".bounty-card")).toHaveCount(1);
});
