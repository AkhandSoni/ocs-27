import * as THREE from "three";
import { CaseMotion, DiscMotion, DISC_RADIUS, makeCaseLayout } from "./domain-spatial.ts";
import { CUES, DOMAINS, DomainSequence, sampleLoad, type DomainState } from "./domain-sequence.ts";
import { paintPackage } from "./domain-package-art.ts";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { COLLECTION_BOUNDS } from "./game-collection.ts";
import { GAME_CASE, GAME_CASE_SHELL } from "./game-case.ts";
import type { ControllerAction } from "./controller-input";

type Domain = typeof DOMAINS[number];

/** Five articulated cases; the rest of the shelf remains instanced. */
export function createDomainLibrary(scene: THREE.Scene, camera: THREE.PerspectiveCamera, container: HTMLElement, onState: (state: DomainState) => void, stickyNote?: THREE.Object3D, invalidate = () => {}) {
  const sequence = new DomainSequence();
  let disposed = false;
  let enabled = true;
  let pendingIndex: number | null = null;
  let pendingBrowse = false;
  const artwork: ReturnType<typeof paintPackage>[] = [];
  const group = new THREE.Group();
  group.name = "ACM domain disc library";
  scene.add(group);
  const blue = new THREE.MeshPhysicalMaterial({ ...GAME_CASE_SHELL, roughness: .24, clearcoat: .8, clearcoatRoughness: .18 });
  const tray = new THREE.MeshStandardMaterial({ color: "#102439", roughness: .57 });
  const panelGeometry = new RoundedBoxGeometry(GAME_CASE.width, GAME_CASE.height, .012, 2, .004);
  const coverGeometry = new THREE.PlaneGeometry(GAME_CASE.width - .025, GAME_CASE.height - .025);
  const cases = DOMAINS.map((domain, index) => {
    const root = new THREE.Group();
    root.name = `${domain.name} disc case`;
    const back = new THREE.Mesh(panelGeometry, blue);
    back.position.z = -.026;
    root.add(back);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(GAME_CASE.width - .025, GAME_CASE.height - .025, .015), tray);
    inner.position.z = -.012;
    root.add(inner);
    const recess = new THREE.Mesh(new THREE.RingGeometry(.012, DISC_RADIUS + .005, 48), new THREE.MeshStandardMaterial({ color: "#080d16", roughness: .48 }));
    recess.position.z = -.003;
    root.add(recess);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .018, 16), blue);
    hub.rotation.x = Math.PI / 2;
    root.add(hub);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(.012, GAME_CASE.height, GAME_CASE.depth), blue);
    spine.position.x = -GAME_CASE.width / 2 + .006;
    root.add(spine);
    const spineMap = texture(paintSpine(domain, index));
    const spineLabel = new THREE.Mesh(new THREE.PlaneGeometry(.047, GAME_CASE.height - .025), new THREE.MeshStandardMaterial({ map: spineMap, roughness: .6 }));
    spineLabel.rotation.y = -Math.PI / 2;
    spineLabel.position.x = -GAME_CASE.width / 2 - .001;
    root.add(spineLabel);
    const hinge = new THREE.Group();
    hinge.position.set(-GAME_CASE.width / 2 + .006, 0, .026);
    const lid = new THREE.Mesh(panelGeometry, blue);
    lid.position.x = GAME_CASE.width / 2 - .006;
    hinge.add(lid);
    let coverMap: THREE.CanvasTexture;
    const coverCanvas = paintPackage(index, false, () => {
      if (!disposed) { coverMap.needsUpdate = true; invalidate(); }
    });
    artwork.push(coverCanvas);
    coverMap = texture(coverCanvas);
    const cover = new THREE.Mesh(coverGeometry, new THREE.MeshPhysicalMaterial({ map: coverMap, roughness: .3, clearcoat: .65, clearcoatRoughness: .24, emissiveMap: coverMap, emissive: "#ffffff", emissiveIntensity: .13 }));
    cover.position.set(GAME_CASE.width / 2 - .006, 0, .0065);
    hinge.add(cover);
    const inside = new THREE.Mesh(coverGeometry, tray);
    inside.rotation.y = Math.PI;
    inside.position.set(GAME_CASE.width / 2 - .006, 0, -.0065);
    hinge.add(inside);
    // Molded retaining clips and hinge barrels stay within the shared shell.
    for (const y of [-.24, .24]) {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(.035, .02, .012), blue);
      clip.position.set(GAME_CASE.width / 2 - .012, y, -.015); hinge.add(clip);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .085, 10), blue);
      barrel.position.set(-GAME_CASE.width / 2 + .008, y, 0); root.add(barrel);
    }
    root.add(hinge);
    root.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    group.add(root);
    return { root, hinge, motion: new CaseMotion(root, index) };
  });

  const disc = makeDisc();
  const discMaps = DOMAINS.map((_, index) => {
    let map: THREE.CanvasTexture;
    const canvas = paintPackage(index, true, () => {
      if (!disposed) { map.needsUpdate = true; invalidate(); }
    });
    artwork.push(canvas);
    map = texture(canvas);
    return map;
  });
  const printedDisc = new THREE.Mesh(new THREE.RingGeometry(.027, DISC_RADIUS - .005, 80), new THREE.MeshPhysicalMaterial({ map: discMaps[0], roughness: .36, metalness: .08, clearcoat: .55, side: THREE.FrontSide }));
  printedDisc.name = "Printed domain disc label";
  printedDisc.position.z = .0015; disc.add(printedDisc);
  let printedIndex = 0;
  disc.visible = false;
  group.add(disc);
  const discMotion = new DiscMotion(disc);
  let drive: ReturnType<typeof makeDrive> | undefined;
  let available = false;
  let previous: DomainState = sequence.state;
  let layout = makeCaseLayout(8, 16 / 9, 38);
  let targetLayout = layout;
  let fromPositions = layout.positions.map(position => position.clone());
  let fromRotations = layout.rotations.map(rotation => rotation.clone());
  let previewIndex = 0;
  let fanProgress = 1;
  let lastView = { z: 8, aspect: 16 / 9, fov: 38 };
  let layoutKey = "";
  let pose = sampleLoad(0);
  let shelveOthers = 0;

  const overlay = document.createElement("div");
  overlay.className = "domain-interactions";
  const shelf = document.createElement("button");
  shelf.type = "button";
  shelf.className = "domain-shelf-target";
  shelf.setAttribute("aria-label", "Domains — open the five disc cases");
  shelf.setAttribute("aria-expanded", "false");
  shelf.disabled = true;
  const shelfCaption = document.createElement("span");
  shelfCaption.className = "domain-shelf-caption";
  shelfCaption.textContent = "Domains";
  shelfCaption.setAttribute("aria-hidden", "true");
  shelf.appendChild(shelfCaption);
  overlay.appendChild(shelf);
  const buttons = DOMAINS.map((domain, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "domain-case-target";
    button.setAttribute("aria-label", `Select ${domain.name} case`);
    button.setAttribute("aria-pressed", String(i === previewIndex));
    button.style.setProperty("--case-accent", domain.color);
    button.hidden = true;
    const caption = document.createElement("span");
    caption.textContent = domain.name;
    button.appendChild(caption);
    button.onclick = () => activate(i);
    button.onkeydown = event => {
      const next = event.key === "ArrowRight" ? (i + 1) % buttons.length : event.key === "ArrowLeft" ? (i + buttons.length - 1) % buttons.length : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); preview(next); buttons[next].focus({ preventScroll: true }); }
    };
    overlay.appendChild(button);
    return button;
  });
  function activate(index: number) {
    if (sequence.state.phase !== "choosing") return;
    if (index !== previewIndex) { preview(index); return; }
    if (fanProgress < 1) { pendingIndex = index; invalidate(); return; }
    if (sequence.select(index)) publish();
  }
  function preview(index: number) {
    if (sequence.state.phase !== "choosing" || index === previewIndex) return;
    fromPositions = layout.positions.map(position => position.clone());
    fromRotations = layout.rotations.map(rotation => rotation.clone());
    previewIndex = index;
    targetLayout = makeCaseLayout(lastView.z, lastView.aspect, lastView.fov, previewIndex);
    fanProgress = 0;
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === previewIndex)));
    container.dataset.domainPreview = DOMAINS[previewIndex].id;
    invalidate();
  }
  container.appendChild(overlay);
  const open = () => {
    if (!available || !enabled) return false;
    if (sequence.state.phase === "active") { pendingBrowse = true; beginExit(); return true; }
    if (!sequence.open()) return false;
    publish();
    return true;
  };
  shelf.onclick = open;
  let hovered = false, focused = false;
  const noteRest = stickyNote?.position.clone();
  const noteRotation = stickyNote?.rotation.clone();
  const enterShelf = () => { hovered = true; invalidate(); };
  const leaveShelf = () => { hovered = false; invalidate(); };
  shelf.addEventListener("pointerenter", enterShelf);
  shelf.addEventListener("pointerleave", leaveShelf);
  shelf.onfocus = () => { focused = true; invalidate(); };
  shelf.onblur = () => { focused = false; invalidate(); };
  const exit = () => { pendingIndex = null; pendingBrowse = false; beginExit(); };
  function beginExit() {
    if (!sequence.exit()) return;
    // Ejection reverses the selected case and disc, not the whole fan.
    // Early cancellation smoothly finishes shelving any other moving cases.
    shelveOthers = pose.focus;
    publish();
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !["idle", "active"].includes(sequence.state.phase)) {
      event.preventDefault(); event.stopImmediatePropagation(); exit();
    }
  };
  function outsideClick(event: MouseEvent) {
    if (sequence.state.phase !== "choosing" || event.button !== 0 || event.detail === 0) return;
    const target = event.target as Element | null;
    if (target?.closest(".domain-case-target,.controller-dock,.physical-controller")) return;
    const nearCase = buttons.some(button => {
      const box = button.getBoundingClientRect();
      return event.clientX >= box.left - 20 && event.clientX <= box.right + 20 && event.clientY >= box.top - 20 && event.clientY <= box.bottom + 20;
    });
    if (nearCase) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    exit();
  }
  document.addEventListener("click", outsideClick, true);
  document.addEventListener("keydown", onKey, true);

  function publish() {
    const next = sequence.state;
    if (next.phase === previous.phase && next.selected === previous.selected) return;
    previous = next;
    shelf.hidden = !["idle", "active"].includes(next.phase);
    shelf.setAttribute("aria-expanded", String(!["idle", "active"].includes(next.phase)));
    buttons.forEach(button => { button.hidden = next.phase !== "choosing"; });
    if (next.phase === "idle") {
      shelveOthers = 0;
      previewIndex = 0; fanProgress = 1; layoutKey = "";
      buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === 0)));
      delete container.dataset.domainPreview;
    } else if (next.phase === "choosing") container.dataset.domainPreview = DOMAINS[previewIndex].id;
    container.dataset.domainPhase = next.phase;
    onState(next);
    invalidate();
  }

  // Projection uses cached dimensions and scratch vectors, not layout reads.
  const point = new THREE.Vector3();
  const caseBox = new THREE.Box3(new THREE.Vector3(-GAME_CASE.width / 2 - .005, -GAME_CASE.height / 2 - .005, -.036), new THREE.Vector3(GAME_CASE.width / 2 + .005, GAME_CASE.height / 2 + .005, .036));
  const shelfBox = new THREE.Box3(new THREE.Vector3(...COLLECTION_BOUNDS.min), new THREE.Vector3(...COLLECTION_BOUNDS.max));
  const identity = new THREE.Matrix4();
  function project(button: HTMLButtonElement, box: THREE.Box3, matrix: THREE.Matrix4, width: number, height: number, clip = false) {
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    for (let i = 0; i < 8; i++) {
      point.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(matrix).project(camera);
      const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    // A minimum touch target preserves access to the thin shelf at small sizes.
    const w = Math.max(32, right - left), h = Math.max(32, bottom - top);
    const x = (left + right - w) / 2, y = (top + bottom - h) / 2;
    button.style.transform = `translate3d(${x}px,${y}px,0)`;
    button.style.width = `${w}px`;
    button.style.height = `${h}px`;
    if (clip) {
      // Clip the hit target to the projected cover. Rectangles would steal clicks
      // from the exposed corners of overlapping cases behind the front one.
      const polygon: string[] = [];
      for (const [px, py] of [[box.min.x, box.max.y], [box.max.x, box.max.y], [box.max.x, box.min.y], [box.min.x, box.min.y]]) {
        point.set(px, py, box.max.z).applyMatrix4(matrix).project(camera);
        polygon.push(`${(((point.x + 1) * width / 2 - x) / w) * 100}% ${(((1 - point.y) * height / 2 - y) / h) * 100}%`);
      }
      button.style.clipPath = `polygon(${polygon.join(",")})`;
    }
    return { x: (left + right) / 2, bottom };
  }

  return {
    get phase() { return sequence.state.phase; },
    get transporting() { return !["idle", "active"].includes(sequence.state.phase); },
    get busy() { return sequence.state.phase !== "idle"; },
    get moving() { return !["idle", "choosing", "active"].includes(sequence.state.phase) || fanProgress < 1; },
    get zoom() { return pose.zoom; },
    get accent() { return sequence.state.selected === null ? null : DOMAINS[sequence.state.selected!].color; },
    get bootProgress() { return pose.boot; },
    exit,
    open,
    launch(index: number) {
      if (!enabled || !available || !Number.isInteger(index) || !DOMAINS[index]) return false;
      pendingIndex = index;
      if (sequence.state.phase === "idle") open();
      else if (sequence.state.phase !== "choosing") beginExit();
      invalidate();
      return true;
    },
    control(action: ControllerAction) {
      if (sequence.state.phase === "idle" || sequence.state.phase === "active") return false;
      if (action === "back" || action === "home") exit();
      else if (sequence.state.phase === "choosing") {
        if (action === "left" || action === "right") {
          preview((previewIndex + (action === "right" ? 1 : -1) + buttons.length) % buttons.length);
          buttons[previewIndex].focus({ preventScroll: true });
        } else if (action === "confirm") activate(previewIndex);
      }
      return true;
    },
    setEnabled(value: boolean) {
      enabled = value;
      shelf.disabled = !available || !enabled;
      if (!value && sequence.state.phase !== "idle") exit();
      invalidate();
    },
    focusChoice() { buttons[previewIndex].focus({ preventScroll: true }); },
    focusShelf() { shelf.focus({ preventScroll: true }); },
    setDevice(device: THREE.Object3D) {
      drive = makeDrive(device);
      available = true;
      shelf.disabled = !enabled;
      shelfCaption.textContent = "Domains";
    },
    setUnavailable() { available = false; shelf.disabled = true; shelf.setAttribute("aria-label", "Domain disc drive unavailable — reload to retry"); },
    advance(delta: number, reduced: boolean) {
      sequence.update(delta, { reduced });
      if ((pendingIndex !== null || pendingBrowse) && sequence.state.phase === "idle") {
        publish();
        pendingBrowse = false;
        open();
      }
      if (pendingIndex !== null && sequence.state.phase === "choosing") preview(pendingIndex);
      if (sequence.state.phase === "returning" && sequence.state.selected !== null && Number.isFinite(delta) && delta >= 0) {
        shelveOthers = reduced ? 1 : Math.min(1, shelveOthers + Math.min(delta, .05) / .45);
      }
      if (Number.isFinite(delta) && delta >= 0) fanProgress = reduced ? 1 : Math.min(1, fanProgress + Math.min(delta, .05) / .52);
      if (stickyNote && noteRest && noteRotation) {
        const lift = sequence.state.phase === "idle" && (hovered || focused) ? 1 : 0;
        const ease = reduced ? 1 : 1 - Math.exp(-delta * 12);
        stickyNote.position.z = THREE.MathUtils.lerp(stickyNote.position.z, noteRest.z + lift * .035, ease);
        stickyNote.position.y = THREE.MathUtils.lerp(stickyNote.position.y, noteRest.y + lift * .012, ease);
        stickyNote.rotation.x = THREE.MathUtils.lerp(stickyNote.rotation.x, noteRotation.x - lift * .12, ease);
        stickyNote.rotation.z = THREE.MathUtils.lerp(stickyNote.rotation.z, noteRotation.z + lift * .035, ease);
      }
      if (pendingIndex !== null && sequence.state.phase === "choosing" && fanProgress === 1) {
        if (sequence.select(pendingIndex)) pendingIndex = null;
      }
      pose = sampleLoad(sequence.load);
      if (reduced && sequence.state.selected !== null) {
        // Keep only the short TV boot. Cases, disc, shutter and camera all use
        // their settled transforms, avoiding near-plane crossings in portrait.
        pose = { ...sampleLoad(CUES.end), boot: pose.boot };
      }
      publish();
    },
    draw(width: number, height: number, roomZ: number) {
      if (disposed) return;
      const nextKey = `${width}:${height}:${roomZ}`;
      lastView = { z: roomZ, aspect: width / height, fov: camera.fov };
      if (layoutKey !== nextKey) {
        layout = makeCaseLayout(roomZ, width / height, camera.fov, previewIndex);
        targetLayout = layout; fanProgress = 1; layoutKey = nextKey;
      } else if (layout !== targetLayout) {
        const t = fanProgress * fanProgress * (3 - 2 * fanProgress);
        layout.positions.forEach((position, i) => position.lerpVectors(fromPositions[i], targetLayout.positions[i], t));
        layout.rotations.forEach((rotation, i) => rotation.slerpQuaternions(fromRotations[i], targetLayout.rotations[i], t));
        if (fanProgress === 1) layout = targetLayout;
      }
      const selected = sequence.state.selected;
      if (selected !== null && selected !== printedIndex) {
        printedIndex = selected;
        printedDisc.material.map = discMaps[selected];
        printedDisc.material.needsUpdate = true;
      }
      cases.forEach((item, index) => {
        item.motion.update(sequence.presentation, pose, selected, layout, shelveOthers);
        item.hinge.rotation.y = selected === index ? -pose.lid * 2.4 : 0;
        item.root.updateWorldMatrix(true, true);
      });
      if (drive) {
        drive.left.position.x = -.0065 - pose.slot * .014;
        drive.right.position.x = .0065 + pose.slot * .014;
        drive.light.material.opacity = .16 + pose.slot * .75;
        if (selected !== null) discMotion.update(pose, cases[selected].root, drive.root);
        else disc.visible = false;
      }
      if (!shelf.hidden) project(shelf, shelfBox, identity, width, height);
      if (sequence.state.phase === "choosing") {
        buttons.forEach((button, i) => {
          project(button, caseBox, cases[i].root.matrixWorld, width, height, true);
          point.copy(cases[i].root.position).applyMatrix4(camera.matrixWorldInverse);
          button.style.zIndex = String(1000 + Math.round(point.z * 100));
        });
      }
    },
    dispose() {
      disposed = true;
      artwork.forEach(canvas => canvas.disposeArtwork?.());
      discMaps.forEach(map => map.dispose());
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("click", outsideClick, true);
      shelf.removeEventListener("pointerenter", enterShelf);
      shelf.removeEventListener("pointerleave", leaveShelf);
      delete container.dataset.domainPreview;
      overlay.remove();
      // Meshes and textures are owned and disposed by the room scene.
    },
  };
}

function texture(canvas: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

function paintSpine(domain: Domain, index: number) {
  const canvas = document.createElement("canvas"); canvas.width = 96; canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#152131"; ctx.fillRect(0, 0, 96, 640);
  ctx.fillStyle = domain.color; ctx.fillRect(0, 0, 96, 9); ctx.fillRect(0, 600, 96, 40);
  ctx.fillStyle = "#e4e5de"; ctx.fillRect(5, 8, 86, 72);
  ctx.fillStyle = "#172132"; ctx.font = "bold 27px Arial"; ctx.textAlign = "center"; ctx.fillText("ACM", 48, 56);
  ctx.translate(48, 320); ctx.rotate(-Math.PI / 2); ctx.fillStyle = "#f1f4f7"; ctx.font = "600 31px Arial"; ctx.fillText(domain.name, 0, 10, 455);
  return canvas;
}

function makeDisc() {
  const group = new THREE.Group(); group.name = "Removable domain disc";
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const gleam = ctx.createConicGradient(-.3, 256, 256);
  [[0, "#8a97a8"], [.12, "#f5f7fc"], [.2, "#aab6c6"], [.29, "#cec2df"], [.43, "#adbfc6"], [.55, "#f6f7fb"], [.7, "#939daf"], [.85, "#d4c7dd"], [1, "#8a97a8"]].forEach(([at, color]) => gleam.addColorStop(at as number, color as string));
  ctx.fillStyle = gleam; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "#e8efff22"; ctx.lineWidth = .5;
  for (let r = 40; r < 250; r += 2) { ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = "#263343"; ctx.textAlign = "center"; ctx.font = "500 17px Arial"; ctx.fillText("ACM  /  OCS’27", 256, 118);
  const finish = new THREE.MeshPhysicalMaterial({ map: texture(canvas), metalness: .65, roughness: .24, iridescence: .55, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 310], side: THREE.DoubleSide, emissive: "#7f8c9e", emissiveIntensity: .2 });
  const face = new THREE.Mesh(new THREE.RingGeometry(.017, DISC_RADIUS, 80), finish);
  face.castShadow = true; group.add(face);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(DISC_RADIUS - .0008, .001, 6, 80), new THREE.MeshStandardMaterial({ color: "#c8d1df", metalness: .6, roughness: .23 }));
  group.add(edge);
  const hub = new THREE.Mesh(new THREE.RingGeometry(.012, .025, 40), new THREE.MeshStandardMaterial({ color: "#697482", metalness: .5, roughness: .27, side: THREE.DoubleSide }));
  hub.position.z = .0005; group.add(hub);
  return group;
}

function makeDrive(device: THREE.Object3D) {
  device.updateWorldMatrix(true, true);
  const root = new THREE.Group(); root.name = "Animated disc-drive shutter";
  // Anchor on the actual imported front surface, not the model's off-centre origin.
  const origin = new THREE.Vector3(-.055, -.08, 1).applyMatrix4(device.matrixWorld);
  const direction = new THREE.Vector3(0, 0, -1).transformDirection(device.matrixWorld);
  const hit = new THREE.Raycaster(origin, direction).intersectObject(device, true)[0];
  const front = hit ? device.worldToLocal(hit.point.clone()).z : .44;
  root.position.set(-.055, -.08, front + .009);
  device.add(root);
  const black = new THREE.MeshStandardMaterial({ color: "#040507", roughness: .4, metalness: .3 });
  const surround = new THREE.Mesh(new THREE.BoxGeometry(.055, .44, .012), black);
  root.add(surround);
  const shutterMaterial = new THREE.MeshStandardMaterial({ color: "#15191f", roughness: .28, metalness: .65 });
  const shutterGeometry = new THREE.BoxGeometry(.012, .414, .006);
  const left = new THREE.Mesh(shutterGeometry, shutterMaterial), right = new THREE.Mesh(shutterGeometry, shutterMaterial);
  left.position.set(-.0065, 0, .009); right.position.set(.0065, 0, .009);
  root.add(left, right);
  const light = new THREE.Mesh(new THREE.PlaneGeometry(.002, .40), new THREE.MeshBasicMaterial({ color: "#9bc9ff", transparent: true, opacity: .16, depthWrite: false }));
  light.position.set(.025, 0, .008); root.add(light);
  return { root, left, right, light };
}
