import { z } from "zod";
import { findSkill, maxSelectedSkills } from "../content/skills";

export const skillSelectionSchema = z
  .array(
    z.string().transform((value, context) => {
      const skill = findSkill(value);
      if (skill) return skill;
      context.addIssue({ code: "custom", message: "UNKNOWN_SKILL" });
      return z.NEVER;
    }),
  )
  .max(maxSelectedSkills)
  .transform((skills) => [...new Set(skills)]);
