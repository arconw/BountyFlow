import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, expect, it } from "vitest";
import { testDatabase } from "../helpers/database";
import { createAccountAuth } from "../../src/server/auth/create-account-auth";
import { createAttemptLimiter } from "../../src/server/auth/attempt-limiter";

let database: Awaited<ReturnType<typeof testDatabase>>;
const origin = "http://localhost:3100";
const encryptionKey = randomBytes(48).toString("base64");
beforeEach(async () => {
  database = await testDatabase();
});
afterEach(async () => {
  await database.close();
});
function authentication() {
  return createAccountAuth(database.db, {
    origin,
    encryptionKey,
    sendMail: async () => {},
    rateLimitEnabled: true,
  });
}
async function attempt(
  auth: ReturnType<typeof authentication>,
  path: string,
  body: unknown,
  forwarded: string,
) {
  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-forwarded-for": forwarded,
      },
      body: JSON.stringify(body),
    }),
  );
}
it("limits one account across email, username, spoofed IPs and auth restarts", async () => {
  await database.db.user.create({
    data: {
      displayName: "Builder",
      username: "builder",
      email: "builder@example.test",
      emailVerified: true,
    },
  });
  const auth = authentication();
  for (let attemptIndex = 0; attemptIndex < 10; attemptIndex++) {
    const username = attemptIndex % 2 === 0;
    const result = await attempt(
      auth,
      username ? "/sign-in/username" : "/sign-in/email",
      {
        ...(username
          ? { username: "BUILDER" }
          : { email: "builder@example.test" }),
        password: "invalid-test-passphrase",
      },
      `198.51.100.${attemptIndex + 1}`,
    );
    expect(result.status).toBe(401);
  }
  const limited = await attempt(
    authentication(),
    "/sign-in/email",
    { email: "builder@example.test", password: "invalid-test-passphrase" },
    "203.0.113.1",
  );
  expect(limited.status).toBe(429);
  expect((await limited.json()).code).toBe("TOO_MANY_REQUESTS");
  expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  const other = await attempt(
    auth,
    "/sign-in/email",
    { email: "other@example.test", password: "invalid-test-passphrase" },
    "203.0.113.1",
  );
  expect(other.status).toBe(401);
});
it("bounds repeated recovery emails independently of forwarded headers", async () => {
  const auth = authentication();
  for (let index = 0; index < 5; index++) {
    const response = await attempt(
      auth,
      "/request-password-reset",
      { email: "absent@example.test" },
      `198.51.100.${index + 1}`,
    );
    expect(response.status).toBe(200);
  }
  expect(
    (
      await attempt(
        auth,
        "/request-password-reset",
        { email: "ABSENT@example.test" },
        "203.0.113.2",
      )
    ).status,
  ).toBe(429);
});
it("increments limits atomically, expires them and stores only keyed digests", async () => {
  const limiter = createAttemptLimiter(database.db, encryptionKey);
  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      limiter.consume("sign-in:private@example.test", 10, 60),
    ),
  );
  expect(results.filter((result) => result.allowed)).toHaveLength(10);
  const rows = await database.db.authAttempt.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0].key).toMatch(/^[a-f0-9]{64}$/);
  expect(rows[0].count).toBe(20);
  await database.db.authAttempt.updateMany({
    data: { expiresAt: new Date(0) },
  });
  expect(
    (await limiter.consume("sign-in:private@example.test", 10, 60)).allowed,
  ).toBe(true);
  expect((await database.db.authAttempt.findFirstOrThrow()).count).toBe(1);
});
