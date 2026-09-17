import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { username } from "better-auth/plugins";
import { detectLocale, type Locale } from "../../i18n/config";
import { accountFactor } from "./account-factor";
import { createAttemptLimiter } from "./attempt-limiter";
import type { PrismaClient } from "../../generated/prisma/client";

export type AccountMail = {
  to: string;
  url: string;
  kind: "verify" | "reset";
  locale?: Locale;
};
export function createAccountAuth(
  db: PrismaClient,
  options: {
    origin: string;
    encryptionKey: string;
    sendMail: (message: AccountMail) => Promise<void>;
    rateLimitEnabled?: boolean;
    trustedIpHeader?: string;
    google?: { clientId: string; clientSecret: string };
  },
) {
  const attempts = createAttemptLimiter(db, options.encryptionKey);
  return betterAuth({
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-in/social" && ctx.body?.idToken)
          throw new APIError("BAD_REQUEST", {
            code: "OAUTH_REDIRECT_REQUIRED",
            message: "Use the OAuth redirect flow",
          });
        if (
          [
            "/two-factor/enable",
            "/two-factor/disable",
            "/two-factor/get-totp-uri",
            "/two-factor/generate-backup-codes",
          ].includes(ctx.path)
        ) {
          const current = await getSessionFromCtx(ctx);
          if (
            !current ||
            Date.now() - new Date(current.session.createdAt).getTime() >
              15 * 60_000
          )
            throw new APIError("FORBIDDEN", {
              code: "SESSION_NOT_FRESH",
              message: "Sign in again",
            });
        }

        if (
          ctx.request?.method === "POST" &&
          ctx.request.headers.get("origin") !== options.origin
        )
          throw new APIError("FORBIDDEN", {
            code: "ORIGIN_MISMATCH",
            message: "Origin mismatch",
          });
        if (options.rateLimitEnabled !== false)
          await attempts.check(ctx.path, ctx.body);
      }),
    },
    appName: "BountyBoard",
    baseURL: options.origin,
    secret: options.encryptionKey,
    advanced: {
      ipAddress: {
        ipAddressHeaders: options.trustedIpHeader
          ? [options.trustedIpHeader]
          : [],
      },
    },
    database: prismaAdapter(db, { provider: "sqlite" }),
    user: { modelName: "user", fields: { name: "displayName" } },
    session: {
      modelName: "authSession",
      expiresIn: 60 * 60 * 24 * 7,
      freshAge: 60 * 15,
    },
    account: {
      modelName: "authAccount",
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        allowDifferentEmails: false,
        requireLocalEmailVerified: true,
      },
    },
    verification: { modelName: "authVerification" },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) =>
        options.sendMail({
          to: user.email,
          url,
          kind: "reset",
          locale: detectLocale(
            (request?.headers.get("accept-language") ?? "en")
              .split(",")
              .map((value) => value.split(";")[0].trim()),
          ),
        }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }, request) =>
        options.sendMail({
          to: user.email,
          url,
          kind: "verify",
          locale: detectLocale(
            (request?.headers.get("accept-language") ?? "en")
              .split(",")
              .map((value) => value.split(";")[0].trim()),
          ),
        }),
    },
    socialProviders: options.google ? { google: options.google } : {},
    plugins: [username({ displayUsername: false }), accountFactor()],
    rateLimit: {
      enabled: options.rateLimitEnabled ?? true,
      window: 60,
      max: options.trustedIpHeader ? 100 : 1000,
      customRules: {
        "/sign-in/*": { window: 60, max: options.trustedIpHeader ? 100 : 1000 },
        "/sign-up/email": {
          window: 60,
          max: options.trustedIpHeader ? 100 : 1000,
        },
        "/request-password-reset": {
          window: 60,
          max: options.trustedIpHeader ? 100 : 1000,
        },
        "/send-verification-email": {
          window: 60,
          max: options.trustedIpHeader ? 100 : 1000,
        },
        "/get-session": false,
      },
      customStorage: {
        consume: (key, rule) =>
          attempts.consume(`ip:${key}`, rule.max, rule.window),
      },
    },
    logger: { disabled: true },
  });
}
