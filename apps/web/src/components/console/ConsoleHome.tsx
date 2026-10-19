"use client";
import { useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { experienceOrder, experiences, type ExperienceId } from "./content";
import Glyph from "./Glyph";
import ExperiencePreview from "./ExperiencePreview";
import DomainArtwork from "./art/DomainArtwork";
import GameCover from "./art/GameCover";
import { gameIdentities, isDomain } from "./game-identities";
import { domainById } from "./content";
export default function ConsoleHome({
  selected,
  onSelect,
  onLaunch,
  submitted,
}: {
  selected: ExperienceId;
  onSelect: (id: ExperienceId) => void;
  onLaunch: (id?: ExperienceId) => void;
  submitted: string[];
}) {
  const rail = useRef<HTMLDivElement>(null);
  const item = experiences[selected];
  useEffect(() => {
    rail.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [selected]);
  return (
    <div className="console-home" data-console-home>
      {isDomain(selected) && (
        <div
          className={`home-world world-${selected}`}
          key={`world-${selected}`}
        >
          <DomainArtwork id={selected} />
          <div className="world-legibility" />
        </div>
      )}
      <div
        className="experience-rail"
        ref={rail}
        role="group"
        aria-label="Console experiences"
      >
        {experienceOrder.map((id, index) => (
          <button
            key={id}
            className={`cartridge ${selected === id ? "selected" : ""}`}
            aria-label={`Select ${experiences[id].title}`}
            aria-pressed={selected === id}
            onFocus={() => onSelect(id)}
            onMouseEnter={() => onSelect(id)}
            onClick={() => onLaunch(id)}
            style={
              { "--item-color": experiences[id].color } as React.CSSProperties
            }
          >
            <span className="cartridge-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            {isDomain(id) ? <GameCover id={id} /> : <Glyph id={id} />}
            <span className="cartridge-name">
              {id === "cc"
                ? "CC"
                : id === "applications"
                  ? "MY CONSOLE"
                  : id === "showcase"
                    ? "COLLECTION"
                    : id === "arcade"
                      ? "ARCADE"
                      : experiences[id].title}
            </span>
            {submitted.includes(id) && (
              <Check size={13} className="cartridge-check" />
            )}
          </button>
        ))}
      </div>
      <div className="selection-caption">
        <span>{item.category}</span>
        <span>
          {String(experienceOrder.indexOf(selected) + 1).padStart(2, "0")} / 08
        </span>
      </div>
      <section
        className={`experience-title ${selected === "cc" ? "long-title" : ""}`}
        key={selected}
      >
        <p className="system-kicker">
          {isDomain(selected)
            ? `${domainById[selected].name.toUpperCase()} / ${gameIdentities[selected].genre}`
            : "ACM-VIT ORGANIZING COMMITTEE SELECTIONS ’27"}
        </p>
        <h1>
          {isDomain(selected)
            ? domainById[selected].name.toUpperCase()
            : item.title}
        </h1>
        <h2>{item.subtitle}</h2>
        <p className="experience-description">{item.description}</p>
        {isDomain(selected) && (
          <p className="game-capabilities">
            {domainById[selected].areas.join(" · ")}
          </p>
        )}
        {!isDomain(selected) && <button className="launch-button" onClick={() => onLaunch(selected)}>
          {selected === "arcade"
            ? "Start game"
            : selected === "showcase"
              ? "Open collection"
              : "Open my console"}
          <ArrowRight size={22} />
        </button>}
      </section>
      {!isDomain(selected) && <ExperiencePreview id={selected} />}
    </div>
  );
}
