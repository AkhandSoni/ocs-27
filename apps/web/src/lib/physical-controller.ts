import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { controls } from "./controller-layout";
import { controllerAction, controllerFeedback, type ControllerFeedback } from "./controller-input";

/** Accessible button geometry follows the same model through pickup and return.
 * This is a DOM projection layer, not a second GPU renderer.
 */
export function createPhysicalController(container: HTMLElement, camera: THREE.Camera) {
  const renderer = new CSS3DRenderer();
  renderer.domElement.className = "controller-dom-layer";
  Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", zIndex: "2", pointerEvents: "none" });
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const element = document.createElement("div");
  element.className = "physical-controller";
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", "Physical room controller");
  controls.forEach(({ action, symbol, position, label }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `physical-${position}`;
    button.dataset.control = position;
    button.dataset.pressed = "false";
    button.textContent = symbol;
    button.setAttribute("aria-label", `Room controller ${label}`);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      controllerFeedback(action, true, position);
    });
    const release = () => controllerFeedback(action, false, position);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      controllerAction(action);
    });
    element.appendChild(button);
  });
  const surface = new CSS3DObject(element);
  surface.position.set(-2.47, 1.82, 0.52);
  surface.scale.setScalar(0.004);
  scene.add(surface);
  let model: THREE.Object3D | null = null;
  const attachment = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();
  function feedback(event: Event) {
    const { control, pressed } = (event as CustomEvent<ControllerFeedback>).detail;
    for (const button of element.querySelectorAll("button")) {
      if (button.dataset.control === control) button.dataset.pressed = String(pressed);
    }
  }
  function releaseAll() {
    element.querySelectorAll("button").forEach((button) => { button.dataset.pressed = "false"; });
  }
  window.addEventListener("ocs:controller-feedback", feedback);
  window.addEventListener("blur", releaseAll);
  element.inert = true;
  element.style.visibility = "hidden";

  return {
    attach(device: THREE.Object3D) {
      model = device;
      model.updateWorldMatrix(true, false);
      surface.updateWorldMatrix(true, false);
      attachment.copy(model.matrixWorld).invert().multiply(surface.matrixWorld);
    },
    setEnabled(enabled: boolean) {
      element.inert = !enabled;
      element.style.visibility = enabled ? "visible" : "hidden";
      if (!enabled) releaseAll();
    },
    resize(width: number, height: number) { renderer.setSize(width, height); },
    render() {
      if (model) {
        model.updateWorldMatrix(true, false);
        matrix.multiplyMatrices(model.matrixWorld, attachment);
        matrix.decompose(surface.position, surface.quaternion, surface.scale);
      }
      renderer.render(scene, camera);
    },
    dispose() {
      window.removeEventListener("ocs:controller-feedback", feedback);
      window.removeEventListener("blur", releaseAll);
      renderer.domElement.remove();
      scene.clear();
      model = null;
    },
  };
}
