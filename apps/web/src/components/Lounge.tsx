"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor } from "lucide-react";
import ConsoleShell from "./console/ConsoleShell";
import ControllerControls from "./ControllerControls";
import StaticScreen from "./console/StaticScreen";
import DomainTransportScreen from "./console/DomainTransportScreen";
import { DOMAINS, IDLE_DOMAIN_STATE, type DomainState } from "@/lib/domain-sequence";
import type { DomainId } from "@/lib/recruitment";
import "./room-interactions.css";
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
  const [domainState, setDomainState] = useState<DomainState>(IDLE_DOMAIN_STATE);
  const [launchRequest, setLaunchRequest] = useState<{ id: DomainId | null; sequence: number }>();
  const [actionError, setActionError] = useState("");
  const transport = !["idle", "active"].includes(domainState.phase);
  const previousPhase = useRef("idle");
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
    setDomainState(IDLE_DOMAIN_STATE);
    previousPhase.current = "idle";
    setLaunchRequest(undefined);
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
          onDomainState(state) { if (!cancelled) setDomainState(state); },
          onConsolePower() {
            if (cancelled) return;
            setStartupInProgress(true);
            setPowered((value) => !value);
          },
        });
        if (cancelled) created.dispose();
        else {
          controller.current = created;
          created.setFocus(true);
          setFocused(true);
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
  useEffect(() => {
    controller.current?.setInteractive(powered && !startupInProgress);
  }, [powered, startupInProgress, ready]);
  useEffect(() => {
    const before = previousPhase.current;
    previousPhase.current = domainState.phase;
    if (domainState.phase === "active" && domainState.selected !== null) {
      const id = DOMAINS[domainState.selected].id;
      setLaunchRequest({ id: id === "competitive-coding" ? "cc" : id, sequence: Date.now() });

    } else if (domainState.phase === "choosing") {
      controller.current?.focusDomainCase();
    } else if (domainState.phase === "idle" && before !== "idle") {
      setLaunchRequest({ id: null, sequence: Date.now() });
    }
  }, [domainState]);
  const accent = useCallback(
    (color: string) => controller.current?.setAccent(color),
    [],
  );
  const launchDomain = useCallback((id: DomainId) => {
    const index = DOMAINS.findIndex(domain => domain.id === (id === "cc" ? "competitive-coding" : id));
    if (!controller.current?.launchDomain(index)) setActionError("Disc drive is still loading. Try again in a moment.");
    else setActionError("");
    return true;
  }, []);
  const powerOff = useCallback(() => {
    setStartupInProgress(true);
    setPowered(false);
  }, []);
  const powerOn = useCallback(() => {
    setStartupInProgress(true);
    setPowered(true);
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
      className={`console-room ${focused ? "focus-mode" : "room-mode"} ${ready ? "is-ready" : ""} ${flat ? "flat-mode" : ""}`}
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
            <>
            <div className="base-console-screen" hidden={transport} inert={transport}>
            <ConsoleShell
              onLaunchDomain={launchDomain}
              suspended={transport}
              launchRequest={launchRequest}
              ready={ready}
              onAccent={accent}
              onRoom={toggleRoom}
              onPowerOff={powerOff}
              onStartupChange={setStartupInProgress}
              startAtStartup={startupInProgress}
            />
            </div>
            {transport && <DomainTransportScreen state={domainState} />}
            </>
          ) : (
            <StaticScreen onPower={powerOn} />
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
            <StaticScreen onPower={powerOn} />
          )}
        </div>
      )}
      {actionError && <p className="room-action-error" role="status">{actionError}</p>}
      {powered && <ControllerControls visible={!startupInProgress} />}
      {!flat && ready && (
        <div className="room-actions">
        <button className="room-view-toggle" onClick={toggleRoom} disabled={transport}>
          <Monitor size={15} />
          {focused ? "Room view" : "Focus console"}
        </button>
        {powered && !startupInProgress && ["idle", "active"].includes(domainState.phase) && <button onClick={() => {
          if (!controller.current?.openDomainLibrary()) setActionError("Disc drive is still loading. Try again in a moment.");
          else setActionError("");
        }}>Domain discs</button>}
        {powered && domainState.phase !== "idle" && <button onClick={() => controller.current?.exitDomain()}>{domainState.phase === "active" ? "Eject disc" : "Cancel disc"}</button>}
        </div>
      )}
    </main>
  );
}
