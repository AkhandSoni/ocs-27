import * as THREE from "three";
import { GAMES } from "./game-catalog.ts";
import { paintPackage, type PackageCanvas } from "./domain-package-art.ts";
import { DOMAIN_SHELF_INDICES } from "./domain-sequence.ts";
import { GAME_CASE, GAME_CASE_SHELL, CASE_CENTER_Y } from "./game-case.ts";

export const SHELF_TITLES = Array.from({ length: 36 }, (_, index) => GAMES[index % GAMES.length].title);
export const COLLECTION_BOUNDS = { min: [-2.02, 1.45, -.43], max: [3.42, 2.30, .48] } as const;

/** Atlas-backed cases keep a large physical collection inexpensive to render. */
export function buildGameCollection(parent: THREE.Object3D, invalidate = () => {}) {
  const group = new THREE.Group(); group.name = "Physical game collection"; parent.add(group);
  const shell = new THREE.MeshStandardMaterial(GAME_CASE_SHELL);
  const inset = new THREE.MeshStandardMaterial({ color: "#15416b", roughness: .4 });
  const atlas = document.createElement("canvas"); atlas.width = 64 * SHELF_TITLES.length; atlas.height = 768;
  const ctx = atlas.getContext("2d")!;
  const colors = ["#24373d", "#b8a87a", "#7c2534", "#d8c4a0", "#354d48", "#182c4c", "#d5ae5d", "#292d31"];
  SHELF_TITLES.forEach((title, i) => {
    const x = i * 64;
    ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(x, 0, 64, 768);
    ctx.fillStyle = "#e4e5de"; ctx.fillRect(x + 5, 8, 54, 72);
    ctx.fillStyle = "#172132"; ctx.font = "bold 27px Arial"; ctx.textAlign = "center"; ctx.fillText("ACM", x + 32, 56);
    ctx.save(); ctx.translate(x + 36, 419); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = [1, 3, 6].includes(i % colors.length) ? "#17212b" : "#f0eee4";
    ctx.font = "bold 26px Arial"; ctx.fillText(title, 0, 0, 565); ctx.restore();
    ctx.fillStyle = "#e9e8df"; ctx.fillRect(x + 16, 711, 32, 20);
    ctx.fillStyle = "#1f639a"; ctx.fillRect(x, 0, 5, 768); ctx.fillRect(x + 59, 0, 5, 768);
    ctx.fillStyle = "#ffffff20"; ctx.fillRect(x + 5, 0, 2, 768);
  });
  const map = canvasTexture(atlas);
  const labelMaterial = new THREE.MeshStandardMaterial({ map, roughness: .47 });
  const count = SHELF_TITLES.length;
  const ordinary = count - DOMAIN_SHELF_INDICES.length;
  const cases = new THREE.InstancedMesh(new THREE.BoxGeometry(GAME_CASE.depth, GAME_CASE.height, GAME_CASE.width), shell, ordinary);
  const seams = new THREE.InstancedMesh(new THREE.BoxGeometry(.052, .582, .007), inset, ordinary);
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const placement = new THREE.Object3D();
  let instance = 0;
  for (let i = 0; i < count; i++) {
    if (DOMAIN_SHELF_INDICES.some(index => index === i)) continue;
    const x = -.95 + i * .074;
    const y = CASE_CENTER_Y;
    placement.position.set(x, y, .13); placement.updateMatrix(); cases.setMatrixAt(instance, placement.matrix);
    placement.position.z = .363; placement.updateMatrix(); seams.setMatrixAt(instance++, placement.matrix);
    const v = positions.length / 3;
    positions.push(x - .026, y - .289, .367, x + .026, y - .289, .367, x + .026, y + .289, .367, x - .026, y + .289, .367);
    uvs.push(i / count, 0, (i + 1) / count, 0, (i + 1) / count, 1, i / count, 1);
    indices.push(v, v + 1, v + 2, v, v + 2, v + 3);
  }
  cases.name = "Full-height Blu-ray game cases";
  cases.castShadow = cases.receiveShadow = true; seams.receiveShadow = true; group.add(cases, seams);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, labelMaterial));

  const printedCovers = new Map<string, THREE.CanvasTexture>();
  const artwork: PackageCanvas[] = [];
  function caseModel(gameIndex: number, printed = true) {
    const height = GAME_CASE.height;
    const game = GAMES[gameIndex % GAMES.length];
    const root = new THREE.Group(); root.name = `${game.title} boxed game`;
    const body = new THREE.Mesh(new THREE.BoxGeometry(GAME_CASE.width, height, GAME_CASE.depth), shell); root.add(body);
    if (!printed) { body.castShadow = body.receiveShadow = true; return root; }
    let coverMap = printedCovers.get(game.id);
    if (!coverMap) {
      let map: THREE.CanvasTexture;
      const cover = paintPackage(gameIndex % GAMES.length, false, () => {
        map.needsUpdate = true;
        invalidate();
      });
      artwork.push(cover);
      map = canvasTexture(cover);
      coverMap = map;
      printedCovers.set(game.id, map);
    }
    const art = new THREE.Mesh(new THREE.PlaneGeometry(.435, height - .025), new THREE.MeshStandardMaterial({ map: coverMap, roughness: .35 }));
    art.position.z = GAME_CASE.depth / 2 + .0005; root.add(art);
    root.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    return root;
  }
  // Staggered jewel boxes, open blue edges and actual printed artwork on the top.
  for (const [x, z, n, first] of [[-1.66, .12, 5, 2], [-1.82, -.27, 4, 5], [2.66, .11, 5, 8], [3.10, -.24, 4, 10]]) {
    for (let i = 0; i < n; i++) {
      const box = caseModel(first + i, i === n - 1);
      box.rotation.set(-Math.PI / 2, 0, Math.sin(i * 8 + x) * .045);
      box.position.set(x + Math.sin(i * 4) * .022, GAME_CASE.baseY + GAME_CASE.depth / 2 + i * .069, z);
      group.add(box);
    }
  }

  const paperCanvas = document.createElement("canvas"); paperCanvas.width = paperCanvas.height = 512;
  const ink = paperCanvas.getContext("2d")!;
  const paper = ink.createLinearGradient(0, 0, 80, 512); paper.addColorStop(0, "#e5c970"); paper.addColorStop(.16, "#f4e29c"); paper.addColorStop(1, "#e8cd7c");
  ink.fillStyle = paper; ink.fillRect(0, 0, 512, 512);
  ink.fillStyle = "#9d853411"; ink.fillRect(0, 0, 512, 54);
  ink.translate(256, 245); ink.rotate(-.025); ink.fillStyle = "#29291e"; ink.textAlign = "center";
  ink.font = 'bold 94px "Comic Sans MS", cursive'; ink.fillText("Domains", 0, 0, 450);
  ink.strokeStyle = "#424333bb"; ink.lineWidth = 3; ink.lineCap = "round";
  ink.beginPath(); ink.moveTo(-115, 22); ink.quadraticCurveTo(-4, 32, 115, 20); ink.stroke();
  ink.beginPath(); ink.moveTo(10, 56); ink.quadraticCurveTo(51, 72, 30, 119); ink.lineTo(16, 102); ink.moveTo(30, 119); ink.lineTo(50, 108); ink.stroke();
  const paperGeometry = new THREE.PlaneGeometry(.70, .46, 12, 12);
  const vertices = paperGeometry.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const curl = Math.pow(Math.max(0, -vertices.getY(i) / .46 + .20), 3);
    vertices.setZ(i, curl * .11 + Math.pow(vertices.getX(i) / .70, 2) * .008);
  }
  paperGeometry.computeVertexNormals();
  const paperMap = canvasTexture(paperCanvas);
  const stickyNote = new THREE.Mesh(paperGeometry, new THREE.MeshStandardMaterial({ map: paperMap, emissiveMap: paperMap, emissive: "#fff2bd", emissiveIntensity: .23, side: THREE.DoubleSide, roughness: .95 }));
  stickyNote.name = "Handwritten Domains sticky note"; stickyNote.position.set(.40, 1.83, .395); stickyNote.rotation.set(-.025, -.035, -.07);
  stickyNote.castShadow = true; stickyNote.receiveShadow = false; group.add(stickyNote);
  return { stickyNote, disposeArtwork() { artwork.forEach(canvas => canvas.disposeArtwork?.()); } };
}

function canvasTexture(canvas: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; return map;
}
