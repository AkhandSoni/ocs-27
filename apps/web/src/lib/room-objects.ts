import * as THREE from 'three';
import { buildGameCollection } from './game-collection';

type RoomObjects = {
  accentLights: THREE.PointLight[];
  warmLights: THREE.PointLight[];
  animatedObjects: THREE.Object3D[];
  stickyNote: THREE.Object3D;
};

const UP = new THREE.Vector3(0, 1, 0);

/** Everything around the interactive screen and the two imported devices. */
export function buildRoom(scene: THREE.Scene, woodTexture: THREE.Texture): RoomObjects {
  const room = new THREE.Group();
  room.name = 'The after-hours room';
  scene.add(room);

  const accentLights: THREE.PointLight[] = [];
  const warmLights: THREE.PointLight[] = [];
  const animatedObjects: THREE.Object3D[] = [];
  // The caller awaits the image before cloning. Texture.clone() marks the copy
  // for upload immediately, and the WebGPU backend requires a non-null image.
  const walnut = woodTexture;
  walnut.colorSpace = THREE.SRGBColorSpace;
  walnut.wrapS = walnut.wrapT = THREE.RepeatWrapping;
  walnut.anisotropy = 8;
  const cabinetMap = walnut.clone();
  cabinetMap.center.set(0.5, 0.5);
  cabinetMap.rotation = Math.PI / 2;
  const floorMap = walnut.clone();
  floorMap.center.set(0.5, 0.5);
  floorMap.rotation = Math.PI / 2;
  floorMap.repeat.set(0.7, 1.9);
  const slatMap = walnut.clone();
  slatMap.repeat.set(0.12, 2.8);

  const material = (color: THREE.ColorRepresentation, roughness = 0.75, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const wall = material('#5d5a54', 0.96);
  const recess = material('#1c1d1b', 0.98);
  const charcoal = material('#222321', 0.72);
  const softBlack = material('#101311', 0.85);
  const brass = material('#8c7958', 0.44, 0.64);
  const cabinetWood = new THREE.MeshStandardMaterial({
    color: '#e4c09b', map: cabinetMap, bumpMap: cabinetMap, bumpScale: .006, roughness: .58,
  });
  const slatWood = new THREE.MeshStandardMaterial({
    color: '#8a7056', map: slatMap, roughness: 0.82,
  });

  function box(
    width: number, height: number, depth: number,
    surface: THREE.Material, x: number, y: number, z: number,
    parent: THREE.Object3D = room,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), surface);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function roundedBox(
    width: number, height: number, depth: number, radius: number,
    surface: THREE.Material, x: number, y: number, z: number,
    parent: THREE.Object3D = room,
  ) {
    const w = width / 2;
    const h = height / 2;
    const r = Math.min(radius, w, h);
    const shape = new THREE.Shape();
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth - 0.012, bevelEnabled: true, bevelThickness: 0.006,
      bevelSize: 0.006, bevelSegments: 2, curveSegments: 5, steps: 1,
    });
    geometry.translate(0, 0, -depth / 2 + 0.006);
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(
    top: number, bottom: number, height: number, surface: THREE.Material,
    x: number, y: number, z: number, parent: THREE.Object3D = room, sides = 28,
  ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), surface);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function emissive(color: string, intensity: number) {
    return new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: intensity, roughness: 0.55,
      toneMapped: false,
    });
  }

  function point(
    color: string, intensity: number, distance: number,
    x: number, y: number, z: number, kind: 'accent' | 'warm',
  ) {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(x, y, z);
    light.userData.baseIntensity = intensity;
    light.userData.kind = kind;
    light.userData.baseColor = color;
    room.add(light);
    (kind === 'accent' ? accentLights : warmLights).push(light);
    return light;
  }

  // The small reveals keep the wall calm while giving grazing light something to catch.
  box(14.6, 7.1, 0.28, wall, 0, 3.5, -0.99);
  for (const x of [-5.12, -2.95, 0, 2.95, 5.12]) {
    box(0.012, 6.82, 0.008, recess, x, 3.43, -0.843);
  }
  box(14.5, 0.105, 0.065, material('#242623'), 0, 0.06, -0.79);
  box(14.6, 0.18, 4.0, material('#363532', 0.97), 0, 7.07, 1.0);
  box(14.4, 0.08, 0.15, material('#43403a'), 0, 6.84, -0.68);
  box(10.3, 0.018, 0.022, emissive('#e5c799', 1.3), 0, 6.80, -0.66);
  point('#f1ce96', 14, 8, -3.8, 6.55, -0.4, 'warm');
  point('#f1ce96', 14, 8, 3.8, 6.55, -0.4, 'warm');

  // Deep, narrow walnut battens sit in front of a nearly black acoustic backing.
  for (const side of [-1, 1]) {
    box(1.92, 6.85, 0.08, recess, side * 6.15, 3.46, -0.79);
  }
  const battens = new THREE.InstancedMesh(new THREE.BoxGeometry(0.065, 6.79, 0.105), slatWood, 36);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 36; i++) {
    const side = i < 18 ? -1 : 1;
    transform.position.set(side * (5.22 + (i % 18) * 0.106), 3.45, -0.70);
    transform.updateMatrix();
    battens.setMatrixAt(i, transform.matrix);
  }
  battens.castShadow = battens.receiveShadow = true;
  room.add(battens);

  // Individual boards make the floor read as wood even under soft, low light.
  box(22, 0.12, 20, material('#171814'), 0, -0.105, 5.0);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: '#776149', map: floorMap, bumpMap: floorMap, bumpScale: .008, roughness: .64, metalness: .02,
  });
  const boards = new THREE.InstancedMesh(new THREE.BoxGeometry(3.38, 0.065, 1.12), floorMaterial, 126);
  let boardIndex = 0;
  for (let x = 0; x < 7; x++) {
    for (let z = 0; z < 18; z++) {
      transform.position.set((x - 3) * 3.395 + (z % 2) * 1.6975, -0.035, -1.9 + z * 1.135);
      transform.updateMatrix();
      boards.setMatrixAt(boardIndex, transform.matrix);
      boards.setColorAt(boardIndex++, new THREE.Color().setHSL(0.085, 0.1, 0.82 + seeded(x * 29 + z * 17) * 0.17));
    }
  }
  boards.receiveShadow = true;
  room.add(boards);

  // Continuous black framing surrounds three horizontally book-matched walnut doors.
  box(10.5, 0.89, 0.94, softBlack, 0, 0.94, -0.20);
  roundedBox(10.56, 0.105, 1.04, 0.018, charcoal, 0, 1.3975, -0.20);
  box(10.39, 0.018, 0.99, cabinetWood, 0, 1.441, -0.20);
  box(10.48, 0.085, 0.96, softBlack, 0, 0.4725, -0.20);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 2.34;
    const door = roundedBox(2.305, 0.785, 0.055, 0.008, cabinetWood, x, 0.928, 0.292);
    const positions = door.geometry.getAttribute('position');
    const uv = door.geometry.getAttribute('uv');
    for (let vertex = 0; vertex < positions.count; vertex++) {
      uv.setXY(vertex, (positions.getX(vertex) + x + 3.5) / 7, (positions.getY(vertex) + 0.4) / 0.8);
    }
    uv.needsUpdate = true;
    box(0.29, 0.014, 0.022, softBlack, x, 1.278, 0.331);
  }
  for (const side of [-1, 1]) {
    roundedBox(1.66, 0.785, 0.055, 0.008, material('#171c1a', 0.8), side * 4.365, 0.928, 0.292);
    box(0.025, 0.785, 0.03, softBlack, side * 3.51, 0.928, 0.32);
  }
  for (const x of [-4.75, -1.5, 1.5, 4.75]) {
    for (const z of [-0.53, 0.12]) {
      box(0.055, 0.395, 0.055, softBlack, x, 0.23, z);
    }
  }
  const underCabinet = box(10.16, 0.024, 0.03, emissive('#ffd06d', 2.4), 0, 0.431, 0.15);
  underCabinet.userData.lightGroup = 'warm';
  for (const x of [-3.55, 0, 3.55]) {
    const light = point('#ffc777', 10, 4.8, x, 0.32, 0.1, 'warm');
    light.userData.kind = 'cabinet-gold';
  }

  // Reflected screen bias light is hidden behind the imported television.
  box(2.65, 0.028, 0.018, emissive('#5688ee', 1.2), -1.34, 5.14, -0.775);
  box(2.65, 0.028, 0.018, emissive('#db79cf', 1.2), 1.34, 5.14, -0.775);
  box(0.024, 2.78, 0.018, emissive('#508dff', 1.4), -2.73, 3.64, -0.775);
  box(0.024, 2.78, 0.018, emissive('#f085df', 1.4), 2.73, 3.64, -0.775);
  const leftBias = point('#568cff', 13, 4.3, -2.5, 4.15, -0.67, 'accent');
  leftBias.userData.kind = 'screen-left';
  const rightBias = point('#f08bd5', 13, 4.3, 2.5, 4.15, -0.67, 'accent');
  rightBias.userData.kind = 'screen-right';

  // A quiet fabric soundbar, with feet, a metal reveal and an understated status LED.
  const soundbar = roundedBox(3.5, 0.185, 0.22, 0.075, material('#181b1a', 0.96), 0, 1.78, -0.33);
  soundbar.name = 'Woven fabric soundbar';
  box(3.20, 0.012, 0.005, material('#343633', 0.83), 0, 1.703, -0.215);
  for (const x of [-1.30, 1.30]) box(0.08, 0.2, 0.12, softBlack, x, 1.565, -0.34);
  const grille = new THREE.InstancedMesh(new THREE.BoxGeometry(0.003, 0.107, 0.002), material('#393b37', 0.98), 100);
  for (let i = 0; i < 100; i++) {
    transform.position.set(-1.58 + i * 0.032, 1.785, -0.215);
    transform.updateMatrix();
    grille.setMatrixAt(i, transform.matrix);
  }
  room.add(grille);
  box(0.027, 0.004, 0.003, emissive('#c6ddca', 0.7), 1.50, 1.742, -0.212);

  addArt(-4.67, 4.94, 0.88, 1.25, 0, 'cascade-dawn');
  addArt(-3.57, 5.08, 1.03, 0.88, 1, 'golden-pines');
  addArt(-4.11, 3.49, 1.65, 1.04, 2, 'forest-mist');
  addArt(3.61, 5.01, 1.15, 0.98, 3, 'smoky-mountains');
  addArt(4.71, 4.70, 0.80, 1.43, 0, 'coastal-falls');
  addArt(3.85, 3.45, 1.45, 0.97, 1, 'ocean-dusk');

  function addArt(x: number, y: number, width: number, height: number, variation: number, photo: string) {
    const frame = new THREE.Group();
    frame.name = `Framed landscape photograph — ${photo}`;
    room.add(frame);
    box(width, height, 0.065, material(variation % 2 ? '#75634b' : '#18201c', 0.62), x, y, -0.765, frame);
    box(width - 0.066, height - 0.066, 0.009, material('#e0d9c8', 0.98), x, y, -0.727, frame);
    // Always start with a real canvas: the WebGPU backend can compile while JPEGs load.
    const canvas = paintArtwork(variation);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const image = new Image();
    image.onload = () => {
      const context = canvas.getContext('2d');
      if (!context) return;
      const aspect = (width - 0.18) / (height - 0.18);
      const sourceAspect = image.naturalWidth / image.naturalHeight;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;
      if (sourceAspect > aspect) sourceWidth = sourceHeight * aspect;
      else sourceHeight = sourceWidth / aspect;
      context.drawImage(image, (image.naturalWidth - sourceWidth) / 2, (image.naturalHeight - sourceHeight) / 2,
        sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      texture.needsUpdate = true;
    };
    image.src = `/art/${photo}.jpg`;
    const print = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.18, height - 0.18),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 }),
    );
    print.position.set(x, y, -0.72);
    frame.add(print);
  }

  const soilMaterial = material('#211e17', 1);
  const plantStem = material('#535741', 0.88);
  const trunkMaterial = material('#5b4b37', 0.96);
  const leafSurface = document.createElement('canvas');
  leafSurface.width = leafSurface.height = 128;
  const leafContext = leafSurface.getContext('2d')!;
  leafContext.fillStyle = '#838383'; leafContext.fillRect(0, 0, 128, 128);
  leafContext.strokeStyle = '#ababab'; leafContext.lineWidth = 1;
  leafContext.beginPath(); leafContext.moveTo(64, 0); leafContext.lineTo(64, 128);
  for (let y = 17; y < 128; y += 17) {
    leafContext.moveTo(64, y); leafContext.quadraticCurveTo(37, y - 10, 8, y - 22);
    leafContext.moveTo(64, y); leafContext.quadraticCurveTo(91, y - 10, 120, y - 22);
  }
  leafContext.stroke();
  const leafBump = new THREE.CanvasTexture(leafSurface);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: '#718565', side: THREE.DoubleSide, bumpMap: leafBump, bumpScale: .002, roughness: .57, metalness: 0,
  });
  const leafGeometry = makeLeafGeometry();

  function pot(x: number, y: number, z: number, radius: number, height: number, parent: THREE.Object3D = room) {
    const ceramic = material('#484b40', .54);
    const profile = [[0, .025], [.73, .025], [.79, .08], [.94, .88], [1, .96],
      [.99, 1], [.92, 1], [.89, .94], [.76, .19], [0, .19]];
    const vessel = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r * radius, h * height)), 48), ceramic);
    vessel.position.set(x, y, z); vessel.castShadow = vessel.receiveShadow = true; parent.add(vessel);
    // Soil sits inside a curved rim, rather than capping the planter on top.
    cylinder(radius * .875, radius * .875, .008, soilMaterial, x, y + height * .91, z, parent, 28);
    cylinder(radius * 0.79, radius * 0.79, 0.025, material('#22271f', 0.88), x, y + 0.01, z, parent, 32);
  }

  function branchInstances(
    segments: Array<{ a: THREE.Vector3; b: THREE.Vector3; radius: number }>,
    surface: THREE.Material, parent: THREE.Object3D,
  ) {
    const branches = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.72, 1, 1, 6), surface, segments.length);
    segments.forEach(({ a, b, radius }, i) => {
      transform.position.copy(a).add(b).multiplyScalar(0.5);
      transform.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
      transform.scale.set(radius, a.distanceTo(b), radius);
      transform.updateMatrix();
      branches.setMatrixAt(i, transform.matrix);
    });
    transform.scale.set(1, 1, 1);
    transform.quaternion.identity();
    branches.castShadow = true;
    parent.add(branches);
  }

  function leaves(
    samples: Array<{ base: THREE.Vector3; direction: THREE.Vector3; length: number; width?: number; shade: number }>,
    parent: THREE.Object3D,
  ) {
    const foliage = new THREE.InstancedMesh(leafGeometry, leafMaterial, samples.length);
    samples.forEach(({ base, direction, length, width, shade }, i) => {
      transform.position.copy(base);
      transform.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
      transform.scale.set(length * (width ?? 1), length, length);
      transform.updateMatrix();
      foliage.setMatrixAt(i, transform.matrix);
      foliage.setColorAt(i, new THREE.Color().setHSL(0.23 + shade * 0.065, 0.18 + shade * 0.15, 0.44 + shade * 0.23));
    });
    transform.scale.set(1, 1, 1);
    transform.quaternion.identity();
    foliage.castShadow = foliage.receiveShadow = true;
    parent.add(foliage);
    return foliage;
  }

  function floorPlant(x: number, z: number, seed: number) {
    const plant = new THREE.Group();
    plant.name = 'Lush areca palm in charcoal ceramic';
    plant.position.set(x, 0, z);
    room.add(plant);
    pot(0, 0, 0, 0.40, 0.62, plant);
    const crown = new THREE.Group();
    plant.add(crown);
    crown.userData.plant = true;
    crown.userData.restRotation = 0;
    animatedObjects.push(crown);
    const stems: Array<{ a: THREE.Vector3; b: THREE.Vector3; radius: number }> = [];
    const blades: Array<{ base: THREE.Vector3; direction: THREE.Vector3; length: number; width?: number; shade: number }> = [];
    for (let frond = 0; frond < 13; frond++) {
      const angle = frond * 2.39996 + seed;
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const lateral = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
      const height = 1.85 + seeded(seed + frond * 9) * 0.50;
      const reach = 0.70 + seeded(seed + frond * 3) * 0.48;
      const base = new THREE.Vector3(radial.x * 0.12, 0.61, radial.z * 0.12);
      const top = new THREE.Vector3(radial.x * 0.16, height, radial.z * 0.16);
      stems.push({ a: base, b: top, radius: 0.012 + seeded(frond + seed) * 0.007 });
      const path = new THREE.QuadraticBezierCurve3(
        top,
        new THREE.Vector3(radial.x * reach * 0.52, height + 0.79, radial.z * reach * 0.52),
        new THREE.Vector3(radial.x * reach, height + 0.13, radial.z * reach),
      );
      for (let i = 0; i < 22; i++) {
        const t = i / 22;
        const a = path.getPoint(t);
        const b = path.getPoint((i + 1) / 22);
        stems.push({ a, b, radius: 0.009 * (1 - t * 0.75) });
        if (i < 2) continue;
        for (const side of [-1, 1]) {
          const length = (0.17 + Math.sin(t * Math.PI) * 0.37) * (0.88 + seeded(frond * 23 + i + seed) * 0.23);
          const direction = lateral.clone().multiplyScalar(side * 0.9)
            .addScaledVector(radial, 0.35 + t * 0.35);
          direction.y = 0.07 - t * 0.42;
          blades.push({
            base: a.clone().addScaledVector(radial, side * 0.009), direction,
            length, width: 0.32, shade: seeded(seed + frond * 43 + i * 3 + side),
          });
        }
      }
    }
    branchInstances(stems, plantStem, crown);
    leaves(blades, crown);
  }

  floorPlant(-6.03, 0.35, 43);
  floorPlant(6.03, 0.42, 78);

  // The little pothos spills over the far end, leaving the console's silhouette clear.
  pot(-5.00, 1.45, -0.07, 0.17, 0.22);
  const trailing = new THREE.Group();
  trailing.name = 'Trailing pothos';
  room.add(trailing);
  const trailingLeaves: Array<{ base: THREE.Vector3; direction: THREE.Vector3; length: number; width?: number; shade: number }> = [];
  for (let vine = 0; vine < 5; vine++) {
    const start = new THREE.Vector3(-5.0, 1.67, -0.07);
    const end = new THREE.Vector3(-5.19 - vine * 0.018, 0.62 + vine * 0.10, 0.31 + vine * 0.016);
    const path = new THREE.CatmullRomCurve3([
      start, new THREE.Vector3(-5.16 + vine * 0.038, 1.71, 0.19),
      new THREE.Vector3(-5.28 + vine * 0.035, 1.38, 0.36), end,
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(path, 15, 0.006, 4, false), plantStem);
    trailing.add(stem);
    for (let i = 0; i < 12; i++) {
      const fraction = i / 12;
      const base = path.getPoint(fraction);
      const theta = i * 2.45 + vine;
      trailingLeaves.push({
        base, direction: new THREE.Vector3(Math.cos(theta), 0.30, Math.sin(theta)),
        length: 0.16 + seeded(i + vine * 8) * 0.10, width: 1.4, shade: seeded(i * 9 + vine),
      });
    }
  }
  leaves(trailingLeaves, trailing);

  // A tiny sculptural tree balances the much larger foliage at the edges of the room.
  const bonsai = new THREE.Group();
  bonsai.name = 'Small olive tree';
  bonsai.position.set(3.30, 1.45, -0.02);
  room.add(bonsai);
  const bonsaiCeramic = material('#b7aa8f', 0.91);
  cylinder(0.21, 0.16, 0.18, bonsaiCeramic, 0, 0.09, 0, bonsai, 32);
  cylinder(0.2, 0.2, 0.012, soilMaterial, 0, 0.183, 0, bonsai, 28);
  const bonsaiBranches: Array<{ a: THREE.Vector3; b: THREE.Vector3; radius: number }> = [
    { a: new THREE.Vector3(0, 0.18, 0), b: new THREE.Vector3(-0.06, 0.53, 0), radius: 0.024 },
    { a: new THREE.Vector3(-0.06, 0.53, 0), b: new THREE.Vector3(0.07, 0.86, 0.015), radius: 0.015 },
  ];
  const oliveLeaves: Array<{ base: THREE.Vector3; direction: THREE.Vector3; length: number; width?: number; shade: number }> = [];
  for (let branch = 0; branch < 7; branch++) {
    const angle = branch * 2.4;
    const a = new THREE.Vector3(-0.01, 0.43 + branch * 0.055, 0);
    const b = new THREE.Vector3(Math.cos(angle) * 0.23, 0.64 + branch * 0.036, Math.sin(angle) * 0.17);
    bonsaiBranches.push({ a, b, radius: 0.006 });
    for (let i = 0; i < 12; i++) {
      const angle2 = i * 2.4 + branch;
      oliveLeaves.push({
        base: b.clone().add(new THREE.Vector3(Math.cos(angle2) * 0.08, (i / 12 - 0.5) * 0.18, Math.sin(angle2) * 0.07)),
        direction: new THREE.Vector3(Math.cos(angle2), 0.4, Math.sin(angle2)),
        length: 0.12 + seeded(i * 7 + branch) * 0.065, width: 0.65, shade: seeded(i * 3 + branch * 8),
      });
    }
  }
  branchInstances(bonsaiBranches, trunkMaterial, bonsai);
  leaves(oliveLeaves, bonsai);

  // A warm opal-glass globe is the room's only conspicuously luminous object.
  cylinder(0.18, 0.19, 0.07, material('#39392f', 0.7), 4.50, 1.485, 0.0);
  cylinder(0.065, 0.065, 0.22, brass, 4.50, 1.62, 0.0, room, 24);
  const opal = new THREE.MeshStandardMaterial({
    color: '#fff0d2', emissive: '#ffdb9d', emissiveIntensity: 0.85,
    roughness: 0.4, metalness: 0, toneMapped: false,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.265, 36, 28), opal);
  globe.position.set(4.50, 1.965, 0.0);
  globe.name = 'Warm opal table lamp';
  globe.userData.lightGroup = 'warm';
  room.add(globe);
  point('#ffd49a', 13, 5.5, 4.50, 2.00, 0.22, 'warm');
  const cord = new THREE.CatmullRomCurve3([
    new THREE.Vector3(4.55, 1.46, -0.03), new THREE.Vector3(4.73, 1.465, -0.23),
    new THREE.Vector3(4.55, 1.465, -0.6), new THREE.Vector3(4.55, 1.0, -0.66),
  ]);
  room.add(new THREE.Mesh(new THREE.TubeGeometry(cord, 18, 0.007, 4, false), softBlack));

  const { stickyNote } = buildGameCollection(room);

  // One compact hi-fi speaker, inset drivers and a few cloth-bound books.
  roundedBox(0.40, 0.54, 0.35, 0.025, material('#33352f', 0.88), -4.50, 1.88, -0.02);
  const driverMaterial = material('#151a17', 0.85);
  const driver = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), driverMaterial);
  driver.position.set(-4.50, 1.82, 0.162);
  room.add(driver);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.123, 0.009, 7, 32), material('#5b5d50', 0.7));
  ring.position.copy(driver.position);
  room.add(ring);
  const tweeter = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 12), softBlack);
  tweeter.scale.z = 0.32;
  tweeter.position.set(-4.50, 2.04, 0.16);
  room.add(tweeter);
  for (let i = 0; i < 3; i++) {
    const surface = material(['#c3b9a0', '#6d6f5d', '#9c6f50'][i]);
    box(0.48 + i * 0.02, 0.055, 0.31, surface, -4.52, 1.48 + i * 0.058, -0.1);
    box(0.40, 0.035, 0.313, material('#cfc6b2', 0.99), -4.52, 1.48 + i * 0.058, -0.097);
  }

  return { accentLights, warmLights, animatedObjects, stickyNote };
}

function seeded(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/** A gently cupped leaf catches light from both the window and the practical lamp. */
function makeLeafGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const width = Math.pow(Math.sin(Math.PI * t), 0.8) * 0.23;
    const bow = Math.sin(Math.PI * t) * 0.09;
    positions.push(-width, t, bow - width * 0.2, 0, t, bow + 0.035 * Math.sin(Math.PI * t), width, t, bow - width * 0.2);
    uvs.push(0, t, 0.5, t, 1, t);
    if (i < steps) {
      const a = i * 3;
      indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      indices.push(a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function paintArtwork(variation: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const palettes = [
    ['#cec2a4', '#b49066', '#777e66', '#414f43', '#243d35'],
    ['#c4b39a', '#b48666', '#a05f46', '#666e59', '#36483b'],
    ['#c4c2ae', '#bc9a70', '#85866d', '#556853', '#384c41'],
    ['#d0c0a0', '#ac8b60', '#b06a48', '#677159', '#3b5243'],
  ];
  const palette = palettes[variation % palettes.length];
  context.fillStyle = palette[0];
  context.fillRect(0, 0, 512, 512);
  context.fillStyle = palette[1];
  context.beginPath();
  context.arc(variation % 2 ? 326 : 166, 160, variation % 2 ? 72 : 60, 0, Math.PI * 2);
  context.fill();
  for (let layer = 0; layer < 3; layer++) {
    context.fillStyle = palette[layer + 2];
    context.beginPath();
    context.moveTo(0, 512);
    context.lineTo(0, 235 + layer * 80);
    for (let i = 0; i <= 8; i++) {
      const x = i / 8 * 512;
      const y = 235 + layer * 76 + Math.sin(i * 0.91 + layer * 2.4 + variation) * (45 - layer * 7);
      context.lineTo(x, y);
    }
    context.lineTo(512, 512);
    context.closePath();
    context.fill();
  }
  if (variation % 2 === 1) {
    context.strokeStyle = '#d4c4a2';
    context.lineWidth = 2;
    context.globalAlpha = 0.48;
    for (let i = 0; i < 5; i++) {
      context.beginPath();
      context.moveTo(60 + i * 7, 460);
      context.bezierCurveTo(125 + i * 10, 380, 245 + i * 8, 355, 300 + i * 13, 314);
      context.stroke();
    }
    context.globalAlpha = 1;
  }
  // Paper grain prevents the prints from looking like luminous flat UI rectangles.
  for (let i = 0; i < 17000; i++) {
    context.fillStyle = i % 2 ? 'rgba(255,248,226,0.045)' : 'rgba(28,34,24,0.045)';
    context.fillRect(seeded(i * 7 + variation) * 512, seeded(i * 11 + variation * 7) * 512, 1, 1);
  }
  return canvas;
}
