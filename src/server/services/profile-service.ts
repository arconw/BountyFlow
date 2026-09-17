import type { PrismaClient } from "../../generated/prisma/client";
import { profileSchema, type Profile } from "../../lib/profile-schema";
import { createUserRepository } from "../repositories/user-repository";

export function createProfileService(db: PrismaClient) {
  return {
    async get(userId: string) {
      const user = await createUserRepository(db).findUser(userId);
      return user
        ? {
            name: user.displayName,
            bio: user.bio,
            website: user.website,
            skills: user.skills.map((skill) => skill.name),
          }
        : null;
    },
    async update(userId: string, profile: Profile) {
      const validated = profileSchema.parse(profile);
      await db.user.update({
        where: { id: userId },
        data: {
          displayName: validated.name,
          bio: validated.bio,
          website: validated.website,
          skills: {
            set: [],
            connect: validated.skills.map((name) => ({ name })),
          },
        },
      });
      return validated;
    },
  };
}
