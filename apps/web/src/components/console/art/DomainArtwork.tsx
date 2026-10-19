import type { DomainId } from "@/lib/recruitment";
import CodingWorld from "./CodingWorld";
import CoverArtwork from "./CoverArtwork";
/** Cover, wallpaper and physical disc all share the selected title's artwork. */
export default function DomainArtwork({ id, crop = "world", className }: {
  id: DomainId; crop?: "world" | "cover"; className?: string;
}) {
  if (id !== "cc") return <CoverArtwork id={id} crop={crop} className={className} />;
  return <svg className={className} viewBox={crop === "cover" ? "760 140 800 730" : "0 0 1600 900"} preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" data-domain-art={id}><CodingWorld /></svg>;
}
