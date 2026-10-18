import * as THREE from "three";

/** Moves the actual room model into a camera-relative, slightly reclined grip. */
export class ControllerMotion {
  held = false;
  moving = false;
  private elapsed = 0;
  private readonly model: THREE.Object3D;
  private readonly camera: THREE.Camera;
  private readonly reduced: () => boolean;
  private readonly restPosition: THREE.Vector3;
  private readonly restRotation: THREE.Quaternion;
  private readonly restScale: THREE.Vector3;
  private readonly fromPosition = new THREE.Vector3();
  private readonly fromRotation = new THREE.Quaternion();
  private readonly fromScale = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly targetRotation = new THREE.Quaternion();
  private readonly targetScale = new THREE.Vector3();
  private readonly gripRotation = new THREE.Quaternion();
  private readonly gripEuler = new THREE.Euler();

  constructor(model: THREE.Object3D, camera: THREE.Camera, reduced: () => boolean) {
    this.model = model;
    this.camera = camera;
    this.reduced = reduced;
    this.restPosition = model.position.clone();
    this.restRotation = model.quaternion.clone();
    this.restScale = model.scale.clone();
  }

  toggle() {
    this.held = !this.held;
    this.elapsed = 0;
    this.moving = true;
    this.fromPosition.copy(this.model.position);
    this.fromRotation.copy(this.model.quaternion);
    this.fromScale.copy(this.model.scale);
  }

  update(delta: number, time: number, pointerX = 0, pointerY = 0) {
    if (!this.held && !this.moving) return;
    const quiet = this.reduced();
    if (this.held) {
      this.camera.updateWorldMatrix(true, false);
      // Top edge leans away; a small yaw and roll avoid a flat product-shot pose.
      this.gripEuler.set(-0.48 + (quiet ? 0 : pointerY * 0.025), Math.PI + 0.10 + (quiet ? 0 : pointerX * 0.035), -0.10);
      this.gripRotation.setFromEuler(this.gripEuler);
      this.camera.getWorldQuaternion(this.targetRotation).multiply(this.gripRotation);
      this.targetPosition.set(0.14 + (quiet ? 0 : pointerX * 0.018), -0.45 + (quiet ? 0 : Math.sin(time * 1.45) * 0.004), -1.85).applyMatrix4(this.camera.matrixWorld);
      this.targetScale.copy(this.restScale).multiplyScalar(0.88);
    } else {
      this.targetPosition.copy(this.restPosition);
      this.targetRotation.copy(this.restRotation);
      this.targetScale.copy(this.restScale);
    }
    this.elapsed += delta;
    const progress = quiet ? 1 : Math.min(1, this.elapsed / (this.held ? 1.15 : 0.95));
    const eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
    if (this.moving) {
      this.model.position.lerpVectors(this.fromPosition, this.targetPosition, eased);
      // Lift off the cabinet before coming forward, then settle into the grip.
      this.model.position.y += Math.sin(progress * Math.PI) * 0.48;
      this.model.quaternion.slerpQuaternions(this.fromRotation, this.targetRotation, eased);
      this.model.scale.lerpVectors(this.fromScale, this.targetScale, eased);
      if (progress === 1) this.moving = false;
    } else {
      this.model.position.copy(this.targetPosition);
      this.model.quaternion.copy(this.targetRotation);
      this.model.scale.copy(this.targetScale);
    }
  }
}

export function createControllerPickup(model: THREE.Object3D, camera: THREE.Camera, container: HTMLElement, reduced: () => boolean) {
  const motion = new ControllerMotion(model, camera, reduced);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const bounds = new THREE.Box3();
  const corner = new THREE.Vector3();
  const hitPoint = new THREE.Vector3();
  const button = document.createElement("button");
  button.type = "button";
  button.className = "controller-hit-target";
  button.setAttribute("aria-label", "Pick up controller");
  button.setAttribute("aria-pressed", "false");
  container.appendChild(button);
  let hovering = false;
  let down: { x: number; y: number; hit: boolean } | null = null;
  let disposed = false;
  let castsRoomShadow = true;

  function toggle() {
    motion.toggle();
    button.setAttribute("aria-label", motion.held ? "Put controller back" : "Pick up controller");
    button.setAttribute("aria-pressed", String(motion.held));
  }
  function intersects(event: MouseEvent | PointerEvent) {
    const rect = container.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    // Reject the rest of the page before doing triangle-level picking.
    return raycaster.ray.intersectBox(bounds, hitPoint) !== null && raycaster.intersectObject(model, true).length > 0;
  }
  function move(event: PointerEvent) {
    hovering = intersects(event);
    container.classList.toggle("controller-hover", hovering);
  }
  function pointerDown(event: PointerEvent) {
    const hit = intersects(event);
    down = { x: event.clientX, y: event.clientY, hit };
    if (hit) { event.preventDefault(); event.stopPropagation(); }
  }
  function click(event: MouseEvent) {
    if (!down?.hit || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8 || !intersects(event)) return;
    down = null;
    event.preventDefault(); event.stopPropagation(); toggle();
  }
  function leave() { hovering = false; down = null; container.classList.remove("controller-hover"); }
  function key(event: KeyboardEvent) {
    if (event.key === "Escape" && motion.held) {
      event.preventDefault(); event.stopPropagation(); toggle();
    }
  }
  function keyboardClick(event: MouseEvent) { if (event.detail === 0) toggle(); }
  container.addEventListener("pointermove", move, { passive: true });
  container.addEventListener("pointerdown", pointerDown, true);
  container.addEventListener("click", click, true);
  container.addEventListener("pointerleave", leave);
  document.addEventListener("keydown", key, true);
  button.addEventListener("click", keyboardClick);

  return {
    update(delta: number, time: number, pointerX: number, pointerY: number) {
      if (disposed) return;
      motion.update(delta, time, pointerX, pointerY);
      const shouldCast = !motion.held && !motion.moving;
      if (castsRoomShadow !== shouldCast) {
        model.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = shouldCast; });
        castsRoomShadow = shouldCast;
      }
      model.updateWorldMatrix(true, true);
      bounds.setFromObject(model);
      let left = Infinity, top = -Infinity, right = -Infinity, bottom = Infinity;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z).project(camera);
        left = Math.min(left, corner.x); right = Math.max(right, corner.x);
        top = Math.max(top, corner.y); bottom = Math.min(bottom, corner.y);
      }
      const w = container.clientWidth, h = container.clientHeight;
      Object.assign(button.style, { left: `${(left + 1) * w / 2}px`, top: `${(1 - top) * h / 2}px`, width: `${(right - left) * w / 2}px`, height: `${(top - bottom) * h / 2}px` });
      container.dataset.controllerState = motion.moving ? (motion.held ? "picking-up" : "putting-back") : motion.held ? "held" : "resting";
    },
    dispose() {
      disposed = true;
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerdown", pointerDown, true);
      container.removeEventListener("click", click, true);
      container.removeEventListener("pointerleave", leave);
      document.removeEventListener("keydown", key, true);
      button.removeEventListener("click", keyboardClick);
      container.classList.remove("controller-hover");
      delete container.dataset.controllerState;
      button.remove();
    },
  };
}
