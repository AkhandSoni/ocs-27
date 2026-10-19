import type { DomainId } from "@/lib/recruitment";
import CoverArtwork from "./CoverArtwork";
import { domainById } from "../content";
export default function GameCover({ id }: { id: DomainId }) {
  return (
    <span className={`game-cover cover-${id}`}>
      <CoverArtwork id={id} />
      <span className="cover-shade" />
      <span className="cover-title">{domainById[id].name.toUpperCase()}</span>
    </span>
  );
}
