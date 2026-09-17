import type { DemoProfile, DemoRole } from "../state/types";

export const demoPeople: Record<
  DemoRole,
  {
    id: string;
    username: string;
    profile: DemoProfile;
  }
> = {
  creator: {
    id: "demo-creator",
    username: "nora_builds",
    profile: {
      name: "Nora Chen",
      bio: "Building thoughtful open-source tools for independent teams.",
      skills: ["TypeScript", "React", "Solidity"],
      website: "https://example.com/nora",
    },
  },
  contributor: {
    id: "demo-contributor",
    username: "leo_codes",
    profile: {
      name: "Leo Martins",
      bio: "Frontend engineer. Small contributions, lasting improvements.",
      skills: ["React", "Accessibility", "Testing"],
      website: "https://example.com/leo",
    },
  },
};
