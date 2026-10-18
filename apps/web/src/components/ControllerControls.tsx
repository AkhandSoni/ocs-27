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
const controls: {
  action: ControllerAction;
  symbol: string;
  label: string;
  position: string;
}[] = [
  {
    action: "left",
    symbol: "L2",
    label: "L2 trigger · Previous",
    position: "l2",
  },
  { action: "left", symbol: "L1", label: "L1 · Previous", position: "l1" },
  { action: "right", symbol: "R1", label: "R1 · Next", position: "r1" },
  { action: "right", symbol: "R2", label: "R2 trigger · Next", position: "r2" },
  { action: "up", symbol: "↑", label: "D-pad up", position: "up" },
  { action: "left", symbol: "←", label: "D-pad left", position: "left" },
  { action: "right", symbol: "→", label: "D-pad right", position: "right" },
  { action: "down", symbol: "↓", label: "D-pad down", position: "down" },
  {
    action: "help",
    symbol: "Create",
    label: "Create · Help",
    position: "create",
  },
  {
    action: "home",
    symbol: "⌂",
    label: "Touchpad · Console home",
    position: "touchpad",
  },
  {
    action: "system",
    symbol: "Options",
    label: "Options · Control center",
    position: "options",
  },
  {
    action: "confirm",
    symbol: "L3",
    label: "Left stick click · Select",
    position: "l3",
  },
  {
    action: "confirm",
    symbol: "R3",
    label: "Right stick click · Select",
    position: "r3",
  },
  { action: "up", symbol: "↑", label: "Left stick up", position: "lst-up" },
  {
    action: "down",
    symbol: "↓",
    label: "Left stick down",
    position: "lst-down",
  },
  {
    action: "left",
    symbol: "←",
    label: "Left stick left",
    position: "lst-left",
  },
  {
    action: "right",
    symbol: "→",
    label: "Left stick right",
    position: "lst-right",
  },
  { action: "up", symbol: "↑", label: "Right stick up", position: "rst-up" },
  {
    action: "down",
    symbol: "↓",
    label: "Right stick down",
    position: "rst-down",
  },
  {
    action: "left",
    symbol: "←",
    label: "Right stick left",
    position: "rst-left",
  },
  {
    action: "right",
    symbol: "→",
    label: "Right stick right",
    position: "rst-right",
  },
  { action: "back", symbol: "□", label: "Square · Back", position: "square" },
  {
    action: "home",
    symbol: "△",
    label: "Triangle · Home",
    position: "triangle",
  },
  { action: "back", symbol: "○", label: "Circle · Back", position: "circle" },
  {
    action: "confirm",
    symbol: "×",
    label: "Cross · Select",
    position: "cross",
  },
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
        if (
          pad.buttons[14]?.pressed ||
          pad.axes[0] < -0.6 ||
          pad.axes[2] < -0.6
        )
          active.add("left");
        if (pad.buttons[15]?.pressed || pad.axes[0] > 0.6 || pad.axes[2] > 0.6)
          active.add("right");
        if (
          pad.buttons[12]?.pressed ||
          pad.axes[1] < -0.6 ||
          pad.axes[3] < -0.6
        )
          active.add("up");
        if (pad.buttons[13]?.pressed || pad.axes[1] > 0.6 || pad.axes[3] > 0.6)
          active.add("down");
        if (
          pad.buttons[0]?.pressed ||
          pad.buttons[10]?.pressed ||
          pad.buttons[11]?.pressed
        )
          active.add("confirm");
        if (pad.buttons[1]?.pressed || pad.buttons[2]?.pressed)
          active.add("back");
        if (
          pad.buttons[3]?.pressed ||
          pad.buttons[16]?.pressed ||
          pad.buttons[17]?.pressed
        )
          active.add("home");
        if (pad.buttons[4]?.pressed || pad.buttons[6]?.value > 0.5)
          active.add("left");
        if (pad.buttons[5]?.pressed || pad.buttons[7]?.value > 0.5)
          active.add("right");
        if (pad.buttons[8]?.pressed) active.add("help");
        if (pad.buttons[9]?.pressed) active.add("system");
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
        <div className="controller-card controller-card-full">
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
                className={`pad-${c.position}`}
                data-pressed={!!pressed[c.action]}
                aria-label={c.label}
                title={c.label}
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
            D-pad / sticks move · Cross selects · Circle goes back
            <br />
            L1 / L2 move left · R1 / R2 move right
            <br />
            Triangle / touchpad home · Create help · Options control center
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
