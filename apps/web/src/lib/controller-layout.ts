import type { ControllerAction } from "./controller-input";

export const controls: {
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
