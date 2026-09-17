import type { createAccountAuth } from "./create-account-auth";
import { ApiError } from "../http/errors";
export async function setAccountAccess(
  auth: ReturnType<typeof createAccountAuth>,
  headers: Headers,
  newPassword: string,
) {
  const current = await auth.api.getSession({ headers });
  if (!current?.user.emailVerified) throw new ApiError("AUTH_REQUIRED", 401);
  if (Date.now() - new Date(current.session.createdAt).getTime() > 15 * 60_000)
    throw new ApiError("SESSION_NOT_FRESH", 403);
  return auth.api.setPassword({
    body: { newPassword },
    headers,
    asResponse: true,
  });
}
