import { z } from "zod";
import { skillSelectionSchema } from "./skill-schema";

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  bio: z.string().max(400),
  skills: skillSelectionSchema,
  website: z
    .string()
    .max(200)
    .refine((value) => {
      if (!value) return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }),
});
export type Profile = z.infer<typeof profileSchema>;
export const emptyProfile: Profile = {
  name: "",
  bio: "",
  skills: [],
  website: "",
};
