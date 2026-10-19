"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { domainById, domainInfo, experiences } from "./content";
import type { DomainId } from "@/lib/recruitment";
import { DOMAIN_CATALOG, toolLogo } from "@/lib/domain-catalog";
import GameCover from "./art/GameCover";
import DomainArtwork from "./art/DomainArtwork";
import { gameIdentities } from "./game-identities";
import { useExperienceInput } from "./ConsoleInput";
export default function DomainExperience({
  id,
  onApply,
  onShowcase,
  submitted,
}: {
  id: DomainId;
  onApply: () => void;
  onShowcase: () => void;
  submitted: boolean;
}) {
  const [tab, setTab] = useState(0);
  const labels = ["Overview", "Your role", "Selections", "Tools"];
  const tools = DOMAIN_CATALOG[id === "cc" ? "competitive-coding" : id];
  const d = domainById[id],
    info = domainInfo[id];
  useExperienceInput((action) => {
    if (action === "left" || action === "right") {
      setTab((x) => (x + (action === "right" ? 1 : -1) + labels.length) % labels.length);
      return true;
    }
    return false;
  });
  return (
    <section className="native-app domain-app" data-domain={id}>
      <div className="domain-world">
        <DomainArtwork id={id} />
        <div className="world-legibility" />
      </div>
      <div className="app-heading">
        <div className="domain-jacket">
          <GameCover id={id} />
        </div>
        <div>
          <p>
            {d.name.toUpperCase()} / DOMAIN {d.number} /{" "}
            {gameIdentities[id].genre}
          </p>
          <h1 className="game-hub-title">{d.name.toUpperCase()}</h1>
        </div>
      </div>
      <nav className="app-tabs" aria-label="Domain sections">
        {labels.map((label, i) => (
          <button
            key={label}
            aria-current={tab === i ? "page" : undefined}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="domain-content" key={tab}>
        {tab === 0 && (
          <>
            <h2>{experiences[id].subtitle}</h2>
            <p>{experiences[id].description}</p>
            <div className="interest-line">
              {d.areas.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>
            <h3>From the chapter</h3>
            <p>{info.work}</p>
            <button className="quiet-button" onClick={onShowcase}>
              Explore The Collection <ArrowRight size={17} />
            </button>
          </>
        )}
        {tab === 1 && (
          <>
            <h2>What you’ll do</h2>
            <ul className="console-list">
              {info.responsibilities.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h3>What we look for</h3>
            <ul className="console-list">
              {info.expectations.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        )}
        {tab === 3 && <>
          <h2>Explore the toolkit</h2>
          <p className="system-note">Examples to explore, not prerequisites or a claim about the chapter’s production stack.</p>
          <div className="domain-tools">{tools.disciplines.map(discipline => <div key={discipline.name}>
            <strong>{discipline.name}</strong>{discipline.tools.map(tool => <span key={tool.name}>
              {tool.logo && <img src={toolLogo(tool.logo)} alt="" width={22} height={22} />}{tool.name}
            </span>)}
          </div>)}</div>
        </>}
        {tab === 2 && (
          <>
            <h2>Your next two steps.</h2>
            <div className="round-line">
              <b>00</b>
              <div>
                <h3>Application</h3>
                <p>
                  Your introduction and three domain questions. Drafts save on
                  this console.
                </p>
              </div>
              {submitted && <Check size={22} />}
            </div>
            <div className="round-line">
              <b>01</b>
              <div>
                <h3>Interview</h3>
                <p>
                  A conversation about your interests and approach. Interview
                  details are not published in this prototype.
                </p>
              </div>
            </div>
            <p className="system-note">
              You can apply to all five domains. Questions are sample OCS ’27
              content; application submissions are browser-local.
            </p>
          </>
        )}
      </div>
      <button className="launch-button domain-apply" onClick={onApply}>
        {submitted ? "View application" : "Begin application"}
        <ArrowRight size={21} />
      </button>
    </section>
  );
}
