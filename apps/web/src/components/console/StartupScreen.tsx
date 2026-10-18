"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import type { Student } from "./useLibrary";
import AuthPanel from "./AuthPanel";

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
  const screen = useRef<HTMLElement>(null);
  useEffect(() => {
    screen.current
      ?.querySelector<HTMLElement>("input,button")
      ?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      className="startup-screen"
      ref={screen}
      aria-label="Player sign in"
    >
      <div className="startup-card">
        <p className="system-kicker">ACM-VIT / OCS SYSTEM 27</p>
        {student ? (
          <div className="startup-player">
            <div className="startup-player-icon">
              <UserRound size={26} />
            </div>
            <h1>Welcome back, {student.name}.</h1>
            <p>Your player profile is ready.</p>
            <button className="launch-button" onClick={onContinue}>
              Continue to console <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <AuthPanel onSuccess={onAuthenticate} onGuest={onContinue} />
        )}
        {sessionError && (
          <p className="startup-error" role="status">
            {sessionError}
          </p>
        )}
      </div>
    </section>
  );
}
