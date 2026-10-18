"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { domainById, domainInfo, experiences } from "./content";
import type { DomainId } from "@/lib/recruitment";
import Glyph from "./Glyph";
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
  const labels = ["Overview", "Your role", "Selections"];
  const d = domainById[id],
    info = domainInfo[id];
  useExperienceInput((action) => {
    if (action === "left" || action === "right") {
      setTab((x) => (x + (action === "right" ? 1 : -1) + 3) % 3);
      return true;
    }
    return false;
  });
  return (
    <section className="native-app domain-app" data-domain={id}>
      <div className="app-heading">
        <Glyph id={id} />
        <div>
          <p>RECRUITMENT EXPERIENCE / {d.number}</p>
          <h1>{id === "cc" ? "Competitive Coding" : d.name}</h1>
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
