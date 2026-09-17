import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const directory = await mkdtemp(join(tmpdir(), "bountyflow-e2e-"));
const configuration = join(directory, "network.json");
const environment = {
  ...process.env,
  DATABASE_URL: `file:${join(directory, "test.db")}`,
  NEXT_BUILD_DIR: ".next-e2e",
  BOUNTY_NETWORK_OUTPUT: configuration,
  APP_ORIGIN: "http://127.0.0.1:3100",
  CI: "1",
  NEXT_PUBLIC_CHAIN_ID: "31337",
  NEXT_PUBLIC_CHAIN_NAME: "Local EVM",
  NEXT_PUBLIC_RPC_URL: "http://127.0.0.1:8545",
  NEXT_PUBLIC_EXPLORER_URL: "",
  NEXT_TELEMETRY_DISABLED: "1",
};
async function run(command, args) {
  const child = spawn(command, args, { stdio: "inherit", env: environment });
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Test command failed (${code})`)),
    );
  });
}
try {
  await run("npm", ["run", "chain:deploy"]);
  const network = JSON.parse(await readFile(configuration, "utf8"));
  environment.NEXT_PUBLIC_CONTRACT_ADDRESS = network.contractAddress;
  environment.NEXT_PUBLIC_DEPLOYMENT_BLOCK = String(network.deploymentBlock);
  await run("npm", ["run", "db:setup"]);
  await run("npm", ["run", "build"]);
  await run("npx", ["playwright", "test", ...process.argv.slice(2)]);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
