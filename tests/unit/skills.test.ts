import { afterEach, beforeEach, expect, it } from "vitest";
import { testDatabase } from "../helpers/database";
import { skillCatalog } from "../../src/content/skills";
import { skillSelectionSchema } from "../../src/lib/skill-schema";
import {
  bountyMetadataSchema,
  onchainBountyMetadataSchema,
} from "../../src/lib/bounty-input";
import { createProfileService } from "../../src/server/services/profile-service";

let database: Awaited<ReturnType<typeof testDatabase>>;
beforeEach(async () => {
  database = await testDatabase();
});
afterEach(async () => {
  await database.close();
});

it("migrates the entire selectable skill catalog without requiring demo data", async () => {
  const rows = await database.db.skill.findMany({ select: { name: true } });
  expect(rows.map((row) => row.name).sort()).toEqual([...skillCatalog].sort());
});

it("canonicalizes spelling and deduplicates skills while rejecting arbitrary values", () => {
  expect(
    skillSelectionSchema.parse(["react", "React", " TypeScript "]),
  ).toEqual(["React", "TypeScript"]);
  expect(skillSelectionSchema.safeParse(["Arbitrary label"]).success).toBe(
    false,
  );
  expect(
    skillSelectionSchema.safeParse(skillCatalog.slice(0, 13)).success,
  ).toBe(false);
  expect(
    bountyMetadataSchema.safeParse({
      title: "Implement shared search",
      description: "Use the curated catalog to match contributor skills.",
      tags: ["Not a catalog skill"],
      category: "Development",
    }).success,
  ).toBe(false);
  expect(
    onchainBountyMetadataSchema.safeParse({
      title: "Preserve earlier escrow metadata",
      description:
        "Previously posted tags remain readable after catalog changes.",
      tags: ["Ethers.js"],
      category: "Development",
    }).success,
  ).toBe(true);
});

it("refuses unknown profile skills without changing the profile or creating catalog entries", async () => {
  const user = await database.db.user.create({
    data: { displayName: "Builder" },
  });
  const service = createProfileService(database.db);
  await expect(
    service.update(user.id, {
      name: "Changed",
      bio: "",
      website: "",
      skills: ["Unknown"],
    }),
  ).rejects.toThrow();
  expect((await service.get(user.id))?.name).toBe("Builder");
  expect(await database.db.skill.count()).toBe(skillCatalog.length);
});
