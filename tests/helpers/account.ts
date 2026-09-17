import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { createDatabase } from "../../src/server/create-database";
import { databaseUrl } from "../../src/server/database-url";

const credential = "local-test-passphrase-123";
export async function signInTestAccount(
  page: Page,
  label: string,
  method: "username" | "email" = "username",
) {
  const db = createDatabase(databaseUrl());
  const email = `${label}@example.test`;
  try {
    const user = await db.user.upsert({
      where: { email },
      update: { email },
      create: {
        displayName: label,
        username: label,
        email,
        emailVerified: true,
      },
    });
    await db.authAccount.upsert({
      where: {
        providerId_accountId: { providerId: "credential", accountId: user.id },
      },
      update: { accountId: user.id },
      create: {
        id: randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: await hashPassword(credential),
      },
    });
  } finally {
    await db.$disconnect();
  }
  await page.goto("/login");
  await page
    .getByLabel("Email or username")
    .fill(method === "email" ? email : label);
  await page.getByLabel("Password", { exact: true }).fill(credential);
  await page
    .locator(".auth-page")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(page.locator("#profile-name")).toBeVisible();
}
export async function linkConnectedWallet(page: Page) {
  const button = page.getByRole("button", {
    name: "Link wallet to account",
    exact: true,
  });
  if (await button.count()) {
    await button.click();
    await expect(
      page.getByRole("button", { name: "Wallet linked", exact: true }),
    ).toBeVisible();
  }
}

export async function testProfileName(username: string) {
  const db = createDatabase(databaseUrl());
  try {
    return (
      await db.user.findUnique({
        where: { username },
        select: { displayName: true },
      })
    )?.displayName;
  } finally {
    await db.$disconnect();
  }
}
