import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../demo/out/", import.meta.url));
const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "/BountyFlow";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (
      !["GET", "HEAD"].includes(request.method) ||
      !pathname.startsWith(`${prefix}/`)
    ) {
      response.writeHead(404).end();
      return;
    }
    let path = resolve(directory, `.${pathname.slice(prefix.length)}`);
    if (!path.startsWith(`${resolve(directory)}${sep}`)) {
      if (path !== resolve(directory)) {
        response.writeHead(404).end();
        return;
      }
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const body = await readFile(path);
    response.writeHead(200, {
      "content-type": types[extname(path)] ?? "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(3200, "127.0.0.1", () => {
  process.stdout.write(`Static demo: http://127.0.0.1:3200${prefix}/\n`);
});
