"use client";
import { DOMAINS, type DomainState } from "@/lib/domain-sequence";
import type { DomainId } from "@/lib/recruitment";
import DomainArtwork from "./art/DomainArtwork";
const phases: Record<string, string> = {
  presenting: "Opening disc library", choosing: "Choose a domain disc",
  opening: "Opening case", lifting: "Preparing disc", travelling: "Loading disc",
  inserting: "Reading disc", closing: "Starting experience", booting: "Starting experience",
  returning: "Returning disc to library",
};
export default function DomainTransportScreen({ state }: { state: DomainState }) {
  const domain = state.selected === null ? null : DOMAINS[state.selected];
  const id = domain?.id === "competitive-coding" ? "cc" : domain?.id;
  return <section className="disc-screen" aria-label="Domain disc transport">
    {id && <DomainArtwork id={id as DomainId} />}
    <div className="disc-screen-copy">
      <p>ACM-VIT / OCS ’27</p>
      <h1>{domain?.name ?? "Domain library"}</h1>
      <p role="status">{phases[state.phase]}</p>
      {state.phase === "choosing" ? <p>Left / Right to preview · Enter to insert · Escape to return</p> : <div className="disc-read-progress" aria-hidden="true"><span /></div>}
    </div>
  </section>;
}
