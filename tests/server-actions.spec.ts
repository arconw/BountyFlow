import { expect, test } from "@playwright/test";
import { signInTestAccount, testProfileName } from "./helpers/account";

test.use({ trace: "off", screenshot: "off" });

test("catalog navigation uses server rendering without application JSON endpoints", async ({
  page,
  request,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      requests.push(new URL(request.url()).pathname);
  });
  await page.goto("/");
  await page.locator(".bounty-card").first().click();
  await expect(page.locator(".reward-panel")).toBeVisible();
  await page.goto("/login");
  await expect(page.getByLabel("Email or username")).toBeVisible();
  expect(requests).toEqual([]);
  for (const route of [
    "/api/bounties",
    "/api/profile",
    "/api/transactions/confirm",
    "/api/account/security",
  ]) {
    expect((await request.get(route)).status()).toBe(404);
  }
});

test("profile action rejects cross-origin calls and expired sessions without modifying data", async ({
  page,
  request,
}) => {
  await signInTestAccount(page, "action_builder");
  const original = await page.locator("#profile-name").inputValue();
  await page.locator("#profile-name").fill("Action reviewer");
  const outgoing = page.waitForRequest(
    (request) =>
      request.method() === "POST" && !!request.headers()["next-action"],
  );
  await page.getByRole("button", { name: "Save profile" }).click();
  const submitted = await outgoing;
  const action = submitted.headers()["next-action"];
  const body = submitted.postData()!;
  await expect(page.locator("#profile-feedback")).toHaveText(
    "Profile saved to your account.",
  );
  const hostile = await page.request.post("/profile", {
    headers: {
      "next-action": action,
      "content-type": "text/plain;charset=UTF-8",
      origin: "https://attacker.invalid",
    },
    data: body.replace("Action reviewer", "Hostile update"),
  });
  expect(hostile.ok()).toBe(false);
  const guest = await request.post("/profile", {
    headers: {
      "next-action": action,
      "content-type": "text/plain;charset=UTF-8",
      origin: "http://127.0.0.1:3100",
    },
    data: body.replace("Action reviewer", "Guest update"),
  });
  expect(await guest.text()).toContain("AUTH_REQUIRED");
  await page.reload();
  await expect(page.locator("#profile-name")).toHaveValue("Action reviewer");
  await page.locator("#profile-name").fill(original);
  const signedOut = await page.context().request.post("/api/auth/sign-out", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: {},
  });
  expect(signedOut.ok()).toBe(true);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.locator("#profile-feedback")).toHaveText(
    "Could not save your profile. Your changes are still in the form.",
  );
  expect(await testProfileName("action_builder")).toBe("Action reviewer");
});

test("profile refresh applies remote changes to pristine fields and preserves unsaved edits", async ({
  page,
}) => {
  await signInTestAccount(page, "tab_builder");
  const second = await page.context().newPage();
  await second.goto("/profile");
  await second.locator("#profile-name").fill("Updated in another tab");
  await second.getByRole("button", { name: "Save profile" }).click();
  await expect(second.locator("#profile-feedback")).toHaveText(
    "Profile saved to your account.",
  );
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator("#profile-name")).toHaveValue(
    "Updated in another tab",
  );
  await page.locator("#profile-name").fill("Unsaved local draft");
  await second.locator("#profile-name").fill("Another remote update");
  await second.getByRole("button", { name: "Save profile" }).click();
  await expect(second.locator("#profile-feedback")).toHaveText(
    "Profile saved to your account.",
  );
  await page.bringToFront();
  const refresh = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/profile" &&
      response.request().headers().rsc === "1",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await refresh;
  await expect(page.locator("#profile-name")).toHaveValue(
    "Unsaved local draft",
  );
  await second.close();
});
