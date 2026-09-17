"use client";
import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient } from "better-auth/client/plugins";

export const accountClient = createAuthClient({
  fetchOptions: {
    onRequest: (context) => {
      if (typeof document !== "undefined")
        context.headers.set(
          "accept-language",
          document.documentElement.lang || "en",
        );
    },
  },
  plugins: [
    usernameClient({ displayUsername: false }),
    twoFactorClient({ twoFactorPage: "/two-factor" }),
  ],
});
