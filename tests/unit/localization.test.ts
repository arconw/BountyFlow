import { readFile, readdir } from "node:fs/promises";
import { expect, it } from "vitest";
import { createTranslator } from "next-intl";

it("ships eight complete dictionaries with valid messages and plurals", async () => {
  const files = await readdir("public/locales");
  expect(files.sort()).toEqual([
    "de.json",
    "en.json",
    "es.json",
    "fr.json",
    "pl.json",
    "pt.json",
    "ru.json",
    "uk.json",
  ]);
  const source = JSON.parse(await readFile("public/locales/en.json", "utf8"));
  for (const file of files) {
    const messages = JSON.parse(
      await readFile(`public/locales/${file}`, "utf8"),
    );
    expect(Object.keys(messages).sort()).toEqual(Object.keys(source).sort());
    const errors: unknown[] = [];
    const t = createTranslator({
      locale: file.slice(0, -5),
      messages,
      onError: (error) => errors.push(error),
    });
    for (const key of Object.keys(messages))
      expect(
        t(key, {
          count: 22,
          visible: 6,
          total: 9,
          network: "Sepolia",
          current: "Arbitrum",
          reward: "0.05",
        }),
      ).toBeTruthy();
    expect(errors).toEqual([]);
  }
});
