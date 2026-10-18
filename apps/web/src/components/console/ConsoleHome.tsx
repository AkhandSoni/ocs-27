"use client";
import { useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { experienceOrder, experiences, type ExperienceId } from "./content";
import Glyph from "./Glyph";
import ExperiencePreview from "./ExperiencePreview";
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
            <Glyph id={id} />
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
          ACM-VIT ORGANIZING COMMITTEE SELECTIONS ’27
        </p>
        <h1>
          {selected === "cc" ? (
            <>
              COMPETITIVE
              <br />
              CODING
            </>
          ) : (
            item.title
          )}
        </h1>
        <h2>{item.subtitle}</h2>
        <p className="experience-description">{item.description}</p>
        <button className="launch-button" onClick={() => onLaunch(selected)}>
          {selected === "arcade"
            ? "Start game"
            : selected === "showcase"
              ? "Open collection"
              : selected === "applications"
                ? "Open my console"
                : "Enter domain"}
          <ArrowRight size={22} />
        </button>
      </section>
      <ExperiencePreview id={selected} />
    </div>
  );
}
