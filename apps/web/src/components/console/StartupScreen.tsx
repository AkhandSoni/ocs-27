"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, UserRound } from "lucide-react";
import { moveFocus, type ControllerAction } from "@/lib/controller-input";
import type { Student } from "./useLibrary";
import AuthPanel from "./AuthPanel";
import { useExperienceInput } from "./ConsoleInput";
import BrandMark from "./BrandMark";

export default function StartupScreen({
  student,
  sessionError,
  onAuthenticate,
  onContinue,
}: {
  student: Student | null;
  sessionError: string;
  onAuthenticate: (student: Student) => void;
  onContinue: () => void;
}) {
  const [view, setView] = useState<"players" | "signin">("players");
  const screen = useRef<HTMLElement>(null);
  const input = useCallback((action: ControllerAction) => {
    if (action === "back" && view === "signin") {
      setView("players");
      return true;
    }
    if (action === "left" || action === "right" || action === "up" || action === "down") {
      if (screen.current) moveFocus(screen.current, action);
      return true;
    }
    if (action === "confirm") {
      (document.activeElement as HTMLElement | null)?.click();
      return true;
    }
    if (action === "home") {
      onContinue();
      return true;
    }
    return false;
  }, [onContinue, view]);
  useExperienceInput(input);

  useEffect(() => {
    screen.current?.querySelector<HTMLElement>(view === "players" ? ".startup-profile" : "input,button")?.focus({ preventScroll: true });
  }, [view, student]);

  return (
    <section className={`startup-screen startup-${view}`} ref={screen} aria-label="Player sign in">
      <time className="startup-time">{new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())}</time>
      {view === "players" ? (
        <div className="startup-players" key="players">
          <div className="startup-heading">
            <p>ACM-VIT · OCS ’27</p>
            <h1>{student ? "Welcome back" : "Who’s using this console?"}</h1>
            <span>{student ? "Select your player profile to continue." : "Choose a player to enter the system."}</span>
          </div>
          <div className="startup-profiles" role="group" aria-label="Choose a player">
            {student && (
              <button className="startup-profile" onClick={onContinue} aria-label={`Continue as ${student.name}`}>
                <span className="startup-avatar">{student.name.slice(0, 1).toUpperCase()}</span>
                <span>{student.name}</span>
              </button>
            )}
            <button className="startup-profile" onClick={student ? onContinue : () => setView("signin")} aria-label={student ? "Continue as guest" : "Sign in to account"}>
              <span className="startup-avatar startup-avatar-guest"><UserRound /></span>
              <span>{student ? "Guest" : "Sign in"}</span>
            </button>
            <button className="startup-profile" onClick={() => setView("signin")} aria-label="Add player">
              <span className="startup-avatar startup-avatar-add"><Plus /></span>
              <span>{student ? "Add player" : "Create account"}</span>
            </button>
          </div>
          {!student && <button className="startup-guest-link" onClick={onContinue}>Continue as guest <ArrowRight size={16} /></button>}
          <div className="startup-footer"><span>Because Technology Matters</span><BrandMark /></div>
        </div>
      ) : (
        <div className="startup-auth-content" key="signin">
          <button className="startup-back" onClick={() => setView("players")}><ArrowLeft size={18} /> Back</button>
          <div className="startup-auth-brand"><BrandMark /></div>
          <div className="startup-auth-panel">
            <AuthPanel onSuccess={onAuthenticate} onGuest={onContinue} />
          </div>
        </div>
      )}
      {sessionError && <p className="startup-error" role="status">{sessionError}</p>}
    </section>
  );
}
