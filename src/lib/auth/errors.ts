export function accountError(code?: string) {
  if (code === "EMAIL_NOT_VERIFIED") return "auth_verify_notice";
  if (code === "USERNAME_IS_ALREADY_TAKEN" || code === "USER_ALREADY_EXISTS")
    return "auth_account_exists";
  if (code === "INVALID_USERNAME") return "auth_username_hint";
  if (code === "TOO_MANY_REQUESTS") return "auth_rate_limited";
  if (code === "SESSION_NOT_FRESH") return "auth_reauthenticate";
  return "auth_error";
}
