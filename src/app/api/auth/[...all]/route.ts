import { getAccountAuth } from "@/server/auth/account-auth";
import { handleBoundedAuthRequest } from "@/server/auth/request-limit";

export const runtime = "nodejs";
export const GET = (request: Request) => getAccountAuth().handler(request);
export const POST = (request: Request) =>
  handleBoundedAuthRequest(request, (bounded) =>
    getAccountAuth().handler(bounded),
  );
