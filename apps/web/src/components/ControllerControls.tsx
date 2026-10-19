"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { Gamepad2, X } from "lucide-react";
import {
  controllerAction,
  controllerFeedback,
  controllerKeys,
  isEditing,
  type ControllerAction,
  type ControllerFeedback,
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
// W3C Standard Gamepad order; additional touchpad buttons are device-specific.
const gamepadButtonControls = [
  "cross", "circle", "square", "triangle", "l1", "r1", "l2", "r2",
  "create", "options", "l3", "r3", "up", "down", "left", "right", "ps",
];
const controlActions = new Map(controls.map(({ position, action }) => [position, action]));
const keyboardControls: Record<string, string> = { q: "l1", e: "r1", z: "l2", c: "r2" };
export default function ControllerControls({ visible = true }: { visible?: boolean }) {
  const [open, setOpen] = useState(false),
    [pressed, setPressed] = useState<Record<string, boolean>>({});
  useLayoutEffect(() => {
    const held = new Map<string, { action: ControllerAction; control?: string }>();
    function down(event: KeyboardEvent) {
      const action = controllerKeys[event.key];
      if (!action || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditing(event.target) && event.key !== "Escape") return;
      const control = keyboardControls[event.key];
      held.set(event.code || event.key, { action, control });
      controllerFeedback(action, true, control);
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
      const key = event.code || event.key;
      const input = held.get(key);
      if (input) {
        held.delete(key);
        controllerFeedback(input.action, false, input.control);
      }
    }
    function release() {
      held.forEach(({ action, control }) => controllerFeedback(action, false, control));
      held.clear();
      setPressed({});
    }
    function feedback(event: Event) {
      const { control, pressed: active } = (
        event as CustomEvent<ControllerFeedback>
      ).detail;
      setPressed((current) => ({ ...current, [control]: active }));
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
      held.forEach(({ action, control }) => controllerFeedback(action, false, control));
    };
  }, []);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("ocs:show-controller", show);
    let frame = 0,
      lastDirection = 0,
      previous = new Set<ControllerAction>(),
      previousControls = new Map<string, ControllerAction>();
    function poll(now: number) {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      if (!pad) {
        previousControls.forEach((action, control) => controllerFeedback(action, false, control));
        previousControls.clear();
        previous.clear();
        frame = requestAnimationFrame(poll);
        return;
      }
      const active = new Set<ControllerAction>();
      const activeControls = new Map<string, ControllerAction>();
      if (!document.hidden) {
        gamepadButtonControls.forEach((control, index) => {
          const button = pad.buttons[index];
          if (button?.pressed || ((index === 6 || index === 7) && button?.value > 0.5))
            activeControls.set(control, controlActions.get(control) ?? "home");
        });
        // Give the D-pad first refusal, then use the dominant axis of each stick.
        // A single direction per frame prevents opposite/diagonal inputs from
        // racing each other through focus movement.
        const dpadDirection: ControllerAction | null = pad.buttons[12]?.pressed
          ? "up"
          : pad.buttons[13]?.pressed
            ? "down"
            : pad.buttons[14]?.pressed
              ? "left"
              : pad.buttons[15]?.pressed
                ? "right"
                : null;
        const stickDirection = (x = 0, y = 0): ControllerAction | null => {
          if (Math.max(Math.abs(x), Math.abs(y)) < 0.6) return null;
          if (Math.abs(x) > Math.abs(y)) return x < 0 ? "left" : "right";
          return y < 0 ? "up" : "down";
        };
        const leftStick = stickDirection(pad.axes[0], pad.axes[1]);
        const rightStick = stickDirection(pad.axes[2], pad.axes[3]);
        if (leftStick) activeControls.set(`lst-${leftStick}`, leftStick);
        if (rightStick) activeControls.set(`rst-${rightStick}`, rightStick);
        const direction =
          dpadDirection ??
          leftStick ??
          rightStick ??
          (pad.buttons[4]?.pressed || pad.buttons[6]?.value > 0.5
            ? "left"
            : pad.buttons[5]?.pressed || pad.buttons[7]?.value > 0.5
              ? "right"
              : null);
        if (direction) active.add(direction);
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
        if (pad.buttons[8]?.pressed) active.add("help");
        if (pad.buttons[9]?.pressed) active.add("system");
      }
      active.forEach((a) => {
        const directional = ["up", "down", "left", "right"].includes(a);
        if (!previous.has(a) || (directional && now - lastDirection > 200)) {
          controllerAction(a);
          if (directional) lastDirection = now;
        }
      });
      activeControls.forEach((action, control) => {
        if (!previousControls.has(control)) controllerFeedback(action, true, control);
      });
      previousControls.forEach((action, control) => {
        if (!activeControls.has(control)) controllerFeedback(action, false, control);
      });
      previous = active;
      previousControls = activeControls;
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
      previousControls.forEach((action, control) => controllerFeedback(action, false, control));
    };
  }, []);
  return (
    <aside className="controller-dock" aria-label="Console controller" hidden={!visible}>
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
                key={c.position}
                className={`pad-${c.position}`}
                data-pressed={!!pressed[c.position]}
                aria-label={c.label}
                title={c.label}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  controllerFeedback(c.action, true, c.position);
                }}
                onPointerUp={() => controllerFeedback(c.action, false, c.position)}
                onPointerCancel={() => controllerFeedback(c.action, false, c.position)}
                onLostPointerCapture={() => controllerFeedback(c.action, false, c.position)}
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
