import { useId } from "react";
import type { DomainId } from "@/lib/recruitment";
import { domainCoverArt } from "@/lib/domain-cover-art";
import CodingWorld from "./CodingWorld";
export default function CoverArtwork({ id, crop = "cover", className }: { id: DomainId; crop?: "world" | "cover"; className?: string }) {
  const clip = useId();
  if (id === "cc") return <svg className={className} viewBox="760 140 800 730" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" data-domain-art="cc"><CodingWorld /></svg>;
  const art = domainCoverArt[id];
  const [x, y, width, height] = art.crop;
  // The world keeps the complete illustration on the right, leaving its own
  // sampled ground color behind readable native console copy on the left.
  return <svg className={className} viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio={crop === "world" ? "xMaxYMid meet" : `xMidYMid ${art.fit}`} aria-hidden="true" data-domain-art={id} data-cover-art={id} style={{ background: art.background }}>
    <defs><clipPath id={clip}><rect x={x} y={y} width={width} height={height} /></clipPath></defs>
    <image href={art.src} width="757" height="690" clipPath={`url(#${clip})`} />
  </svg>;
}
