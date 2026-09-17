import { catalogRecords } from "./helpers/catalog";
import { expect, test } from "@playwright/test";
import { signInTestAccount, linkConnectedWallet } from "./helpers/account";
import { injectLocalWallet } from "./helpers/wallet";

test.use({ trace: "off", screenshot: "off" });

test("real local-chain create, accept, payout and signed profile persistence", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await injectLocalWallet(page, 3);
  await signInTestAccount(page, "escrow_builder");
  await page
    .locator(".settings-aside")
    .getByRole("button", { name: "Connect wallet" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Browser wallet|MetaMask/ })
    .click();
  const linkButton = page
    .getByRole("dialog")
    .getByRole("button", { name: "Link wallet to account" });
  if (await linkButton.count()) await linkButton.click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Wallet linked", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const name = `Reviewer ${Date.now()}`;
  await page.locator("#profile-name").fill(name);
  await page.getByRole("button", { name: "React", exact: true }).click();
  await page.getByRole("button", { name: "Solidity", exact: true }).click();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.locator("#profile-feedback")).toHaveText(
    "Profile saved to your account.",
  );
  await page.reload();
  await expect(page.locator("#profile-name")).toHaveValue(name);
  await page.goto("/create");
  const title = `Verify a real escrow payout ${Date.now()}`;
  await page.getByRole("textbox", { name: /^Title/ }).fill(title);
  await page
    .getByRole("textbox", { name: /^Description/ })
    .fill(
      "Build and verify a real local-chain contribution from creation through payout.",
    );
  await page.getByRole("button", { name: "Solidity", exact: true }).click();
  await page.getByLabel("Bounty reward", { exact: false }).fill("0.01");
  await page.getByRole("button", { name: "Create bounty — 0.01 ETH" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create bounty", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Bounty created",
    { timeout: 20_000 },
  );
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "View bounty" })
    .click();
  await expect(page.locator("h1")).toHaveText(title);
  await page.evaluate(() =>
    (
      window as unknown as { setWalletAccount: (index: number) => void }
    ).setWalletAccount(4),
  );
  const detailUrl = page.url();
  await signInTestAccount(page, "escrow_worker");
  await page.evaluate(() =>
    (
      window as unknown as { setWalletAccount: (index: number) => void }
    ).setWalletAccount(4),
  );
  await linkConnectedWallet(page);
  await page.goto(detailUrl);
  await page.evaluate(() =>
    (
      window as unknown as { setWalletAccount: (index: number) => void }
    ).setWalletAccount(4),
  );
  await page
    .getByRole("button", { name: "Accept bounty", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Accept bounty", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Bounty accepted",
    { timeout: 20_000 },
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".reward-panel .status")).toHaveText("In progress");
  await page.evaluate(() =>
    (
      window as unknown as { setWalletAccount: (index: number) => void }
    ).setWalletAccount(3),
  );
  await signInTestAccount(page, "escrow_builder");
  await page.goto(detailUrl);
  await page
    .getByRole("button", { name: "Complete & release 0.01 ETH" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Release reward" })
    .click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Payment released",
    { timeout: 20_000 },
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".reward-panel .status")).toHaveText("Completed");
  await page.goto("/my-bounties");
  await page.getByLabel("Search bounties").fill(title);
  await expect(page.locator(".bounty-card")).toHaveCount(1);
});

test("wrong chain is recoverable and rejected signatures never sign in", async ({
  page,
}) => {
  await injectLocalWallet(page, 5);
  await signInTestAccount(page, "rejected_builder");
  await page
    .locator(".settings-aside")
    .getByRole("button", { name: "Connect wallet" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Browser wallet|MetaMask/ })
    .click();
  await page.evaluate(() => {
    (
      window as unknown as { rejectWalletRequest: boolean }
    ).rejectWalletRequest = true;
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Link wallet to account" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "declined",
  );
  await page.keyboard.press("Escape");
  await page.evaluate(() =>
    (
      window as unknown as { setWalletChain: (id: string) => void }
    ).setWalletChain("0x1"),
  );
  await expect(page.locator(".network-banner")).toBeVisible();
  await page.getByRole("button", { name: "Switch to Local EVM" }).click();
  await expect(page.locator(".network-banner")).toHaveCount(0);
});

test("a session revoked after opening a transaction cannot submit or retry", async ({
  page,
}) => {
  await injectLocalWallet(page, 10);
  await signInTestAccount(page, "expired_builder");
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
  const tasks = await catalogRecords();
  const task = tasks.find(
    (item: { title: string }) =>
      item.title === "Fix wallet reconnect on network change",
  );
  await page.goto(`/bounty/${task!.id}`);
  await page
    .locator(".reward-panel")
    .getByRole("button", { name: "Accept bounty", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const signedOut = await page.context().request.post("/api/auth/sign-out", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: {},
  });
  expect(signedOut.ok()).toBe(true);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Accept bounty", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Sign in to your account before linking a wallet.",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Try again", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Sign in to your account before linking a wallet.",
  );
  const refreshed = await catalogRecords();
  expect(
    refreshed.find((item: { id: number }) => item.id === task!.id)!.status,
  ).toBe("Open");
});
