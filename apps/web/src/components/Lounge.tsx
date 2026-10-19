"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ConsoleExperience from "./ConsoleExperience";
import GameScreen from "./GameScreen";
import DomainScreen, { DOMAIN_STATUS, DomainMobileToolkit } from "./DomainScreen";
import { IDLE_DOMAIN_STATE, type DomainState } from "@/lib/domain-sequence";
import type { RoomController } from "@/lib/create-room";
import { COLLECTION_POSTER } from "@/lib/domain-catalog";

type Player = { id: string; name: string; email: string; avatar: string };

export default function Lounge() {
  const stage = useRef<HTMLDivElement>(null);
  const controller = useRef<RoomController | null>(null);
  const [screenHost, setScreenHost] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [domainState, setDomainState] = useState<DomainState>(IDLE_DOMAIN_STATE);
  const exitButton = useRef<HTMLButtonElement>(null);
  const wasInLibrary = useRef(false);
  const inLibrary = domainState.phase !== "idle";

  useEffect(() => {
    if (domainState.phase === "choosing") controller.current?.focusDomainCase();
    else if (domainState.phase === "presenting" || domainState.phase === "opening") exitButton.current?.focus({ preventScroll: true });
    else if (domainState.phase === "idle" && wasInLibrary.current) controller.current?.focusDiscShelf();
    wasInLibrary.current = inLibrary;
  }, [domainState.phase, inLibrary]);

  useEffect(() => {
    let cancelled = false;
    let created: RoomController | undefined;
    const host = document.createElement("div");
    host.className = "tv-screen-host";
    setScreenHost(host);
    void import("@/lib/create-room").then(async ({ createRoom }) => {
      if (cancelled || !stage.current) return;
      created = await createRoom(stage.current, host, {
        onReady(mode) {
          if (!cancelled) {
            setReady(true);
            stage.current?.setAttribute("data-renderer", mode);
          }
        },
        onError(message) { if (!cancelled) setError(message); },
        onAssetError(message) { console.warn(message); },
        onDomainState(state) { if (!cancelled) setDomainState(state); },
      });
      if (cancelled) created.dispose();
      else { controller.current = created; created.setFocus(true); }
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Graphics could not start.");
    });
    return () => { cancelled = true; created?.dispose(); controller.current = null; };
  }, []);

  const handleGameChange = useCallback((color: string) => { controller.current?.setAccent(color); }, []);
  const handleHome = useCallback(() => {
    controller.current?.setFocus(true);
  }, []);
  const handleUser = useCallback((user: Player | null) => { setPlayer(user); }, []);

  return (
    <main className={`console-room ${ready ? "is-ready" : ""}`} aria-label="PlayStation gaming room">
      <link rel="preload" as="image" href={COLLECTION_POSTER} type="image/svg+xml" />
      <div className="room-stage" ref={stage} />
      {inLibrary && <div className="domain-transport">
        <span className="domain-live-status" role="status" aria-live="polite">{DOMAIN_STATUS[domainState.phase]}</span>
        <button ref={exitButton} onClick={() => controller.current?.exitDomain()} disabled={domainState.phase === "returning"}>
          <span aria-hidden="true">←</span> {domainState.phase === "returning" ? "Returning…" : domainState.phase === "active" ? "Back to room" : "Back"}
          <kbd>Esc</kbd>
        </button>
      </div>}
      {domainState.phase === "active" && domainState.selected !== null && <DomainMobileToolkit selected={domainState.selected} />}
      {!ready && !error && <div className="room-loading" role="status" aria-label="Loading the gaming room"><span /></div>}
      {error && <div className="graphics-error" role="alert"><p>{error}</p><button onClick={() => window.location.reload()}>Retry</button></div>}
      {screenHost && createPortal(
        <>
          <div className="base-console-screen" inert={inLibrary} aria-hidden={inLibrary || undefined} style={{ visibility: inLibrary ? "hidden" : "visible" }}>
            <ConsoleExperience ready={ready} suspended={inLibrary} onHome={handleHome} onUserChange={handleUser}>
              <GameScreen player={player} suspended={inLibrary} onGameChange={handleGameChange} />
            </ConsoleExperience>
          </div>
          {inLibrary && <DomainScreen state={domainState} />}
        </>, screenHost,
      )}
    </main>
  );
}
