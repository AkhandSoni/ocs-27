import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { buildRoom } from "./room-objects";

export type RoomController = {
  setAccent: (color: string) => void;
  setLighting: (warm: boolean) => void;
  setFocus: (focused: boolean) => void;
  dispose: () => void;
};

export type RoomCallbacks = {
  onReady: (renderer: "WebGPU" | "WebGL 2") => void;
  onError: (message: string) => void;
  onAssetError: (message: string) => void;
};

/** A single camera drives the GPU scene and the accessible, interactive TV plane. */
export async function createRoom(
  container: HTMLElement,
  screenElement: HTMLElement,
  callbacks: RoomCallbacks,
): Promise<RoomController> {
  let disposed = false;
  let focused = true;
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
  const renderer = new WebGPURenderer({ antialias: true, alpha: false, forceWebGL });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-label", "Interactive 3D gaming lounge with a PlayStation 5 and walnut furniture");
  renderer.domElement.setAttribute("role", "img");
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
  Object.assign(cssRenderer.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
  container.appendChild(cssRenderer.domElement);
  const cssScene = new THREE.Scene();
  Object.assign(screenElement.style, { width: "1280px", height: "720px", pointerEvents: "auto", backfaceVisibility: "hidden", overflow: "hidden", background: "#080a0a" });
  const tvUI = new CSS3DObject(screenElement);
  tvUI.scale.setScalar(5.64 / 1280);
  tvUI.position.set(0, 3.65, -0.352);
  cssScene.add(tvUI);

  let room: ReturnType<typeof buildRoom>;
  try {
    const walnutTexture = await new THREE.TextureLoader().loadAsync("/textures/walnut.jpg");
    room = buildRoom(scene, walnutTexture);
  } catch (error) {
    disposeObject(scene);
    renderer.dispose();
    renderer.domElement.remove();
    cssRenderer.domElement.remove();
    throw new Error(`The room textures could not load. ${error instanceof Error ? error.message : "Please try again."}`);
  }
  const ambient = new THREE.HemisphereLight("#e1ded6", "#7d593c", 1.35);
  scene.add(ambient);
  const fill = new THREE.DirectionalLight("#e9e5dc", 2.4);
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
  const black = new THREE.MeshStandardMaterial({ color: "#050606", roughness: 0.28, metalness: 0.52 });
  const tvGroup = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.84, 3.38, 0.18), black);
  body.position.set(0, 3.65, -0.48);
  body.castShadow = true;
  tvGroup.add(body);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(5.73, 3.27, 0.045), new THREE.MeshStandardMaterial({ color: "#111313", metalness: 0.75, roughness: 0.22 }));
  rim.position.set(0, 3.65, -0.377);
  tvGroup.add(rim);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.64, 3.1725), new THREE.MeshBasicMaterial({ color: "#070a0b" }));
  glass.position.set(0, 3.65, -0.351);
  tvGroup.add(glass);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshBasicMaterial({ color: "#d5e7dd" }));
  led.position.set(0.03, 1.984, -0.377);
  tvGroup.add(led);
  scene.add(tvGroup);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const models: THREE.Object3D[] = [];
  const mixers: THREE.AnimationMixer[] = [];

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
              material.envMapIntensity = 0.8;
              // Exported controller shells are opaque despite a BLEND flag.
              material.transparent = false;
              material.depthWrite = true;
              material.needsUpdate = true;
            }
          });
        }
      });
      scene.add(placement);
      models.push(placement);
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        mixers.push(mixer);
      }
    } catch (error) {
      if (!disposed) callbacks.onAssetError(`A device model could not load: ${error instanceof Error ? error.message : path}`);
    }
  }

  void Promise.all([
    addModel("/models/ps5-optimized.glb", 1.4, new THREE.Vector3(-3.65, 1.46, -0.05), new THREE.Euler(0, 0.08, 0)),
    addModel("/models/dualsense-optimized.glb", 0.51, new THREE.Vector3(-2.47, 1.45, 0.28), new THREE.Euler(-0.25, Math.PI - 0.08, 0.02)),
  ]);

  let width = 0;
  let height = 0;
  function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    renderer.setSize(width, height);
    cssRenderer.setSize(width, height);
    camera.aspect = width / height;
    // Keep the complete TV usable on narrower screens.
    camera.fov = width < 680 ? 48 : 38;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.01 });
  intersectionObserver.observe(container);
  resize();

  function onPointer(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  }
  function onVisibility() { visible = !document.hidden; }
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  const accentTarget = new THREE.Color("#d4b26e");
  const warmColor = new THREE.Color("#ffb863");
  const coolColor = new THREE.Color("#a0c6e9");
  const warmBackground = new THREE.Color("#161512");
  const coolBackground = new THREE.Color("#14191e");
  const clock = new THREE.Clock();
  const start = performance.now();
  let frameCount = 0;

  await renderer.setAnimationLoop(() => {
    if (disposed || !visible || !inView) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const time = (performance.now() - start) / 1000;
    const isMobile = width < 680;
    const intro = reducedMotion.matches ? 1 : 1 - Math.pow(1 - Math.min(time / 2.8, 1), 4);
    const screenFitZ = 5.84 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 0.9) - 0.35;
    const baseZ = isMobile ? Math.max(15.3, screenFitZ + 1.4) : Math.max(12.4, screenFitZ + 1.4);
    const targetZ = focused ? Math.max(8.0, screenFitZ) : baseZ + (1 - intro) * 1.0;
    const motion = reducedMotion.matches || focused ? 0 : 1;
    const ease = 1 - Math.exp(-delta * 3);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointerX * 0.18 * motion, ease);
    const roomTargetY = isMobile ? 3.10 : 2.55;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, (focused ? 3.66 : roomTargetY + 0.05) - pointerY * 0.05 * motion, ease);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, ease);
    lookTarget.y = THREE.MathUtils.lerp(lookTarget.y, focused ? 3.65 : roomTargetY, ease);
    camera.lookAt(lookTarget);
    room.accentLights.forEach((light, i) => {
      // Preserve the blue/pink split from the room reference; selection adds a subtle tint.
      const referenceColor = light.userData.referenceTint as THREE.Color | undefined ?? new THREE.Color(light.userData.baseColor as THREE.ColorRepresentation);
      light.userData.referenceTint = referenceColor;
      const screenTint = light.userData.screenTint as THREE.Color | undefined;
      const target = screenTint ?? new THREE.Color();
      light.userData.screenTint = target;
      target.copy(referenceColor).lerp(accentTarget, 0.18);
      light.color.lerp(target, ease);
      light.intensity = (light.userData.baseIntensity as number) * (1 + (reducedMotion.matches ? 0 : Math.sin(time * 0.7 + i) * 0.035));
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
    setAccent(color) { accentTarget.set(color); },
    setLighting(value) { warm = value; },
    setFocus(value) { focused = value; },
    dispose() {
      disposed = true;
      void renderer.setAnimationLoop(null);
      observer.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      mixers.forEach((mixer) => mixer.stopAllAction());
      disposeObject(scene);
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
