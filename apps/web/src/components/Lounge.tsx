"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor } from "lucide-react";
import ConsoleShell from "./console/ConsoleShell";
import ControllerControls from "./ControllerControls";
import StaticScreen from "./console/StaticScreen";
import type { RoomController } from "@/lib/create-room";
export default function Lounge() {
  const stage = useRef<HTMLDivElement>(null),
    controller = useRef<RoomController | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [flat, setFlat] = useState(false),
    [focused, setFocused] = useState(true),
    [powered, setPowered] = useState(true),
    [startupInProgress, setStartupInProgress] = useState(true);
  useEffect(() => {
    const media = matchMedia("(max-width:680px)");
    const change = () => setFlat(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (flat) return;
    let cancelled = false,
      created: RoomController | undefined;
    setReady(false);
    setError("");
    const screen = document.createElement("div");
    screen.className = "tv-screen-host";
    setHost(screen);
    void import("@/lib/create-room")
      .then(async ({ createRoom }) => {
        if (cancelled || !stage.current) return;
        created = await createRoom(stage.current, screen, {
          onReady(mode) {
            if (!cancelled) {
              setReady(true);
              stage.current?.setAttribute("data-renderer", mode);
            }
          },
          onError(message) {
            if (!cancelled) setError(message);
          },
          onAssetError(message) {
            console.warn(message);
          },
          onConsolePower() {
            setPowered((value) => !value);
          },
        });
        if (cancelled) created.dispose();
        else {
          controller.current = created;
          created.setFocus(true);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Graphics could not start.",
          );
      });
    return () => {
      cancelled = true;
      created?.dispose();
      controller.current = null;
    };
  }, [flat]);
  const accent = useCallback(
    (color: string) => controller.current?.setAccent(color),
    [],
  );
  const powerOff = useCallback(() => {
    setStartupInProgress(true);
    setPowered(false);
  }, []);
  const toggleRoom = useCallback(
    () =>
      setFocused((current) => {
        controller.current?.setFocus(!current);
        return !current;
      }),
    [],
  );
  useEffect(() => {
    if (focused)
      stage.current
        ?.querySelector<HTMLElement>(".ocs-console")
        ?.focus({ preventScroll: true });
  }, [focused]);
  return (
    <main
      className={`console-room ${ready ? "is-ready" : ""} ${flat ? "flat-mode" : ""}`}
      aria-label="ACM VIT gaming console environment"
    >
      <div className="room-stage" ref={stage} />
      {!flat && !ready && !error && (
        <div className="room-loading" role="status">
          <span />
          <p>Initializing console graphics</p>
        </div>
      )}
      {!flat && error && (
        <div className="graphics-error" role="alert">
          <p>{error}</p>
          <button onClick={() => location.reload()}>Retry graphics</button>
          <button onClick={() => setFlat(true)}>
            Open console without 3D room
          </button>
        </div>
      )}
      {!flat &&
        host &&
        createPortal(
          powered ? (
            <ConsoleShell
              ready={ready}
              onAccent={accent}
              onRoom={toggleRoom}
              onPowerOff={powerOff}
              onStartupChange={setStartupInProgress}
              startAtStartup={startupInProgress}
            />
          ) : (
            <StaticScreen onPower={() => setPowered(true)} />
          ),
          host,
        )}
      {flat && (
        <div className="flat-console">
          {powered ? (
            <ConsoleShell
              ready
              onAccent={accent}
              onRoom={() => setFlat(false)}
              onPowerOff={powerOff}
              onStartupChange={setStartupInProgress}
              startAtStartup={startupInProgress}
            />
          ) : (
            <StaticScreen onPower={() => setPowered(true)} />
          )}
        </div>
      )}
      {powered && <ControllerControls visible={!startupInProgress} />}
      {!flat && ready && (
        <button className="room-view-toggle" onClick={toggleRoom}>
          <Monitor size={15} />
          {focused ? "Room view" : "Focus console"}
        </button>
      )}
    </main>
  );
}
