"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { advanceSnake, createSnake, BOARD, type Direction } from "@/lib/snake";
import type { ConsoleLibrary } from "./useLibrary";
import { useExperienceInput } from "./ConsoleInput";
export default function ArcadeExperience({
  library,
  suspended,
}: {
  library: ConsoleLibrary;
  suspended: boolean;
}) {
  const [game, setGame] = useState(createSnake),
    [status, setStatus] = useState<"ready" | "running" | "paused" | "over">(
      "ready",
    );
  const direction = useRef<Direction>("right"),
    pointer = useRef<{ x: number; y: number } | null>(null);
  const act = (d: Direction) => {
    direction.current = d;
  };
  function start() {
    direction.current = "right";
    setGame(createSnake());
    setStatus("running");
  }
  useExperienceInput((action) => {
    if (["up", "down", "left", "right"].includes(action)) {
      act(action as Direction);
      return true;
    }
    if (action === "confirm") {
      if (status === "running") setStatus("paused");
      else if (status === "paused") setStatus("running");
      else start();
      return true;
    }
    if (action === "back" && status === "running") {
      setStatus("paused");
      return true;
    }
    return false;
  });
  useEffect(() => {
    if (status !== "running") return;
    const timer = setInterval(
      () => setGame((current) => advanceSnake(current, direction.current)),
      145,
    );
    return () => clearInterval(timer);
  }, [status]);
  useEffect(() => {
    if (game.over) {
      setStatus("over");
      if (game.score > library.data.snakeBest)
        library.update((d) => ({ ...d, snakeBest: game.score }));
    }
  }, [game.over, game.score, library]);
  useEffect(() => {
    if (suspended) setStatus((s) => (s === "running" ? "paused" : s));
  }, [suspended]);
  useEffect(() => {
    const pause = () => setStatus((s) => (s === "running" ? "paused" : s));
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", pause);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", pause);
    };
  }, []);
  return (
    <section className="native-app arcade-app" data-arcade>
      <div className="arcade-heading">
        <div>
          <p className="system-kicker">ACM ORIGINAL / SINGLE PLAYER</p>
          <h1>
            SIGNAL<span>/</span>SNAKE
          </h1>
        </div>
        <div className="arcade-score">
          <span>
            SCORE <b data-score>{String(game.score).padStart(3, "0")}</b>
          </span>
          <span>
            LOCAL BEST{" "}
            <b>
              {String(Math.max(game.score, library.data.snakeBest)).padStart(
                3,
                "0",
              )}
            </b>
          </span>
        </div>
      </div>
      <div className="arcade-layout">
        <div
          className="game-board"
          role="region"
          aria-label="Signal Snake game board"
          tabIndex={0}
          onPointerDown={(e) => {
            // Let overlay buttons receive their click; capture only board swipes.
            if ((e.target as Element).closest("button")) return;
            pointer.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            if (!pointer.current) return;
            const dx = e.clientX - pointer.current.x,
              dy = e.clientY - pointer.current.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 16)
              act(
                Math.abs(dx) > Math.abs(dy)
                  ? dx > 0
                    ? "right"
                    : "left"
                  : dy > 0
                    ? "down"
                    : "up",
              );
            pointer.current = null;
          }}
        >
          <svg
            viewBox={`0 0 ${BOARD.width * 24} ${BOARD.height * 24}`}
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="snake-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M24 0H0v24"
                  fill="none"
                  stroke="#bbcd9120"
                  strokeWidth=".7"
                />
              </pattern>
            </defs>
            <rect width="480" height="336" fill="url(#snake-grid)" />
            {game.snake.map((c, i) => (
              <rect
                key={i}
                x={c.x * 24 + 2}
                y={c.y * 24 + 2}
                width="20"
                height="20"
                rx="2"
                fill={i === 0 ? "#f0f4d9" : "#a8bd77"}
              />
            ))}
            <path
              d={`m${game.food.x * 24 + 12} ${game.food.y * 24 + 3} 9 9-9 9-9-9Z`}
              fill="#e8ba74"
            />
          </svg>
          {status !== "running" && (
            <div className="game-overlay">
              <span>
                {status === "ready"
                  ? "READY PLAYER ONE"
                  : status === "paused"
                    ? "RUN SUSPENDED"
                    : game.won
                      ? "SIGNAL COMPLETE"
                      : "CONNECTION LOST"}
              </span>
              <h2>
                {status === "ready"
                  ? "Follow the signal."
                  : status === "paused"
                    ? "Take a breath."
                    : `${game.score} points.`}
              </h2>
              <button
                className="launch-button"
                onClick={() =>
                  status === "paused" ? setStatus("running") : start()
                }
              >
                {status === "ready" ? (
                  <>
                    <Play size={17} />
                    Start run
                  </>
                ) : status === "paused" ? (
                  <>
                    <Play size={17} />
                    Resume
                  </>
                ) : (
                  <>
                    <RotateCcw size={17} />
                    Try again
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        <aside className="arcade-instructions">
          <h3>The rules are simple.</h3>
          <p>
            Collect the amber signals.
            <br />
            Avoid the walls and yourself.
            <br />
            Keep going.
          </p>
          <dl>
            <dt>↑ ↓ ← → / D-pad</dt>
            <dd>Change direction</dd>
            <dt>Enter / A</dt>
            <dd>Start, pause, resume</dd>
            <dt>Escape / B</dt>
            <dd>Pause, then return home</dd>
          </dl>
          <button
            className="quiet-button"
            onClick={() =>
              status === "running"
                ? setStatus("paused")
                : status === "paused"
                  ? setStatus("running")
                  : start()
            }
          >
            {status === "running" ? (
              <>
                <Pause size={17} />
                Pause run
              </>
            ) : (
              <>
                <Play size={17} />
                {status === "paused" ? "Resume run" : "New run"}
              </>
            )}
          </button>
          <div
            className="touch-dpad"
            role="group"
            aria-label="Snake touch controls"
          >
            {(["up", "left", "down", "right"] as Direction[]).map((d, i) => (
              <button key={d} aria-label={`Snake ${d}`} onClick={() => act(d)}>
                {["↑", "←", "↓", "→"][i]}
              </button>
            ))}
          </div>
        </aside>
      </div>
      <p className="system-note">
        Original playable prototype · high scores saved on this console · no
        network connection required after loading
      </p>
    </section>
  );
}
