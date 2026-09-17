import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const children = new Set();
function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      APP_ORIGIN: process.env.APP_ORIGIN ?? "http://localhost:3000",
    },
    ...options,
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}
function completed(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Command failed (${code})`)),
    );
  });
}
async function rpc(method, params = []) {
  const response = await fetch("http://127.0.0.1:8545", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(1500),
  });
  const body = await response.json();
  if (body.error) throw new Error("Local RPC failed");
  return body.result;
}
function stop() {
  for (const child of children) child.kill("SIGTERM");
}
process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});
try {
  let chain;
  try {
    chain = await rpc("eth_chainId");
  } catch {}
  if (!chain) {
    run(process.execPath, ["scripts/chain-node.mjs"]);
    for (let attempt = 0; attempt < 40; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        chain = await rpc("eth_chainId");
        break;
      } catch {}
    }
  }
  if (chain !== "0x7a69")
    throw new Error("Expected local EVM chain 31337 at port 8545");
  await completed(run("npm", ["run", "contract:compile"]));
  const config = JSON.parse(await readFile("config/network.json", "utf8"));
  if (config.chainId !== 31337)
    throw new Error("Use a local network configuration for dev:local");
  const code = config.contractAddress
    ? await rpc("eth_getCode", [config.contractAddress, "latest"])
    : "0x";
  if (code === "0x") await completed(run("npm", ["run", "chain:deploy"]));
  await completed(run("npm", ["run", "db:setup"]));
  await completed(
    run("npm", [
      "run",
      process.argv.includes("--review") ? "build" : "typecheck",
    ]),
  );
  await completed(
    run("npm", ["run", process.argv.includes("--review") ? "start" : "dev"]),
  );
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
} finally {
  stop();
}
