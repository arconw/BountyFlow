const maximumBodyBytes = 32 * 1024;

export async function handleBoundedAuthRequest(
  request: Request,
  handler: (request: Request) => Promise<Response>,
) {
  const oversized = () =>
    Response.json(
      { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" },
      { status: 413 },
    );
  if (Number(request.headers.get("content-length")) > maximumBodyBytes)
    return oversized();
  if (!request.body) return handler(request);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBodyBytes) {
      void reader.cancel().catch(() => undefined);
      return oversized();
    }
    chunks.push(value);
  }
  return handler(
    new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: Buffer.concat(chunks),
      signal: request.signal,
    }),
  );
}
