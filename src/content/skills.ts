export const skillCatalog = [
  "Accessibility",
  "CSS",
  "Design system",
  "Documentation",
  "ERC-4337",
  "Figma",
  "Foundry",
  "GraphQL",
  "Hardhat",
  "JavaScript",
  "Mobile",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Product",
  "React",
  "Research",
  "Rust",
  "Security",
  "Solidity",
  "Technical writing",
  "Testing",
  "TypeScript",
  "UI / UX",
  "WalletConnect",
  "viem",
  "wagmi",
] as const;

export const maxSelectedSkills = 12;

export function findSkill(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  return skillCatalog.find((skill) => skill.toLowerCase() === normalized);
}
