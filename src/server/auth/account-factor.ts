import { createAuthMiddleware } from "better-auth/api";
import { twoFactor } from "better-auth/plugins";

export function accountFactor() {
  const plugin = twoFactor({ issuer: "BountyBoard", allowPasswordless: true });
  const credentialHook = plugin.hooks.after[0];
  const credentialMatcher = credentialHook.matcher;
  credentialHook.matcher = (context) =>
    credentialMatcher(context) || !!context.path?.startsWith("/callback/");
  plugin.hooks.after.push({
    matcher: (context) => !!context.path?.startsWith("/callback/"),
    handler: createAuthMiddleware(async (context) => {
      const result = context.context.returned;
      if (
        result &&
        typeof result === "object" &&
        "twoFactorRedirect" in result &&
        result.twoFactorRedirect
      )
        throw context.redirect("/two-factor");
      return undefined;
    }),
  });
  return plugin;
}
