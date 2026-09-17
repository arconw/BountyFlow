import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "demo");
const languages = ["en", "ru", "es", "pt", "fr", "de", "pl", "uk"];
await mkdir(path.join(demo, "public/locales"), { recursive: true });
await cp(
  path.join(root, "public/licenses"),
  path.join(demo, "public/licenses"),
  { recursive: true },
);

for (const language of languages) {
  const [shared, additions] = await Promise.all([
    readFile(path.join(root, `public/locales/${language}.json`), "utf8"),
    readFile(path.join(demo, `locales/${language}.json`), "utf8"),
  ]);
  await writeFile(
    path.join(demo, `public/locales/${language}.json`),
    JSON.stringify({ ...JSON.parse(shared), ...JSON.parse(additions) }),
  );
}

const child = spawn(
  process.execPath,
  [path.join(root, "node_modules/next/dist/bin/next"), "build"],
  {
    cwd: demo,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  },
);
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", resolve);
});
if (code !== 0) process.exit(code ?? 1);
await writeFile(path.join(demo, "out/.nojekyll"), "");
