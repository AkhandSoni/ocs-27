"use client";
import { useEffect, useRef, useState } from "react";
import {
  X,
  LogOut,
  RotateCcw,
  Power,
  UserRound,
  Gamepad2,
  Monitor,
} from "lucide-react";
import AuthPanel from "./AuthPanel";
import type { Student, ConsoleLibrary } from "./useLibrary";
export default function SystemPanel({
  kind,
  student,
  library,
  onClose,
  onAuthenticate,
  onLogout,
  onRestart,
  onRoom,
  onPowerOff,
  onSignIn,
  onReset,
}: {
  kind: "system" | "auth" | "help";
  student: Student | null;
  library: ConsoleLibrary;
  onClose: () => void;
  onAuthenticate: (s: Student) => void;
  onLogout: () => Promise<void>;
  onRestart: () => void;
  onRoom: () => void;
  onPowerOff: () => void;
  onSignIn: () => void;
  onReset: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [reset, setReset] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const initial =
      panel?.querySelector<HTMLElement>("input") ??
      panel?.querySelector<HTMLElement>(
        'button:not([aria-label="Close system menu"])',
      );
    initial?.focus({ preventScroll: true });
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href],input:not(:disabled),select,textarea",
        ),
      ).filter((n) => n.getClientRects().length);
      const i = nodes.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        nodes.at(-1)?.focus();
      } else if (!e.shiftKey && (i === -1 || i === nodes.length - 1)) {
        e.preventDefault();
        nodes[0]?.focus();
      }
    }
    document.addEventListener("keydown", trap, true);
    return () => {
      document.removeEventListener("keydown", trap, true);
      if (previous?.isConnected && !previous.closest("[inert]"))
        previous.focus({ preventScroll: true });
    };
  }, [kind]);
  return (
    <div className="system-backdrop" onClick={onClose}>
      <section
        className="system-panel"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={
          kind === "auth"
            ? "Player sign in"
            : kind === "help"
              ? "Console help"
              : "Control center"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="system-close"
          aria-label="Close system menu"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        {kind === "auth" ? (
          <AuthPanel onSuccess={onAuthenticate} />
        ) : kind === "help" ? (
          <>
            <p className="system-kicker">SYSTEM MANUAL</p>
            <h2>Take control.</h2>
            <dl className="control-manual">
              <dt>Arrows / D-pad</dt>
              <dd>
                Select an experience. Left/right changes domain tabs and
                collection entries.
              </dd>
              <dt>Enter / A</dt>
              <dd>Open the selection or activate the focused control.</dd>
              <dt>Escape / Backspace / B</dt>
              <dd>Return one state. Text fields keep native editing.</dd>
              <dt>Home / Start</dt>
              <dd>Return to console home.</dd>
              <dt>Mouse / touch / Tab</dt>
              <dd>Every action remains a native, accessible control.</dd>
            </dl>
            <h3>OCS in this prototype</h3>
            <p>
              Five domains. Apply to any or all. Round 0 is a sample
              application; Round 1 is an interview. Drafts and submissions stay
              in this browser. Live review, interview scheduling and recruitment
              decisions are not connected.
            </p>
            <p>No verification email is required for local console accounts.</p>
          </>
        ) : (
          <>
            <p className="system-kicker">ACM-VIT / OCS SYSTEM 27</p>
            <h2>Control center.</h2>
            <p className="player-label">
              <UserRound size={22} />
              {student?.name ?? "Guest player"}
            </p>
            <div className="system-options">
              {!student && (
                <button onClick={onSignIn}>
                  <UserRound size={20} />
                  Sign in / create profile
                </button>
              )}
              <button onClick={onRoom}>
                <Monitor size={20} />
                Switch room / focused view
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event("ocs:show-controller"));
                  onClose();
                }}
              >
                <Gamepad2 size={20} />
                Show controller
              </button>
              <button onClick={onRestart}>
                <RotateCcw size={20} />
                Restart console
              </button>
              <button onClick={onPowerOff}>
                <Power size={20} />
                Turn off console
              </button>
              <button onClick={() => setReset(true)}>
                <RotateCcw size={20} />
                Reset local progress
              </button>
              {student && (
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onLogout();
                      onClose();
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Could not sign out.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <LogOut size={20} />
                  {busy ? "Signing out…" : "Log out"}
                </button>
              )}
            </div>
            {reset && (
              <div className="reset-confirm">
                <h3>Clear local progress?</h3>
                <p>
                  This clears this player’s browser-local applications and
                  arcade high score. The account stays intact.
                </p>
                <button
                  className="quiet-button"
                  onClick={() => setReset(false)}
                >
                  Keep progress
                </button>
                <button
                  className="launch-button"
                  onClick={() => {
                    if (library.reset()) {
                      setReset(false);
                      onReset();
                    } else setError("Could not reset storage. Try again.");
                  }}
                >
                  Clear local progress
                </button>
              </div>
            )}
            <p className="form-error" role="alert">
              {error}
            </p>
            <small>
              WebGPU primary renderer · automatic WebGL 2 fallback
              <br />
              Local prototype / no live recruitment service
            </small>
          </>
        )}
      </section>
    </div>
  );
}
