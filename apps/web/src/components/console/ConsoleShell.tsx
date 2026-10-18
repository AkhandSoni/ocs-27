"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CircleHelp, Home, Settings, UserRound } from "lucide-react";
import { moveFocus, type ControllerAction } from "@/lib/controller-input";
import type { DomainId } from "@/lib/recruitment";
import { experienceOrder, experiences, type ExperienceId } from "./content";
import { ConsoleInput, type InputHandler } from "./ConsoleInput";
import { useLibrary, mergeGuest, type Student } from "./useLibrary";
import BootScreen from "./BootScreen";
import ConsoleHome from "./ConsoleHome";
import BrandMark from "./BrandMark";
import DomainExperience from "./DomainExperience";
import ApplicationExperience from "./ApplicationExperience";
import ShowcaseExperience from "./ShowcaseExperience";
import ArcadeExperience from "./ArcadeExperience";
import StudentExperience from "./StudentExperience";
import SystemPanel from "./SystemPanel";
import StartupScreen from "./StartupScreen";
import { gameIdentities, isDomain } from "./game-identities";
import "./console.css";
import "./game-art.css";

type Route =
  | { screen: "home" }
  | { screen: "domain" | "apply"; id: DomainId }
  | { screen: "showcase" | "arcade" | "applications" };
export default function ConsoleShell({
  ready,
  onAccent,
  onRoom,
  onPowerOff,
  onStartupChange,
}: {
  ready: boolean;
  onAccent: (color: string) => void;
  onRoom: () => void;
  onPowerOff: () => void;
  onStartupChange: (active: boolean) => void;
}) {
  const [route, setRoute] = useState<Route>({ screen: "home" }),
    [selected, setSelected] = useState<ExperienceId>("tech");
  const [panel, setPanel] = useState<"auth" | "system" | "help" | null>(null),
    [boot, setBoot] = useState(true),
    [startup, setStartup] = useState(true),
    [sessionChecked, setSessionChecked] = useState(false),
    [student, setStudent] = useState<Student | null>(null),
    [time, setTime] = useState(""),
    [sessionError, setSessionError] = useState("");
  const root = useRef<HTMLDivElement>(null),
    childInput = useRef<InputHandler | null>(null);
  const library = useLibrary(student);
  const selectionColor = isDomain(selected)
    ? gameIdentities[selected].accent
    : experiences[selected].color;
  const register = useCallback((handler: InputHandler) => {
    childInput.current = handler;
    return () => {
      if (childInput.current === handler) childInput.current = null;
    };
  }, []);
  const inputContext = useMemo(() => ({ register }), [register]);
  const completeBoot = useCallback(() => {
    setBoot(false);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            "Account service unavailable. You can still explore as a guest.",
          );
        const d = await r.json();
        if (!abort.signal.aborted) {
          if (d.user) mergeGuest(d.user);
          setStudent(d.user);
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) setSessionError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setSessionChecked(true);
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    onAccent(selectionColor);
  }, [selectionColor, onAccent]);
  useEffect(() => {
    if (!boot && !startup) root.current?.focus({ preventScroll: true });
  }, [route, boot, startup]);
  useEffect(() => {
    onStartupChange(boot || startup);
  }, [boot, startup, onStartupChange]);
  function launch(id: ExperienceId = selected) {
    setSelected(id);
    if (["showcase", "arcade", "applications"].includes(id))
      setRoute({ screen: id as "showcase" | "arcade" | "applications" });
    else setRoute({ screen: "domain", id: id as DomainId });
  }
  function home() {
    setPanel(null);
    setRoute({ screen: "home" });
    root.current?.focus({ preventScroll: true });
  }
  function back() {
    if (panel) {
      setPanel(null);
      return;
    }
    if (route.screen === "apply") {
      setRoute({ screen: "domain", id: route.id });
      return;
    }
    if (route.screen === "home") {
      setPanel("system");
      return;
    }
    home();
  }
  useEffect(() => {
    function control(e: Event) {
      const action = (e as CustomEvent<ControllerAction>).detail;
      if (boot || startup) return;
      if (action === "help" || action === "system") {
        setPanel((current) =>
          current ? null : action === "help" ? "help" : "system",
        );
        return;
      }
      if (action === "controller") {
        window.dispatchEvent(new Event("ocs:show-controller"));
        return;
      }
      if (action === "home") {
        home();
        return;
      }
      if (panel) {
        if (action === "back") {
          setPanel(null);
          return;
        }
        const dialog =
          root.current?.querySelector<HTMLElement>('[role="dialog"]');
        if (!dialog) return;
        const active = document.activeElement as HTMLElement | null;
        if (
          action === "confirm" &&
          active &&
          dialog.contains(active) &&
          active.matches("button,a")
        )
          active.click();
        else moveFocus(dialog, action);
        return;
      }
      if (childInput.current?.(action)) return;
      if (action === "back") {
        back();
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      const chrome =
        root.current?.querySelector<HTMLElement>(".console-chrome");
      if (route.screen === "home" && (action === "up" || action === "down")) {
        if (action === "up")
          chrome?.querySelector<HTMLElement>("nav button.active")?.focus();
        else if (active && chrome?.contains(active)) root.current?.focus();
        else
          root.current?.querySelector<HTMLElement>(".launch-button")?.focus();
        return;
      }
      if (
        route.screen === "home" &&
        (action === "left" || action === "right")
      ) {
        if (active && chrome?.contains(active)) {
          moveFocus(chrome, action);
          return;
        }
        setSelected(
          (id) =>
            experienceOrder[
              (experienceOrder.indexOf(id) +
                (action === "right" ? 1 : -1) +
                experienceOrder.length) %
                experienceOrder.length
            ],
        );
        root.current?.focus({ preventScroll: true });
        return;
      }
      if (action === "confirm") {
        const active = document.activeElement as HTMLElement | null;
        if (
          active &&
          root.current?.contains(active) &&
          active.matches("button,a")
        )
          active.click();
        else if (route.screen === "home") launch();
        else
          root.current
            ?.querySelector<HTMLButtonElement>(".launch-button")
            ?.click();
        return;
      }
      if (root.current) moveFocus(root.current, action);
    }
    window.addEventListener("ocs:controller-action", control);
    return () => window.removeEventListener("ocs:controller-action", control);
  }, [route, selected, panel, boot, startup]);
  function authenticated(user: Student) {
    mergeGuest(user);
    setStudent(user);
    setStartup(false);
    setPanel(null);
    setSessionError("");
  }
  async function logout() {
    const r = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!r.ok) throw new Error("Could not sign out. Please try again.");
    setStudent(null);
    home();
  }
  const app =
    route.screen === "domain" || route.screen === "apply"
      ? library.data.applications[route.id]
      : null;
  return (
    <ConsoleInput.Provider value={inputContext}>
      <div
        className={`ocs-console ${route.screen === "home" ? "at-home" : "in-app"} ${route.screen === "apply" ? "is-writing" : ""} experience-${selected}`}
        ref={root}
        tabIndex={-1}
        data-console-screen={route.screen}
        style={{ "--selection": selectionColor } as React.CSSProperties}
        aria-label="ACM VIT OCS gaming console"
      >
        {boot ? (
          <>
            {ready ? (
              <BootScreen onComplete={completeBoot} />
            ) : (
              <div className="console-wait">Starting console renderer…</div>
            )}
          </>
        ) : (
          <>
            <div
              className="console-surface"
              inert={panel !== null || startup}
              aria-hidden={panel !== null || startup ? true : undefined}
            >
              <header className="console-chrome">
                <button
                  className="console-wordmark"
                  aria-label="Console home"
                  onClick={home}
                >
                  <BrandMark />
                </button>
                {route.screen === "home" ? (
                  <nav aria-label="Console channels">
                    <button
                      className={
                        selected !== "arcade" && selected !== "showcase"
                          ? "active"
                          : ""
                      }
                      onClick={() => setSelected("tech")}
                    >
                      Experiences
                    </button>
                    <button
                      className={selected === "showcase" ? "active" : ""}
                      onClick={() => {
                        setSelected("showcase");
                        launch("showcase");
                      }}
                    >
                      Collection
                    </button>
                    <button
                      className={selected === "arcade" ? "active" : ""}
                      onClick={() => {
                        setSelected("arcade");
                        launch("arcade");
                      }}
                    >
                      Arcade
                    </button>
                  </nav>
                ) : (
                  <div className="app-location">
                    {route.screen === "apply"
                      ? "APPLICATION / ROUND 00"
                      : route.screen === "domain"
                        ? "RECRUITMENT"
                        : route.screen === "applications"
                          ? "PLAYER LIBRARY"
                          : route.screen.toUpperCase()}
                  </div>
                )}
                <div className="system-tray">
                  <button
                    aria-label="Open console help"
                    onClick={() => setPanel("help")}
                  >
                    <CircleHelp size={23} />
                  </button>
                  <button
                    aria-label="Open control center"
                    onClick={() => setPanel("system")}
                  >
                    <Settings size={23} />
                  </button>
                  <button
                    className="player-orb"
                    aria-label="Open player profile"
                    onClick={() =>
                      student ? launch("applications") : setPanel("auth")
                    }
                  >
                    {student ? (
                      student.name[0].toUpperCase()
                    ) : (
                      <UserRound size={23} />
                    )}
                  </button>
                  <time>{time}</time>
                </div>
              </header>
              <main
                className="console-viewport"
                key={
                  route.screen +
                  (route.screen === "domain" || route.screen === "apply"
                    ? route.id
                    : "")
                }
              >
                {route.screen === "home" && (
                  <ConsoleHome
                    selected={selected}
                    onSelect={setSelected}
                    onLaunch={launch}
                    submitted={Object.keys(library.data.applications).filter(
                      (id) =>
                        library.data.applications[id as DomainId]?.submittedAt,
                    )}
                  />
                )}
                {route.screen === "domain" && (
                  <DomainExperience
                    id={route.id}
                    submitted={!!app?.submittedAt}
                    onApply={() => setRoute({ screen: "apply", id: route.id })}
                    onShowcase={() => launch("showcase")}
                  />
                )}
                {route.screen === "apply" && (
                  <ApplicationExperience
                    id={route.id}
                    student={student}
                    library={library}
                    onAuthenticate={() => setPanel("auth")}
                    onBack={() => setRoute({ screen: "domain", id: route.id })}
                  />
                )}
                {route.screen === "showcase" && <ShowcaseExperience />}
                {route.screen === "arcade" && (
                  <ArcadeExperience
                    library={library}
                    suspended={panel !== null}
                  />
                )}
                {route.screen === "applications" &&
                  (library.ready ? (
                    <StudentExperience
                      student={student}
                      library={library}
                      onOpen={(id) => {
                        setSelected(id);
                        setRoute(
                          library.data.applications[id]
                            ? { screen: "apply", id }
                            : { screen: "domain", id },
                        );
                      }}
                      onAuthenticate={() => setPanel("auth")}
                    />
                  ) : (
                    <div className="console-wait">Opening player library…</div>
                  ))}
              </main>
              <footer className="console-statusbar">
                <div>
                  {route.screen !== "home" && (
                    <button onClick={back}>
                      <span className="key-symbol">○</span>Back
                    </button>
                  )}
                  <span>
                    <span className="key-symbol">↔</span>Navigate
                  </span>
                  <span>
                    <span className="key-symbol">×</span>
                    {route.screen === "arcade" ? "Start / pause" : "Select"}
                  </span>
                  <button onClick={home}>
                    <Home size={16} />
                    Home
                  </button>
                </div>
                <span>
                  OCS ’27 <i /> {student ? "LOCAL PLAYER" : "GUEST SESSION"}{" "}
                  <i /> PROTOTYPE
                </span>
              </footer>
            </div>
            {sessionError && (
              <button
                className="session-warning"
                onClick={() => {
                  setSessionError("");
                  setPanel("auth");
                }}
              >
                {sessionError}
              </button>
            )}
            {panel && (
              <SystemPanel
                kind={panel}
                student={student}
                library={library}
                onClose={() => setPanel(null)}
                onAuthenticate={authenticated}
                onSignIn={() => setPanel("auth")}
                onReset={home}
                onLogout={logout}
                onRestart={() => {
                  setPanel(null);
                  setRoute({ screen: "home" });
                  setStartup(true);
                  setBoot(true);
                }}
                onRoom={() => {
                  onRoom();
                  setPanel(null);
                }}
                onPowerOff={onPowerOff}
              />
            )}
            {startup &&
              (sessionChecked ? (
                <StartupScreen
                  student={student}
                  sessionError={sessionError}
                  onAuthenticate={authenticated}
                  onContinue={() => setStartup(false)}
                />
              ) : (
                <div className="startup-loading" role="status">
                  Checking player profile…
                </div>
              ))}
          </>
        )}
      </div>
    </ConsoleInput.Provider>
  );
}
