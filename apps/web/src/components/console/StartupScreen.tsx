"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Gamepad2, Menu, Plus, Power } from "lucide-react";
import { moveFocus, type ControllerAction } from "@/lib/controller-input";
import type { Student } from "./useLibrary";
import AuthPanel from "./AuthPanel";
import { useExperienceInput } from "./ConsoleInput";
import BrandMark from "./BrandMark";
import BrandSymbol from "./BrandSymbol";
import { STARTUP_EXIT_MS } from "./startup-timeline";

export default function StartupScreen({
  student,
  sessionError,
  onAuthenticate,
  onContinue,
  onPowerOff,
}: {
  student: Student | null;
  sessionError: string;
  onAuthenticate: (student: Student) => void;
  onContinue: () => void;
  onPowerOff: () => void;
}) {
  const [view, setView] = useState<"players" | "signin">("players");
  const [departing, setDeparting] = useState(false);
  const screen = useRef<HTMLElement>(null);
  const exitTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (exitTimer.current !== null) clearTimeout(exitTimer.current);
  }, []);

  function enterConsole(complete = onContinue) {
    if (exitTimer.current !== null) return;
    setDeparting(true);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    exitTimer.current = window.setTimeout(complete, reduced ? 0 : STARTUP_EXIT_MS);
  }

  const input = useCallback((action: ControllerAction) => {
    if (departing) return true;
    if (action === "back" && view === "signin") {
      setView("players");
      return true;
    }
    if (["left", "right", "up", "down"].includes(action)) {
      if (screen.current) moveFocus(screen.current, action);
      return true;
    }
    if (action === "confirm") {
      (document.activeElement as HTMLElement | null)?.click();
      return true;
    }
    if (action === "home") {
      setView("players");
      return true;
    }
    return false;
  }, [departing, view]);
  useExperienceInput(input);

  useEffect(() => {
    const target = view === "players"
      ? screen.current?.querySelector<HTMLElement>(".startup-profile-primary")
      : screen.current?.querySelector<HTMLElement>("input");
    target?.focus({ preventScroll: true });
  }, [view, student]);

  return (
    <section
      className={`startup-screen startup-${view} ${departing ? "startup-departing" : ""}`}
      ref={screen}
      aria-label="Player sign in"
      aria-busy={departing}
      inert={departing}
    >
      <time className="startup-time">
        {new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())}
      </time>
      {view === "players" ? (
        <div className="startup-players" key="players">
          <div className="startup-heading">
            <h1>Welcome Back to ACM-VIT</h1>
            <p>Who’s using this controller?</p>
          </div>
          <div className="startup-profiles" role="group" aria-label="Choose a player">
            <button className="startup-profile startup-profile-add" onClick={() => setView("signin")} aria-label="Add user">
              <span className="startup-controller-indicator"><small>1</small><Gamepad2 /></span>
              <span className="startup-avatar startup-avatar-add"><Plus /></span>
              <span>Add User</span>
            </button>
            <button
              className="startup-profile startup-profile-primary"
              onClick={() => enterConsole()}
              aria-label={student ? "Continue to console" : "Continue as guest"}
            >
              <span className="startup-controller-indicator"><small>1</small><Gamepad2 /></span>
              <span className="startup-avatar startup-avatar-guest">
                {student ? student.name.slice(0, 1).toUpperCase() : <BrandSymbol />}
              </span>
              <span>{student?.name ?? "Guest"}</span>
            </button>
            <button className="startup-account-options" onClick={() => setView("signin")}>
              <Menu size={18} /> {student ? "Switch user" : "Sign in"}
            </button>
          </div>
          <div className="startup-footer">
            <BrandMark />
            <button className="startup-power" onClick={onPowerOff} aria-label="Turn off console"><Power size={27} /></button>
            <span className="startup-select-hint"><span>×</span> Select</span>
          </div>
        </div>
      ) : (
        <div className="startup-auth-content" key="signin">
          <button className="startup-back" onClick={() => setView("players")}><ArrowLeft size={18} /> Back</button>
          <div className="startup-auth-brand"><BrandMark /></div>
          <div className="startup-auth-panel">
            <AuthPanel
              onSuccess={(user) => enterConsole(() => onAuthenticate(user))}
              onGuest={() => enterConsole()}
            />
          </div>
        </div>
      )}
      {sessionError && <p className="startup-error" role="status">{sessionError}</p>}
    </section>
  );
}
