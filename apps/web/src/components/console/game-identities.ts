import type { DomainId } from "@/lib/recruitment";
import type { ExperienceId } from "./content";
export const gameIdentities: Record<
  DomainId,
  { genre: string; material: string; accent: string }
> = {
  tech: {
    genre: "AUTOMATION / BUILDING",
    material: "Industrial · orthographic",
    accent: "#d2ae6d",
  },
  research: {
    genre: "EXPLORATION / DISCOVERY",
    material: "Expedition · landscape",
    accent: "#d5af7d",
  },
  management: {
    genre: "STRATEGY / LOGISTICS",
    material: "Cartographic · graphic",
    accent: "#d9b281",
  },
  design: {
    genre: "PAPERCRAFT / ADVENTURE",
    material: "Folded paper · tactile",
    accent: "#e9b292",
  },
  cc: {
    genre: "PUZZLE / LOGIC",
    material: "Pixel grid · recursive",
    accent: "#bca3d9",
  },
};
export function isDomain(id: ExperienceId): id is DomainId {
  return id in gameIdentities;
}
