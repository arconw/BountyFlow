import { expect, it, vi } from "vitest";
import { handleBoundedAuthRequest } from "../../src/server/auth/request-limit";

it("rejects oversized declared and streamed bodies before invoking authentication", async () => {
  const handler = vi.fn();
  const declared = new Request("http://localhost/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-length": "32769" },
    body: "{}",
  });
  expect((await handleBoundedAuthRequest(declared, handler)).status).toBe(413);
  let reads = 0;
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      reads++;
      controller.enqueue(new Uint8Array(8192));
    },
    cancel,
  });
  const chunked = new Request("http://localhost/api/auth/sign-in/email", {
    method: "POST",
    body: stream,
    ...{ duplex: "half" },
  });
  expect((await handleBoundedAuthRequest(chunked, handler)).status).toBe(413);
  expect(reads).toBeLessThanOrEqual(6);
  expect(cancel).toHaveBeenCalledOnce();
  expect(handler).not.toHaveBeenCalled();
});
it("preserves cookies, origin, query and encoded body for the auth protocol", async () => {
  const original = "code=local-code&state=local-state";
  const request = new Request(
    "http://localhost/api/auth/callback/google?query=1",
    {
      method: "POST",
      headers: {
        cookie: "test-cookie=local-test",
        origin: "http://localhost",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: original,
    },
  );
  const response = await handleBoundedAuthRequest(request, async (bounded) => {
    expect(bounded.url).toBe(request.url);
    expect(bounded.headers.get("origin")).toBe("http://localhost");
    expect(bounded.headers.get("cookie")).toBe("test-cookie=local-test");
    expect(await bounded.text()).toBe(original);
    return new Response(null, { status: 204 });
  });
  expect(response.status).toBe(204);
});
