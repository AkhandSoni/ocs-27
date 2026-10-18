"use client";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { showcaseItems } from "./content";
import { useExperienceInput } from "./ConsoleInput";
export default function ShowcaseExperience() {
  const [selected, setSelected] = useState(0);
  const item = showcaseItems[selected];
  useExperienceInput((action) => {
    if (action === "left" || action === "right") {
      setSelected(
        (i) =>
          (i + (action === "right" ? 1 : -1) + showcaseItems.length) %
          showcaseItems.length,
      );
      return true;
    }
    return false;
  });
  return (
    <section className="native-app collection-app">
      <p className="system-kicker">THE ACM-VIT COLLECTION</p>
      <h1>Ideas, out in the world.</h1>
      <div className="collection-stage">
        <div
          className="collection-cases"
          role="group"
          aria-label="Chapter collection"
        >
          {showcaseItems.map((entry, i) => (
            <button
              key={entry.id}
              className={`collection-case ${i === selected ? "selected" : ""}`}
              aria-label={`Select ${entry.title}`}
              aria-pressed={i === selected}
              onFocus={() => setSelected(i)}
              onClick={() => setSelected(i)}
            >
              <img src={entry.image} alt="" draggable={false} />
              <small>{entry.type}</small>
              <strong>{entry.title}</strong>
            </button>
          ))}
        </div>
        <div className="collection-detail" key={item.id}>
          <span className="system-kicker">
            {item.type} / {String(selected + 1).padStart(2, "0")}
          </span>
          <h2>{item.title}</h2>
          <h3>{item.summary}</h3>
          <p>{item.body}</p>
          <a
            className="quiet-button"
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            Open source reference <ArrowUpRight size={18} />
          </a>
          <small>
            Verified from {item.source}. No attendance, award or achievement
            statistics are invented.
          </small>
        </div>
      </div>
    </section>
  );
}
