import type { DomainId } from "@/lib/recruitment";
import TechWorld from "./TechWorld";
import ResearchWorld from "./ResearchWorld";
import ManagementWorld from "./ManagementWorld";
import DesignWorld from "./DesignWorld";
import CodingWorld from "./CodingWorld";

const worlds = {
  tech: TechWorld,
  research: ResearchWorld,
  management: ManagementWorld,
  design: DesignWorld,
  cc: CodingWorld,
};
/** Named, editable scenes. Covers and wallpapers share a world, not an app icon. */
export default function DomainArtwork({
  id,
  crop = "world",
  className,
}: {
  id: DomainId;
  crop?: "world" | "cover";
  className?: string;
}) {
  const World = worlds[id];
  return (
    <svg
      className={className}
      viewBox={
        crop === "cover"
          ? id === "design"
            ? "910 385 560 500"
            : "760 140 800 730"
          : "0 0 1600 900"
      }
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      data-domain-art={id}
    >
      <World />
    </svg>
  );
}
