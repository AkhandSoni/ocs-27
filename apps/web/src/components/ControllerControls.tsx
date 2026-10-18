"use client";
import { useEffect, useState } from "react";
import { Gamepad2, X } from "lucide-react";
import {
  controllerAction,
  controllerFeedback,
  controllerKeys,
  isEditing,
  type ControllerAction,
} from "@/lib/controller-input";
const controls: { action: ControllerAction; symbol: string; label: string }[] =
  [
    { action: "up", symbol: "↑", label: "Move up" },
    { action: "left", symbol: "←", label: "Move left" },
    { action: "right", symbol: "→", label: "Move right" },
    { action: "down", symbol: "↓", label: "Move down" },
    { action: "home", symbol: "⌂", label: "Console home" },
    { action: "back", symbol: "○", label: "Back" },
    { action: "confirm", symbol: "×", label: "Confirm" },
  ];
export default function ControllerControls() {
  const [open, setOpen] = useState(false),
    [pressed, setPressed] = useState<
      Partial<Record<ControllerAction, boolean>>
    >({});
  useEffect(() => {
    const held = new Set<ControllerAction>();
    function down(event: KeyboardEvent) {
      const action = controllerKeys[event.key];
      if (!action || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditing(event.target) && event.key !== "Escape") return;
      held.add(action);
      controllerFeedback(action, true);
      if (event.repeat && !["left", "right", "up", "down"].includes(action))
        return;
      if (
        action === "confirm" &&
        event.target instanceof HTMLElement &&
        event.target.closest("button,a")
      )
        return;
      event.preventDefault();
      controllerAction(action);
    }
    function up(event: KeyboardEvent) {
      const action = controllerKeys[event.key];
      if (action) {
        held.delete(action);
        controllerFeedback(action, false);
      }
    }
    function release() {
      held.forEach((action) => controllerFeedback(action, false));
      held.clear();
      setPressed({});
    }
    function feedback(event: Event) {
      const { action, pressed: active } = (
        event as CustomEvent<{ action: ControllerAction; pressed: boolean }>
      ).detail;
      setPressed((current) => ({ ...current, [action]: active }));
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    window.addEventListener("ocs:controller-feedback", feedback);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
      window.removeEventListener("ocs:controller-feedback", feedback);
      held.forEach((action) => controllerFeedback(action, false));
    };
  }, []);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("ocs:show-controller", show);
    let frame = 0,
      lastDirection = 0,
      previous = new Set<ControllerAction>();
    function poll(now: number) {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      if (!pad) {
        previous.forEach((a) => controllerFeedback(a, false));
        previous.clear();
        frame = 0;
        return;
      }
      const active = new Set<ControllerAction>();
      if (!document.hidden) {
        if (pad.buttons[14]?.pressed || pad.axes[0] < -0.6) active.add("left");
        if (pad.buttons[15]?.pressed || pad.axes[0] > 0.6) active.add("right");
        if (pad.buttons[12]?.pressed || pad.axes[1] < -0.6) active.add("up");
        if (pad.buttons[13]?.pressed || pad.axes[1] > 0.6) active.add("down");
        if (pad.buttons[0]?.pressed) active.add("confirm");
        if (pad.buttons[1]?.pressed) active.add("back");
        if (pad.buttons[9]?.pressed) active.add("home");
      }
      active.forEach((a) => {
        const directional = ["up", "down", "left", "right"].includes(a);
        if (!previous.has(a) || (directional && now - lastDirection > 200)) {
          controllerFeedback(a, true);
          controllerAction(a);
          if (directional) lastDirection = now;
        }
      });
      previous.forEach((a) => {
        if (!active.has(a)) controllerFeedback(a, false);
      });
      previous = active;
      frame = requestAnimationFrame(poll);
    }
    const connect = () => {
      if (!frame) frame = requestAnimationFrame(poll);
    };
    window.addEventListener("gamepadconnected", connect);
    if (Array.from(navigator.getGamepads?.() ?? []).some(Boolean)) connect();
    return () => {
      window.removeEventListener("ocs:show-controller", show);
      window.removeEventListener("gamepadconnected", connect);
      cancelAnimationFrame(frame);
      previous.forEach((a) => controllerFeedback(a, false));
    };
  }, []);
  return (
    <aside className="controller-dock" aria-label="Console controller">
      {open && (
        <div className="controller-card">
          <div className="controller-card-heading">
            <span>CONTROLLER</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close controller"
            >
              <X size={16} />
            </button>
          </div>
          <div
            className="virtual-controller"
            role="group"
            aria-label="Interactive controller"
          >
            {controls.map((c) => (
              <button
                key={c.action}
                className={`pad-${c.action}`}
                data-pressed={!!pressed[c.action]}
                aria-label={c.label}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  controllerFeedback(c.action, true);
                }}
                onPointerUp={() => controllerFeedback(c.action, false)}
                onPointerCancel={() => controllerFeedback(c.action, false)}
                onLostPointerCapture={() => controllerFeedback(c.action, false)}
                onClick={() => controllerAction(c.action)}
              >
                {c.symbol}
              </button>
            ))}
          </div>
          <p>
            Arrows / D-pad to move · Enter / A to select
            <br />
            Esc / B to go back · Home / Start for home
            <br />
            Mouse, touch and Tab work too.
          </p>
        </div>
      )}
      <button
        className="controller-toggle"
        aria-label="Controller"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Gamepad2 size={17} />
        <span>Controller</span>
        <kbd>↑ ↓ ← →</kbd>
      </button>
    </aside>
  );
}
