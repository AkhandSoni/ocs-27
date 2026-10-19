import * as THREE from "three";
import { CaseMotion, DiscMotion, DISC_RADIUS, makeCaseLayout } from "./domain-spatial.ts";
import { CUES, DOMAINS, DomainSequence, sampleLoad, type DomainState } from "./domain-sequence.ts";
import { domainCover } from "./domain-catalog.ts";
import { COLLECTION_BOUNDS } from "./game-collection.ts";
import { GAME_CASE, GAME_CASE_SHELL } from "./game-case.ts";

type Domain = typeof DOMAINS[number];

/** Five articulated cases; the rest of the shelf remains instanced. */
export function createDomainLibrary(scene: THREE.Scene, camera: THREE.PerspectiveCamera, container: HTMLElement, onState: (state: DomainState) => void, stickyNote?: THREE.Object3D) {
  const sequence = new DomainSequence();
  let disposed = false;
  const coverImages: HTMLImageElement[] = [];
  const group = new THREE.Group();
  group.name = "ACM domain disc library";
  scene.add(group);
  const blue = new THREE.MeshStandardMaterial(GAME_CASE_SHELL);
  const tray = new THREE.MeshStandardMaterial({ color: "#102439", roughness: .57 });
  const panelGeometry = new THREE.BoxGeometry(GAME_CASE.width, GAME_CASE.height, .012);
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
    const coverCanvas = paintCover(domain, index);
    const coverMap = texture(coverCanvas);
    const cover = new THREE.Mesh(coverGeometry, new THREE.MeshStandardMaterial({ map: coverMap, roughness: .38, metalness: 0 }));
    const coverImage = document.createElement("img");
    coverImage.decoding = "async";
    coverImage.onload = () => {
      if (disposed) return;
      paintCover(domain, index, coverCanvas, coverImage);
      coverMap.needsUpdate = true;
    };
    coverImage.src = domainCover(domain.id);
    coverImages.push(coverImage);
    cover.position.set(GAME_CASE.width / 2 - .006, 0, .0065);
    hinge.add(cover);
    const inside = new THREE.Mesh(coverGeometry, tray);
    inside.rotation.y = Math.PI;
    inside.position.set(GAME_CASE.width / 2 - .006, 0, -.0065);
    hinge.add(inside);
    root.add(hinge);
    root.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    group.add(root);
    return { root, hinge, motion: new CaseMotion(root, index) };
  });

  const disc = makeDisc();
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
    button.onclick = () => preview(i);
    button.onkeydown = event => {
      const next = event.key === "ArrowRight" ? (i + 1) % buttons.length : event.key === "ArrowLeft" ? (i + buttons.length - 1) % buttons.length : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); preview(next); buttons[next].focus({ preventScroll: true }); }
    };
    overlay.appendChild(button);
    return button;
  });
  const insert = document.createElement("button");
  insert.type = "button";
  insert.className = "domain-insert-action";
  insert.hidden = true;
  insert.textContent = `Insert ${DOMAINS[0].name} disc`;
  insert.onclick = () => {
    if (fanProgress < 1) return;
    if (sequence.select(previewIndex)) publish();
  };
  overlay.appendChild(insert);
  function preview(index: number) {
    if (sequence.state.phase !== "choosing" || index === previewIndex) return;
    fromPositions = layout.positions.map(position => position.clone());
    fromRotations = layout.rotations.map(rotation => rotation.clone());
    previewIndex = index;
    targetLayout = makeCaseLayout(lastView.z, lastView.aspect, lastView.fov, previewIndex);
    fanProgress = 0;
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === previewIndex)));
    insert.textContent = `Insert ${DOMAINS[previewIndex].name} disc`;
    insert.disabled = true;
    container.dataset.domainPreview = DOMAINS[previewIndex].id;
  }
  container.appendChild(overlay);
  shelf.onclick = () => { if (available && sequence.open()) publish(); };
  let hovered = false, focused = false;
  const noteRest = stickyNote?.position.clone();
  const noteRotation = stickyNote?.rotation.clone();
  const enterShelf = () => { hovered = true; };
  const leaveShelf = () => { hovered = false; };
  shelf.addEventListener("pointerenter", enterShelf);
  shelf.addEventListener("pointerleave", leaveShelf);
  shelf.onfocus = () => { focused = true; };
  shelf.onblur = () => { focused = false; };
  const exit = () => { if (sequence.exit()) publish(); };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && sequence.state.phase !== "idle") {
      event.preventDefault(); event.stopImmediatePropagation(); exit();
    }
  };
  document.addEventListener("keydown", onKey, true);

  function publish() {
    const next = sequence.state;
    if (next.phase === previous.phase && next.selected === previous.selected) return;
    previous = next;
    shelf.hidden = next.phase !== "idle";
    shelf.setAttribute("aria-expanded", String(next.phase !== "idle"));
    buttons.forEach(button => { button.hidden = next.phase !== "choosing"; });
    insert.hidden = next.phase !== "choosing";
    if (next.phase === "idle") {
      previewIndex = 0; fanProgress = 1; layoutKey = "";
      buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === 0)));
      insert.textContent = `Insert ${DOMAINS[0].name} disc`;
      delete container.dataset.domainPreview;
    } else if (next.phase === "choosing") container.dataset.domainPreview = DOMAINS[previewIndex].id;
    container.dataset.domainPhase = next.phase;
    onState(next);
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
    get busy() { return sequence.state.phase !== "idle"; },
    get zoom() { return pose.zoom; },
    get accent() { return sequence.state.selected === null ? null : DOMAINS[sequence.state.selected!].color; },
    get bootProgress() { return pose.boot; },
    exit,
    focusChoice() { buttons[previewIndex].focus({ preventScroll: true }); },
    focusShelf() { shelf.focus({ preventScroll: true }); },
    setDevice(device: THREE.Object3D) {
      drive = makeDrive(device);
      available = true;
      shelf.disabled = false;
      shelfCaption.textContent = "Domains";
    },
    setUnavailable() { shelf.setAttribute("aria-label", "Domain disc drive unavailable — reload to retry"); },
    advance(delta: number, reduced: boolean) {
      sequence.update(delta, { reduced });
      if (Number.isFinite(delta) && delta >= 0) fanProgress = reduced ? 1 : Math.min(1, fanProgress + Math.min(delta, .05) / .52);
      insert.disabled = fanProgress < 1;
      if (stickyNote && noteRest && noteRotation) {
        const lift = sequence.state.phase === "idle" && (hovered || focused) ? 1 : 0;
        const ease = reduced ? 1 : 1 - Math.exp(-delta * 12);
        stickyNote.position.z = THREE.MathUtils.lerp(stickyNote.position.z, noteRest.z + lift * .035, ease);
        stickyNote.position.y = THREE.MathUtils.lerp(stickyNote.position.y, noteRest.y + lift * .012, ease);
        stickyNote.rotation.x = THREE.MathUtils.lerp(stickyNote.rotation.x, noteRotation.x - lift * .12, ease);
        stickyNote.rotation.z = THREE.MathUtils.lerp(stickyNote.rotation.z, noteRotation.z + lift * .035, ease);
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
      cases.forEach((item, index) => {
        item.motion.update(sequence.presentation, pose, selected, layout);
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
        const front = project(buttons[previewIndex], caseBox, cases[previewIndex].root.matrixWorld, width, height, true);
        insert.style.left = `${front.x}px`;
        insert.style.top = `${Math.min(height - 52, front.bottom + 14)}px`;
      }
    },
    dispose() {
      disposed = true;
      coverImages.forEach(image => { image.onload = null; image.removeAttribute("src"); });
      coverImages.length = 0;
      document.removeEventListener("keydown", onKey, true);
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

function paintCover(domain: Domain, index: number, canvas = document.createElement("canvas"), image?: CanvasImageSource) {
  canvas.width = 512; canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111923"; ctx.fillRect(0, 0, 512, 640);
  if (image) ctx.drawImage(image, 0, 0, 512, 640);
  const gradient = ctx.createLinearGradient(0, 0, 0, 640);
  gradient.addColorStop(0, "#050b2520"); gradient.addColorStop(.48, "#050b2500"); gradient.addColorStop(1, "#050b25f5");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 640);
  ctx.fillStyle = "#ecece7"; ctx.fillRect(0, 0, 512, 60);
  ctx.fillStyle = "#151c25"; ctx.font = "bold 35px Arial"; ctx.fillText("PS5", 25, 43);
  ctx.fillStyle = domain.color; ctx.font = "500 21px Arial"; ctx.fillText(String(index + 1).padStart(2, "0"), 34, 413);
  ctx.fillStyle = "#f1f3f5"; ctx.font = `700 ${domain.name === "Management" ? 49 : domain.lines.length > 1 ? 43 : 60}px Arial`;
  domain.lines.forEach((line, i) => ctx.fillText(line, 32, 465 + i * 52));
  ctx.fillStyle = "#b7c1cd"; ctx.font = "400 16px Arial"; ctx.fillText("THE DOMAIN COLLECTION", 34, 594);
  ctx.fillStyle = domain.color; ctx.fillRect(32, 545, 448, 2);
  return canvas;
}

function paintSpine(domain: Domain, index: number) {
  const canvas = document.createElement("canvas"); canvas.width = 96; canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#152131"; ctx.fillRect(0, 0, 96, 640);
  ctx.fillStyle = domain.color; ctx.fillRect(0, 0, 96, 9); ctx.fillRect(0, 600, 96, 40);
  ctx.fillStyle = "#e4e5de"; ctx.fillRect(5, 8, 86, 72);
  ctx.fillStyle = "#172132"; ctx.font = "bold 33px Arial"; ctx.textAlign = "center"; ctx.fillText("PS5", 48, 56);
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
