import { createHmac } from "node:crypto";
import { APIError } from "better-auth/api";
import type { PrismaClient } from "../../generated/prisma/client";

export function createAttemptLimiter(db: PrismaClient, encryptionKey: string) {
  let nextCleanupAt = Date.now() + 60_000;
  async function consume(
    identity: string,
    limit: number,
    windowSeconds: number,
  ) {
    const key = createHmac("sha256", encryptionKey)
      .update(identity)
      .digest("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    const [bucket] = await db.$queryRaw<{ count: number; expiresAt: string }[]>`
      INSERT INTO "AuthAttempt" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "AuthAttempt"."expiresAt" <= ${now} THEN 1 ELSE "AuthAttempt"."count" + 1 END,
        "expiresAt" = CASE WHEN "AuthAttempt"."expiresAt" <= ${now} THEN excluded."expiresAt" ELSE "AuthAttempt"."expiresAt" END
      RETURNING "count", CAST("expiresAt" AS TEXT) AS "expiresAt"
    `;
    if (now.getTime() >= nextCleanupAt) {
      nextCleanupAt = now.getTime() + 60_000;
      await db.authAttempt
        .deleteMany({ where: { expiresAt: { lte: now } } })
        .catch(() => undefined);
    }
    return {
      allowed: bucket.count <= limit,
      retryAfter:
        bucket.count <= limit
          ? null
          : Math.max(
              1,
              Math.ceil(
                (new Date(bucket.expiresAt).getTime() - now.getTime()) / 1000,
              ),
            ),
    };
  }

  async function check(
    path: string,
    body: Record<string, unknown> | undefined,
  ) {
    const signIn = path === "/sign-in/email" || path === "/sign-in/username";
    const mail =
      path === "/request-password-reset" ||
      path === "/send-verification-email" ||
      path === "/sign-up/email";
    if (!signIn && !mail) return;
    const submitted =
      path === "/sign-in/username" ? body?.username : body?.email;
    if (
      typeof submitted !== "string" ||
      !submitted.trim() ||
      submitted.length > 320
    )
      return;
    const identifier = submitted.trim().toLowerCase();
    const user = await db.user.findUnique({
      where:
        path === "/sign-in/username"
          ? { username: identifier }
          : { email: identifier },
      select: { id: true },
    });
    const decision = await consume(
      `${signIn ? "sign-in" : "mail"}:${user?.id ?? identifier}`,
      signIn ? 10 : 5,
      signIn ? 60 : 900,
    );
    if (!decision.allowed)
      throw new APIError(
        "TOO_MANY_REQUESTS",
        { code: "TOO_MANY_REQUESTS", message: "Try again later" },
        { "Retry-After": String(decision.retryAfter) },
      );
  }

  return { consume, check };
}
