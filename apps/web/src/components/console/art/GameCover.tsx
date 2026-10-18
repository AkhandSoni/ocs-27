import type { DomainId } from "@/lib/recruitment";
import DomainArtwork from "./DomainArtwork";
import { domainById } from "../content";
export default function GameCover({ id }: { id: DomainId }) {
  return (
    <span className={`game-cover cover-${id}`}>
      <DomainArtwork id={id} crop="cover" />
      <span className="cover-shade" />
      <span className="cover-title">{domainById[id].name.toUpperCase()}</span>
    </span>
  );
}
