import "server-only";
import { ZodError } from "zod";
import { ApiError } from "../http/errors";

export async function actionResult<T>(action: () => Promise<T>) {
  try {
    return { data: await action(), error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof ApiError
          ? error.code
          : error instanceof ZodError
            ? "INVALID_INPUT"
            : "SERVICE_UNAVAILABLE",
    };
  }
}
