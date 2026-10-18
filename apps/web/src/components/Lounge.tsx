"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ConsoleExperience from "./ConsoleExperience";
import GameScreen from "./GameScreen";
import type { RoomController } from "@/lib/create-room";

type Player = { id: string; name: string; email: string; avatar: string };

export default function Lounge() {
  const stage = useRef<HTMLDivElement>(null);
  const controller = useRef<RoomController | null>(null);
  const [screenHost, setScreenHost] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);

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
      <div className="room-stage" ref={stage} />
      {!ready && !error && <div className="room-loading" role="status" aria-label="Loading the gaming room"><span /></div>}
      {error && <div className="graphics-error" role="alert"><p>{error}</p><button onClick={() => window.location.reload()}>Retry</button></div>}
      {screenHost && createPortal(
        <ConsoleExperience ready={ready} onHome={handleHome} onUserChange={handleUser}>
          <GameScreen player={player} onGameChange={handleGameChange} />
        </ConsoleExperience>, screenHost,
      )}
    </main>
  );
}
