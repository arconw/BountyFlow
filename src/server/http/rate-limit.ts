import { createHash } from "node:crypto";
import { ApiError } from "./errors";
const windows = new Map<string, { count: number; expires: number }>();
export function rateLimitAccount(userId: string, scope: string, limit = 30) {
  const now = Date.now();
  for (const [key, value] of windows)
    if (value.expires < now) windows.delete(key);
  const key = createHash("sha256").update(`${scope}:${userId}`).digest("hex");
  const window = windows.get(key) ?? { count: 0, expires: now + 60_000 };
  if (++window.count > limit) throw new ApiError("RATE_LIMITED", 429);
  windows.set(key, window);
}
