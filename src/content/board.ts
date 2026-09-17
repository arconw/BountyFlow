import { skillCatalog } from "./skills";

export const skillFilters = ["All skills", ...skillCatalog] as const;
export const boardTabs = [
  "All bounties",
  "Open",
  "In progress",
  "Completed",
] as const;
export const personalTabs = [
  "Created by me",
  "Accepted by me",
  "Completed",
] as const;
