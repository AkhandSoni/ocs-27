import * as THREE from "three";
import { MeshBasicNodeMaterial, PMREMGenerator, WebGPURenderer } from "three/webgpu";
import { vec4 } from "three/tsl";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildRoom } from "./room-objects";
import { createControllerPickup } from "./controller-pickup";
import { createDomainLibrary } from "./domain-library";
import type { DomainState } from "./domain-sequence";
import { roomCameraZ, tvCameraZ } from "./domain-spatial";
import { finishDeviceMaterial } from "./device-finish";
import { advanceVisibleFrame } from "./visible-frame";
import { createPhysicalController } from "./physical-controller";
import type { ControllerAction } from "./controller-input";

export type RoomController = {
  setAccent: (color: string) => void;
  setLighting: (warm: boolean) => void;
  setFocus: (focused: boolean) => void;
  setInteractive: (enabled: boolean) => void;
  openDomainLibrary: () => boolean;
  launchDomain: (index: number) => boolean;
  exitDomain: () => void;
  focusDomainCase: () => void;
  focusDiscShelf: () => void;
  dispose: () => void;
};

export type RoomCallbacks = {
  onReady: (renderer: "WebGPU" | "WebGL 2") => void;
  onError: (message: string) => void;
  onAssetError: (message: string) => void;
  onDomainState: (state: DomainState) => void;
  onConsolePower: () => void;
};

/** A single camera drives the GPU scene and the accessible, interactive TV plane. */
export async function createRoom(
  container: HTMLElement,
  screenElement: HTMLElement,
  callbacks: RoomCallbacks,
): Promise<RoomController> {
  let disposed = false;
  let focused = true;
  let interactive = false;
  let needsRender = true;
  let settleUntil = performance.now() + 3000;
  function invalidate() { needsRender = true; settleUntil = performance.now() + 1800; }
  let warm = true;
  let visible = !document.hidden;
  let inView = true;
  let pointerX = 0;
  let pointerY = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#161512");
  scene.fog = new THREE.FogExp2("#181613", 0.022);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 3.65, 8.5);
  const lookTarget = new THREE.Vector3(0, 3.65, -0.3);

  const forceWebGL = new URLSearchParams(window.location.search).get("renderer") === "webgl";
  const renderer = new WebGPURenderer({ antialias: true, alpha: true, forceWebGL });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-label", "Interactive 3D gaming lounge with a PlayStation 5 and walnut furniture");
  renderer.domElement.setAttribute("role", "img");
  Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", zIndex: "1", pointerEvents: "none" });
  container.appendChild(renderer.domElement);

  try {
    await renderer.init();
  } catch (error) {
    renderer.dispose();
    renderer.domElement.remove();
    throw new Error(`The 3D renderer could not start. ${error instanceof Error ? error.message : "Please enable graphics acceleration."}`);
  }

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.className = "tv-dom-layer";
  Object.assign(cssRenderer.domElement.style, { position: "absolute", inset: "0", zIndex: "0", pointerEvents: "none" });
  container.appendChild(cssRenderer.domElement);
  const cssScene = new THREE.Scene();
  Object.assign(screenElement.style, { width: "1280px", height: "720px", pointerEvents: "auto", backfaceVisibility: "hidden", overflow: "hidden", background: "#080a0a" });
  const tvUI = new CSS3DObject(screenElement);
  tvUI.scale.setScalar(5.64 / 1280);
  tvUI.position.set(0, 3.65, -0.352);
  cssScene.add(tvUI);

  const physical = createPhysicalController(container, camera);
  let room: ReturnType<typeof buildRoom>;
  try {
    const walnutTexture = await new THREE.TextureLoader().loadAsync("/textures/walnut.jpg");
    room = buildRoom(scene, walnutTexture, invalidate);
  } catch (error) {
    physical.dispose();
    disposeObject(scene);
    renderer.dispose();
    renderer.domElement.remove();
    cssRenderer.domElement.remove();
    throw new Error(`The room textures could not load. ${error instanceof Error ? error.message : "Please try again."}`);
  }
  // A one-time, small reflection capture gives plastic, metal and discs a
  // coherent room to reflect. No external HDR download or per-frame capture.
  const environmentScene = new RoomEnvironment();
  const environmentGenerator = new PMREMGenerator(renderer);
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace();
  const previousMip = renderer.getActiveMipmapLevel();
  const previousAutoClear = renderer.autoClear;
  let environmentTarget: Awaited<ReturnType<PMREMGenerator["fromSceneAsync"]>> | undefined;
  let failedEnvironmentTarget: ReturnType<WebGPURenderer["getRenderTarget"]> = null;
  try {
    environmentTarget = await environmentGenerator.fromSceneAsync(environmentScene, .04, .1, 100, { size: 128 });
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = .38;
    scene.environmentRotation.y = .35;
  } catch (error) {
    failedEnvironmentTarget = renderer.getRenderTarget();
    callbacks.onAssetError(`Room reflections are unavailable: ${error instanceof Error ? error.message : "using direct lighting"}`);
  } finally {
    // PMREM's own cleanup runs only on success. A failed capture must not
    // leave the first visible frame rendering into its offscreen texture.
    renderer.setRenderTarget(previousTarget, previousFace, previousMip);
    renderer.autoClear = previousAutoClear;
    if (failedEnvironmentTarget && failedEnvironmentTarget !== previousTarget) failedEnvironmentTarget.dispose();
    environmentScene.dispose();
    environmentGenerator.dispose();
  }
  const ambient = new THREE.HemisphereLight("#e0e4ef", "#6d503a", .85);
  scene.add(ambient);
  const fill = new THREE.DirectionalLight("#e9edf6", 1.8);
  fill.position.set(-3, 6, 6);
  scene.add(fill);
  const key = new THREE.SpotLight("#ffbf80", 75, 20, 0.8, 0.7, 1.5);
  key.position.set(-4, 6.5, 4);
  key.target.position.set(0, 1, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.03;
  scene.add(key, key.target);

  // The TV is real black geometry; only its display is a DOM surface.
  const black = new THREE.MeshStandardMaterial({ color: "#101113", roughness: .38, metalness: .08 });
  const tvGroup = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(5.84, 3.38, .18, 3, .025), black);
  body.position.set(0, 3.65, -0.48);
  body.castShadow = true;
  tvGroup.add(body);
  const rim = new THREE.Mesh(new RoundedBoxGeometry(5.73, 3.27, .045, 2, .012), new THREE.MeshStandardMaterial({ color: "#242629", metalness: .78, roughness: .3 }));
  rim.position.set(0, 3.65, -0.377);
  tvGroup.add(rim);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(.23, .5, .095), black);
  neck.position.set(0, 1.73, -.53); neck.castShadow = true; tvGroup.add(neck);
  const stand = new THREE.Mesh(new RoundedBoxGeometry(.9, .035, .44, 2, .012), black);
  stand.position.set(0, 1.47, -.46); stand.castShadow = true; tvGroup.add(stand);
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(.013, 12, 8), black);
  sensor.position.set(.075, 1.984, -.377); tvGroup.add(sensor);
  // A depth-tested transparent aperture reveals the DOM display below the GPU
  // canvas. Foreground geometry can now cover the screen without a second renderer.
  const aperture = new MeshBasicNodeMaterial({ transparent: true, blending: THREE.NoBlending, fog: false, toneMapped: false });
  // Write zero alpha explicitly: ordinary transparent materials discard alpha=0.
  aperture.fragmentNode = vec4(0, 0, 0, 0);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.64, 3.1725), aperture);
  glass.position.set(0, 3.65, -0.351);
  tvGroup.add(glass);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshBasicMaterial({ color: "#d5e7dd" }));
  led.position.set(0.03, 1.984, -0.377);
  tvGroup.add(led);
  scene.add(tvGroup);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const models: THREE.Object3D[] = [];
  const mixers: THREE.AnimationMixer[] = [];
  let pickup: ReturnType<typeof createControllerPickup> | undefined;
  let consoleModel: THREE.Object3D | undefined;
  const library = createDomainLibrary(scene, camera, container, state => {
    pickup?.setEnabled(interactive && !focused && ["idle", "active"].includes(state.phase));
    physical.setEnabled(interactive && !focused && ["idle", "active"].includes(state.phase));
    callbacks.onDomainState(state);
    invalidate();
  }, room.stickyNote, invalidate);
  library.setEnabled(false);

  async function addModel(path: string, height: number, position: THREE.Vector3, rotation: THREE.Euler) {
    try {
      const gltf = await loader.loadAsync(path);
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      // Model origins differ substantially; normalize inside a placement group.
      const normalization = new THREE.Group();
      model.position.sub(center);
      normalization.add(model);
      normalization.scale.setScalar(height / size.y);
      const placement = new THREE.Group();
      placement.add(normalization);
      placement.position.copy(position);
      placement.position.y += height / 2;
      placement.rotation.copy(rotation);
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: THREE.Material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              finishDeviceMaterial(material, path.includes("dualsense") ? "controller" : "ps5");
            }
          });
        }
      });
      scene.add(placement);
      models.push(placement);
      invalidate();
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        mixers.push(mixer);
      }
      return placement;
    } catch (error) {
      if (!disposed) callbacks.onAssetError(`A device model could not load: ${error instanceof Error ? error.message : path}`);
    }
  }

  void Promise.all([
    addModel("/models/ps5-optimized.glb", 1.4, new THREE.Vector3(-3.65, 1.46, -0.05), new THREE.Euler(0, 0.08, 0)).then(model => {
      if (disposed) return;
      if (model) { consoleModel = model; library.setDevice(model); invalidate(); }
      else library.setUnavailable();
    }),
    addModel("/models/dualsense-optimized.glb", 0.51, new THREE.Vector3(-2.47, 1.45, 0.28), new THREE.Euler(-0.25, Math.PI - 0.08, 0.02)).then(model => {
      if (model && !disposed) {
        physical.attach(model);
        pickup = createControllerPickup(model, camera, container, () => reducedMotion.matches, invalidate);
        pickup.setEnabled(interactive && !focused && !library.transporting);
        physical.setEnabled(interactive && !focused && !library.transporting);
        invalidate();
      }
    }),
  ]);

  let width = 0;
  let height = 0;
  let viewportChanged = true;
  function resize() {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height);
    cssRenderer.setSize(width, height);
    physical.resize(width, height);
    camera.aspect = width / height;
    // Keep the complete TV usable on narrower screens.
    camera.fov = width < 680 ? 48 : 38;
    camera.updateProjectionMatrix();
    viewportChanged = true;
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; invalidate(); }, { threshold: 0.01 });
  intersectionObserver.observe(container);
  resize();

  function onPointer(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    if (!focused || pickup?.held) invalidate();
  }
  function onVisibility() { visible = !document.hidden; lastFrameTime = performance.now(); invalidate(); }
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  // Raycasts handle actual device bodies. Native controls must never trigger a
  // second action on the model behind them.
  const powerRay = new THREE.Raycaster();
  const powerPointer = new THREE.Vector2();
  const powerTarget = document.createElement("button");
  powerTarget.type = "button";
  powerTarget.className = "console-power-target";
  powerTarget.setAttribute("aria-label", "Console power");
  powerTarget.hidden = true;
  powerTarget.addEventListener("click", callbacks.onConsolePower);
  container.appendChild(powerTarget);
  const deviceBounds = new THREE.Box3();
  const deviceCorner = new THREE.Vector3();
  function projectPowerTarget(show: boolean) {
    powerTarget.hidden = !show || !consoleModel || library.transporting;
    if (powerTarget.hidden || !consoleModel) return;
    deviceBounds.setFromObject(consoleModel);
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (let index = 0; index < 8; index++) {
      deviceCorner.set(index & 1 ? deviceBounds.max.x : deviceBounds.min.x, index & 2 ? deviceBounds.max.y : deviceBounds.min.y, index & 4 ? deviceBounds.max.z : deviceBounds.min.z).project(camera);
      const x = (deviceCorner.x + 1) * width / 2, y = (1 - deviceCorner.y) * height / 2;
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
    Object.assign(powerTarget.style, { left: `${left}px`, top: `${top}px`, width: `${right-left}px`, height: `${bottom-top}px` });
  }
  function powerClick(event: MouseEvent) {
    if (focused || !consoleModel || event.button !== 0 || library.transporting) return;
    if ((event.target as Element | null)?.closest("button,a,input,textarea,select,.ocs-console,.domain-interactions,.physical-controller")) return;
    const rect = container.getBoundingClientRect();
    powerPointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    powerRay.setFromCamera(powerPointer, camera);
    if (powerRay.intersectObject(consoleModel, true).length) callbacks.onConsolePower();
  }
  function domainControl(event: Event) {
    if (library.control((event as CustomEvent<ControllerAction>).detail)) event.stopImmediatePropagation();
  }
  container.addEventListener("click", powerClick);
  window.addEventListener("ocs:controller-action", domainControl, true);
  reducedMotion.addEventListener("change", invalidate);

  const accentTarget = new THREE.Color("#d4b26e");
  const warmColor = new THREE.Color("#ffb863");
  const coolColor = new THREE.Color("#a0c6e9");
  const warmBackground = new THREE.Color("#161512");
  const coolBackground = new THREE.Color("#14191e");
  let lastFrameTime = performance.now();
  let time = 0;
  let frameCount = 0;

  await renderer.setAnimationLoop(() => {
    const now = performance.now();
    const delta = Math.min((now - lastFrameTime) / 1000, .5);
    if (disposed || !visible || !inView) { lastFrameTime = now; return; }
    if (now - lastFrameTime < 1000 / 30) return;
    if (!needsRender && now > settleUntil && !library.moving && !pickup?.moving && (reducedMotion.matches || !pickup?.held)) { lastFrameTime = now; return; }
    lastFrameTime = now;
    needsRender = false;
    time += delta;
    advanceVisibleFrame(delta, step => library.advance(step, reducedMotion.matches));
    const isMobile = width < 680;
    const intro = reducedMotion.matches ? 1 : 1 - Math.pow(1 - Math.min(time / 2.8, 1), 4);
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const screenFitZ = Math.max(5.84 / (2 * tangent * camera.aspect * .97), 3.38 / (2 * tangent * .94)) - .35;
    const baseZ = isMobile ? Math.max(15.3, screenFitZ + 1.4) : Math.max(12.4, screenFitZ + 1.4);
    const roomZ = screenFitZ;
    const stagingZ = roomCameraZ(camera.aspect, camera.fov, true);
    const normalZ = library.transporting ? stagingZ : focused ? roomZ : baseZ + (1 - intro) * 1.0;
    const tvZ = tvCameraZ(camera.aspect, camera.fov);
    const zoom = !focused || !library.transporting ? 0 : reducedMotion.matches ? (library.zoom > 0 ? 1 : 0) : library.zoom;
    const targetZ = THREE.MathUtils.lerp(normalZ, tvZ, zoom);
    const motion = reducedMotion.matches || focused || library.transporting ? 0 : 1;
    // Resize is a reframe, not a camera flight. Apply its layout and camera in
    // the same rendered frame so foreground cases never cross the near plane.
    const ease = reducedMotion.matches || viewportChanged ? 1 : 1 - Math.exp(-delta * 5);
    viewportChanged = false;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointerX * 0.18 * motion, ease);
    const roomTargetY = isMobile ? 3.10 : 2.55;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, (focused || library.transporting ? 3.66 : roomTargetY + 0.05) - pointerY * 0.05 * motion, ease);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, ease);
    lookTarget.y = THREE.MathUtils.lerp(lookTarget.y, focused || library.transporting ? 3.65 : roomTargetY, ease);
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld();
    // Focus changes camera framing; the room geometry remains in both views.
    container.dataset.roomVisible = "true";
    projectPowerTarget(!focused);
    library.draw(width, height, stagingZ);
    screenElement.style.setProperty("--disc-boot", library.bootProgress.toFixed(5));
    pickup?.update(delta, time, pointerX, pointerY);
    room.accentLights.forEach((light) => {
      // Room fixtures stay quiet; the selected software provides the tint.
      const screenTint = light.userData.screenTint as THREE.Color | undefined;
      const target = screenTint ?? new THREE.Color();
      light.userData.screenTint = target;
      if (library.accent) target.set(library.accent);
      else target.copy(accentTarget);
      target.lerp(new THREE.Color("#d4c6b0"), .82);
      light.color.lerp(target, ease);
      light.intensity = light.userData.baseIntensity as number;
    });
    room.warmLights.forEach((light) => light.color.lerp(warm ? warmColor : coolColor, ease));
    key.color.lerp(warm ? warmColor : coolColor, ease);
    (scene.background as THREE.Color).lerp(warm ? warmBackground : coolBackground, ease);
    room.animatedObjects.forEach((object, i) => {
      if (!reducedMotion.matches) object.rotation.z = Math.sin(time * 0.45 + i * 0.8) * 0.009;
    });
    mixers.forEach((mixer) => mixer.update(delta));
    try {
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
      physical.render();
    } catch (error) {
      void renderer.setAnimationLoop(null);
      callbacks.onError(`Graphics rendering stopped. ${error instanceof Error ? error.message : "Please reload the lounge."}`);
      return;
    }
    if (frameCount++ === 2) {
      const backend = renderer.backend as unknown as { isWebGPUBackend?: boolean };
      callbacks.onReady(backend.isWebGPUBackend ? "WebGPU" : "WebGL 2");
    }
  });

  return {
    setAccent(color) { accentTarget.set(color); invalidate(); },
    setLighting(value) { warm = value; invalidate(); },
    setFocus(value) {
      focused = value;
      physical.setEnabled(interactive && !focused && !library.transporting);
      pickup?.setEnabled(interactive && !focused && !library.transporting);
      invalidate();
    },
    setInteractive(value) {
      interactive = value;
      library.setEnabled(value);
      pickup?.setEnabled(value && !focused && !library.transporting);
      physical.setEnabled(value && !focused && !library.transporting);
      invalidate();
    },
    openDomainLibrary() { return library.open(); },
    launchDomain(index) { return library.launch(index); },
    exitDomain() { library.exit(); },
    focusDomainCase() { library.focusChoice(); },
    focusDiscShelf() { library.focusShelf(); },
    dispose() {
      disposed = true;
      void renderer.setAnimationLoop(null);
      observer.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      powerTarget.removeEventListener("click", callbacks.onConsolePower);
      powerTarget.remove();
      container.removeEventListener("click", powerClick);
      window.removeEventListener("ocs:controller-action", domainControl, true);
      reducedMotion.removeEventListener("change", invalidate);
      pickup?.dispose();
      physical.dispose();
      room.disposeArtwork();
      library.dispose();
      mixers.forEach((mixer) => mixer.stopAllAction());
      disposeObject(scene);
      environmentTarget?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cssRenderer.domElement.remove();
      models.length = 0;
    },
  };
}

function disposeObject(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material: THREE.Material) => {
      materials.add(material);
      Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
    });
  });
  textures.forEach((texture) => { texture.dispose(); });
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
