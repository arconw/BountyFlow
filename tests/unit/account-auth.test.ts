import { randomBytes } from "node:crypto";
import { beforeEach, afterEach, expect, it } from "vitest";
import { base32 } from "@better-auth/utils/base32";
import { setAccountAccess } from "../../src/server/auth/set-account-access";
import { createOTP } from "@better-auth/utils/otp";
import { testDatabase } from "../helpers/database";
import {
  createAccountAuth,
  type AccountMail,
} from "../../src/server/auth/create-account-auth";
let database: Awaited<ReturnType<typeof testDatabase>>;
let auth: ReturnType<typeof createAccountAuth>;
let mails: AccountMail[];
let cookie: string;
const origin = "http://localhost:3100";
const credential = "test-only-passphrase-123";
async function call(path: string, body?: unknown) {
  const response = await auth.handler(
    new Request(origin + "/api/auth" + path, {
      method: body ? "POST" : "GET",
      headers: { origin, "content-type": "application/json", cookie },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
  const jar = new Map(
    cookie
      .split("; ")
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf("=");
        return [part.slice(0, i), part.slice(i + 1)];
      }),
  );
  for (const set of response.headers.getSetCookie()) {
    const first = set.split(";")[0];
    const i = first.indexOf("=");
    jar.set(first.slice(0, i), first.slice(i + 1));
  }
  cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  return response;
}
async function registered() {
  const response = await call("/sign-up/email", {
    email: "builder@example.test",
    username: "builder",
    name: "Builder",
    password: credential,
  });
  expect(response.status).toBe(200);
  const message = mails.find((mail) => mail.kind === "verify");
  expect(!!message).toBe(true);
  const url = new URL(message!.url);
  const result = await auth.handler(new Request(url, { headers: { origin } }));
  expect(result.status < 400).toBe(true);
}
beforeEach(async () => {
  database = await testDatabase();
  mails = [];
  cookie = "";
  auth = createAccountAuth(database.db, {
    origin,
    rateLimitEnabled: false,
    google: {
      clientId: "test-client",
      clientSecret: randomBytes(32).toString("hex"),
    },
    encryptionKey: randomBytes(48).toString("base64"),
    sendMail: async (mail) => {
      mails.push(mail);
    },
  });
});
afterEach(async () => {
  await database.close();
});
it("requires email verification, supports email and username, revokes session", async () => {
  await call("/sign-up/email", {
    email: "builder@example.test",
    username: "builder",
    name: "Builder",
    password: credential,
  });
  expect(
    (
      await call("/sign-in/username", {
        username: "builder",
        password: credential,
      })
    ).status,
  ).toBe(403);
  const link = mails.find((m) => m.kind === "verify")!;
  await auth.handler(new Request(link.url));
  expect(
    (
      await call("/sign-in/username", {
        username: "BUILDER",
        password: credential,
      })
    ).status,
  ).toBe(200);
  expect(!!(await (await call("/get-session")).json())?.user).toBe(true);
  await call("/sign-out", {});
  expect((await (await call("/get-session")).json()) === null).toBe(true);
  expect(
    (
      await call("/sign-in/email", {
        email: "builder@example.test",
        password: credential,
      })
    ).status,
  ).toBe(200);
  expect(await database.db.wallet.count()).toBe(0);
});
it("rejects wrong password and reset proof replay", async () => {
  await registered();
  expect(
    (
      await call("/sign-in/email", {
        email: "builder@example.test",
        password: "incorrect-value",
      })
    ).status,
  ).toBe(401);
  await call("/request-password-reset", {
    email: "builder@example.test",
    redirectTo: origin + "/reset-access",
  });
  const message = mails.find((m) => m.kind === "reset")!;
  expect(!!message).toBe(true);
  const reset = new URL(message.url).pathname.split("/").at(-1)!;
  expect(
    (
      await call("/reset-password", {
        token: reset,
        newPassword: credential + "new",
      })
    ).status,
  ).toBe(200);
  expect(
    (await call("/reset-password", { token: reset, newPassword: credential }))
      .status,
  ).toBe(400);
  expect(
    (
      await call("/sign-in/email", {
        email: "builder@example.test",
        password: credential,
      })
    ).status,
  ).toBe(401);
});
it("withholds sessions until TOTP or a single-use recovery code is verified", async () => {
  await registered();
  await call("/sign-in/email", {
    email: "builder@example.test",
    password: credential,
  });
  const enabled = await call("/two-factor/enable", { password: credential });
  expect(enabled.status).toBe(200);
  const setup = await enabled.json();
  const key = new URL(setup.totpURI).searchParams.get("secret")!;
  const code = await createOTP(
    new TextDecoder().decode(base32.decode(key)),
  ).totp();
  expect((await call("/two-factor/verify-totp", { code })).status).toBe(200);
  await call("/sign-out", {});
  const login = await call("/sign-in/username", {
    username: "builder",
    password: credential,
  });
  expect((await login.json()).twoFactorRedirect === true).toBe(true);
  expect((await (await call("/get-session")).json()) === null).toBe(true);
  expect(
    (await call("/two-factor/verify-totp", { code: "invalid" })).status >= 400,
  ).toBe(true);
  expect(
    (
      await call("/two-factor/verify-backup-code", {
        code: setup.backupCodes[0],
      })
    ).status,
  ).toBe(200);
  await call("/sign-out", {});
  await call("/sign-in/email", {
    email: "builder@example.test",
    password: credential,
  });
  expect(
    (
      await call("/two-factor/verify-backup-code", {
        code: setup.backupCodes[0],
      })
    ).status >= 400,
  ).toBe(true);
});
it("blocks cross-origin sign-in and duplicate usernames", async () => {
  await registered();
  const response = await auth.handler(
    new Request(origin + "/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        origin: "https://untrusted.invalid",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "builder@example.test",
        password: credential,
      }),
    }),
  );
  expect(response.status).toBe(403);
  expect(
    (
      await call("/sign-up/email", {
        email: "second@example.test",
        username: "builder",
        name: "Other",
        password: credential,
      })
    ).status >= 400,
  ).toBe(true);
});

it("lets a Google-only account set an optional password without replacing its identity", async () => {
  await registered();
  await call("/sign-in/email", {
    email: "builder@example.test",
    password: credential,
  });
  const user = await database.db.user.findUniqueOrThrow({
    where: { email: "builder@example.test" },
  });
  await database.db.authAccount.updateMany({
    where: { userId: user.id },
    data: { providerId: "google", password: null },
  });
  const result = await auth.api.setPassword({
    body: { newPassword: credential + "google" },
    headers: new Headers({ cookie, origin }),
    asResponse: true,
  });
  expect(result.status).toBe(200);
  expect(
    await database.db.authAccount.count({ where: { userId: user.id } }),
  ).toBe(2);
  await call("/sign-out", {});
  expect(
    (
      await call("/sign-in/username", {
        username: "builder",
        password: credential + "google",
      })
    ).status,
  ).toBe(200);
  expect(await database.db.user.count()).toBe(1);
});

it("requires a fresh session for a Google-only account security changes", async () => {
  await registered();
  await call("/sign-in/email", {
    email: "builder@example.test",
    password: credential,
  });
  const user = await database.db.user.findUniqueOrThrow({
    where: { email: "builder@example.test" },
  });
  await database.db.authAccount.updateMany({
    where: { userId: user.id },
    data: { providerId: "google", password: null },
  });
  await database.db.authSession.updateMany({
    data: { createdAt: new Date(Date.now() - 60 * 60_000) },
  });
  expect((await call("/two-factor/enable", {})).status).toBe(403);
  expect((await call("/two-factor/disable", {})).status).toBe(403);
  await expect(
    setAccountAccess(auth, new Headers({ cookie, origin }), credential),
  ).rejects.toMatchObject({ code: "SESSION_NOT_FRESH" });
});
it("Google callback cannot grant a session before enabled TOTP is verified", async () => {
  await registered();
  await call("/sign-in/email", {
    email: "builder@example.test",
    password: credential,
  });
  const setup = await (
    await call("/two-factor/enable", { password: credential })
  ).json();
  const key = new URL(setup.totpURI).searchParams.get("secret")!;
  await call("/two-factor/verify-totp", {
    code: await createOTP(new TextDecoder().decode(base32.decode(key))).totp(),
  });
  await call("/sign-out", {});
  const context = await auth.$context;
  const provider = context.socialProviders.find(
    (item) => item.id === "google",
  )!;
  provider.validateAuthorizationCode = async () => ({
    accessToken: "local-test-access",
  });
  provider.getUserInfo = async () => ({
    user: {
      email: "builder@example.test",
      emailVerified: true,
      name: "Builder",
    },
    data: { sub: "google-builder" },
  });
  const start = await call("/sign-in/social", {
    provider: "google",
    callbackURL: origin + "/profile",
  });
  expect(start.status).toBe(200);
  const url = new URL((await start.json()).url);
  const callback = await call(
    "/callback/google?code=local-code&state=" +
      encodeURIComponent(url.searchParams.get("state")!),
  );
  const location = new URL(callback.headers.get("location") ?? "/", origin);
  expect({
    status: callback.status,
    path: location.pathname,
    error: location.searchParams.get("error"),
  }).toEqual({ status: 302, path: "/two-factor", error: null });
  expect((await (await call("/get-session")).json()) === null).toBe(true);
  expect(
    (
      await call("/two-factor/verify-backup-code", {
        code: setup.backupCodes[0],
      })
    ).status,
  ).toBe(200);
  expect(!!(await (await call("/get-session")).json())?.user).toBe(true);
});

it("Google creates one email account without a password and reuses it on later sign-in", async () => {
  const context = await auth.$context;
  const provider = context.socialProviders.find(
    (item) => item.id === "google",
  )!;
  provider.validateAuthorizationCode = async () => ({
    accessToken: "local-test-access",
  });
  provider.getUserInfo = async () => ({
    user: {
      email: "google@example.test",
      emailVerified: true,
      name: "Google Builder",
    },
    data: { sub: "new-google-builder" },
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const start = await call("/sign-in/social", {
      provider: "google",
      callbackURL: origin + "/profile",
    });
    const url = new URL((await start.json()).url);
    const callback = await call(
      "/callback/google?code=local-code&state=" +
        encodeURIComponent(url.searchParams.get("state")!),
    );
    expect(new URL(callback.headers.get("location")!, origin).pathname).toBe(
      "/profile",
    );
    expect(!!(await (await call("/get-session")).json())?.user).toBe(true);
    await call("/sign-out", {});
  }
  expect(await database.db.user.count()).toBe(1);
  expect(
    await database.db.authAccount.count({
      where: { providerId: "credential" },
    }),
  ).toBe(0);
  expect(
    await database.db.authAccount.count({ where: { providerId: "google" } }),
  ).toBe(1);
});

it("rejects direct Google ID-token sign-in instead of bypassing the OAuth factor gate", async () => {
  const result = await call("/sign-in/social", {
    provider: "google",
    idToken: { token: "test-only-value" },
  });
  expect(result.status).toBe(400);
  expect((await result.json()).code).toBe("OAUTH_REDIRECT_REQUIRED");
  expect((await (await call("/get-session")).json()) === null).toBe(true);
  expect(await database.db.user.count()).toBe(0);
});

it("rejects a forged OAuth state before contacting the Google provider", async () => {
  const context = await auth.$context;
  const provider = context.socialProviders.find(
    (item) => item.id === "google",
  )!;
  let exchanges = 0;
  provider.validateAuthorizationCode = async () => {
    exchanges++;
    return { accessToken: "local-test-access" };
  };
  const callback = await call(
    "/callback/google?code=local-code&state=not-issued",
  );
  expect(callback.status).toBe(302);
  expect(
    new URL(callback.headers.get("location")!, origin).searchParams.has(
      "error",
    ),
  ).toBe(true);
  expect(exchanges).toBe(0);
  expect(await database.db.authSession.count()).toBe(0);
});

it("does not implicitly link Google to an existing unverified email account", async () => {
  await call("/sign-up/email", {
    email: "pending@example.test",
    username: "pending_builder",
    name: "Pending",
    password: credential,
  });
  const context = await auth.$context;
  const provider = context.socialProviders.find(
    (item) => item.id === "google",
  )!;
  provider.validateAuthorizationCode = async () => ({
    accessToken: "local-test-access",
  });
  provider.getUserInfo = async () => ({
    user: {
      email: "pending@example.test",
      emailVerified: true,
      name: "Pending",
    },
    data: { sub: "google-pending" },
  });
  const start = await call("/sign-in/social", {
    provider: "google",
    callbackURL: origin + "/profile",
  });
  const state = new URL((await start.json()).url).searchParams.get("state")!;
  const callback = await call(
    "/callback/google?code=local-code&state=" + encodeURIComponent(state),
  );
  expect(
    new URL(callback.headers.get("location")!, origin).searchParams.has(
      "error",
    ),
  ).toBe(true);
  expect(await database.db.authSession.count()).toBe(0);
  expect(
    await database.db.authAccount.count({ where: { providerId: "google" } }),
  ).toBe(0);
  expect(
    (
      await database.db.user.findUniqueOrThrow({
        where: { email: "pending@example.test" },
      })
    ).emailVerified,
  ).toBe(false);
});
