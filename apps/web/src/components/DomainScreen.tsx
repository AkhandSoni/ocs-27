"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { DOMAINS, type DomainState } from "@/lib/domain-sequence";
import { COLLECTION_POSTER, DOMAIN_CATALOG, domainCover, domainPoster, isDomainBootVisible, toolLogo } from "@/lib/domain-catalog";
import styles from "./DomainScreen.module.css";

export const DOMAIN_STATUS = {
  idle: "", presenting: "Opening the domain collection", choosing: "Choose a disc case",
  opening: "Opening the case", lifting: "Releasing the disc", travelling: "Moving to the console",
  inserting: "Inserting the disc", closing: "Closing the disc drive", booting: "Starting your domain",
  active: "Domain loaded", returning: "Returning to the room",
} as const;

/** A TV keeps its physical aspect ratio; phone text needs a native-size surface. */
export function DomainMobileToolkit({ selected }: { selected: number }) {
  const domain = DOMAINS[selected];
  const catalog = DOMAIN_CATALOG[domain.id];
  return <aside className={styles.mobileToolkit} aria-label={`${domain.name} toolkit`}>
    <h2>{domain.name} <span>Toolkit</span></h2>
    <ul>{catalog.disciplines.map(discipline => <li key={discipline.name}>
      <h3>{discipline.name}</h3>
      <p>{discipline.tools.map(tool => <span key={tool.name}>
        {tool.logo && <Image src={toolLogo(tool.logo)} alt="" width={18} height={18} unoptimized />}{tool.name}
      </span>)}</p>
    </li>)}</ul>
  </aside>;
}

export default function DomainScreen({ state }: { state: DomainState }) {
  const domain = state.selected === null ? null : DOMAINS[state.selected];
  const catalog = domain ? DOMAIN_CATALOG[domain.id] : null;
  const [readyPoster, setReadyPoster] = useState("");
  const [failedPoster, setFailedPoster] = useState("");
  const source = domain ? domainPoster(domain.id) : "";
  const active = state.phase === "active";
  const reveal = domain && isDomainBootVisible(state.phase);

  return <section className={styles.screen} data-domain-screen data-phase={state.phase}
    data-domain={domain?.id ?? "collection"} data-reveal={reveal ? "true" : "false"}
    aria-label={domain ? `${domain.name} domain` : "Domain collection"}
    style={{ "--domain-accent": domain?.color ?? "#aebde5" } as CSSProperties}>
    <Image className={styles.collectionArt} src={COLLECTION_POSTER} alt="" fill unoptimized loading="eager" draggable={false} />
    {domain && catalog && <div className={styles.domainLayer} aria-hidden={!reveal}>
      <div className={styles.artwork} data-ready={readyPoster === source}>
        <Image key={source} src={source} alt="" fill unoptimized loading="eager" draggable={false}
          onLoad={event => {
            const image = event.currentTarget;
            // Keep the collection underneath until the selected SVG has decoded.
            void image.decode().then(() => setReadyPoster(source)).catch(() => setReadyPoster(source));
          }} onError={() => setFailedPoster(source)} />
      </div>
      <div className={styles.readability} aria-hidden="true" />
      <header className={styles.header}>
        <div><strong>Domains</strong><span>ACM VIT</span></div>
        <span className={styles.edition}>OCS’27 <i /> {String(state.selected! + 1).padStart(2, "0")}</span>
      </header>
      <ol className={styles.coverStrip} aria-label="Domain collection">
        {DOMAINS.map(item => <li key={item.id} aria-label={item.name} aria-current={item.id === domain.id ? "true" : undefined}>
          <div className={styles.cover}><Image src={domainCover(item.id)} alt="" fill unoptimized draggable={false} /></div>
          {item.id === domain.id && <span>{item.name}</span>}
        </li>)}
      </ol>
      <div className={styles.identity}>
        <p className={styles.eyebrow}>{catalog.genre}</p>
        <h1 className={domain.id === "competitive-coding" ? styles.longTitle : domain.id === "management" ? styles.mediumTitle : ""}>
          {domain.lines.map(line => <span key={line}>{line}</span>)}
        </h1>
        <h2>{catalog.headline}</h2>
        <p className={styles.description}>{catalog.description}</p>
        <div className={styles.boot} aria-hidden={active}>
          <span>{state.phase === "returning" ? "Returning to the collection" : "Starting domain"}</span>
          <div className={styles.bootTrack}><span /></div>
        </div>
      </div>
      <div className={styles.toolkit} aria-hidden={!active}>
        <p className={styles.toolkitLabel}>THE TOOLKIT <span>Discover what you can work with</span></p>
        <ul className={styles.disciplines}>
          {catalog.disciplines.map(discipline => <li key={discipline.name}>
            <h3>{discipline.name}</h3>
            <div className={styles.toolNames}>{discipline.tools.map(tool => <span key={tool.name}>
              {tool.logo && <Image src={toolLogo(tool.logo)} alt="" width={24} height={24} unoptimized className={styles.toolLogo} />}
              {tool.name}
            </span>)}</div>
          </li>)}
        </ul>
      </div>
      <footer className={styles.footer}>
        <span>{failedPoster === source ? "Artwork unavailable · toolkit ready" : "ACM VIT · THE DOMAIN COLLECTION"}</span>
        <span>ESC <i /> BACK TO ROOM</span>
      </footer>
    </div>}
  </section>;
}
