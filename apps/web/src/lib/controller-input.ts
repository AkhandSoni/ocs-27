export type ControllerAction =
  | "left"
  | "right"
  | "up"
  | "down"
  | "confirm"
  | "back"
  | "home"
  | "help"
  | "system"
  | "controller";
export const controllerKeys: Record<string, ControllerAction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Enter: "confirm",
  Escape: "back",
  Backspace: "back",
  Home: "home",
  q: "left",
  e: "right",
  z: "left",
  c: "right",
  " ": "confirm",
  f: "help",
  g: "system",
};
export function controllerAction(action: ControllerAction) {
  window.dispatchEvent(
    new CustomEvent("ocs:controller-action", { detail: action }),
  );
}
const feedbackControl: Record<ControllerAction, string> = {
  left: "left",
  right: "right",
  up: "up",
  down: "down",
  confirm: "cross",
  back: "circle",
  home: "touchpad",
  help: "create",
  system: "options",
  controller: "controller",
};
export type ControllerFeedback = {
  action: ControllerAction;
  pressed: boolean;
  control: string;
};
export function controllerFeedback(
  action: ControllerAction,
  pressed: boolean,
  control = feedbackControl[action],
) {
  window.dispatchEvent(
    new CustomEvent<ControllerFeedback>("ocs:controller-feedback", {
      detail: { action, pressed, control },
    }),
  );
}
export function isEditing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    !!target.closest('input,textarea,select,[contenteditable="true"]')
  );
}
export function moveFocus(root: HTMLElement, action: ControllerAction) {
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
    ),
  ).filter(
    (node) => !node.closest("[inert]") && node.getClientRects().length > 0,
  );
  const current = nodes.indexOf(document.activeElement as HTMLElement);
  const delta = action === "left" || action === "up" ? -1 : 1;
  nodes[(current + delta + nodes.length) % nodes.length]?.focus({
    preventScroll: true,
  });
  (document.activeElement as HTMLElement)?.scrollIntoView({
    block: "nearest",
    inline: "nearest",
  });
}
