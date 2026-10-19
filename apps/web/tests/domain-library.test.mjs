import { GAME_CASE, CASE_CENTER_Y } from "../src/lib/game-case.ts";
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { createDomainLibrary } from '../src/lib/domain-library.ts';
import { CUES } from '../src/lib/domain-sequence.ts';
import { roomCameraZ, tvCameraZ } from '../src/lib/domain-spatial.ts';

function setup() {
  const dom = new JSDOM('<main><div id="room"></div></main>');
  const previousDocument = globalThis.document;
  globalThis.document = dom.window.document;
  // Canvas painting is not the subject of these DOM/Three integration tests.
  // No WebGL/browser rendering is simulated or claimed by this fixture.
  const context = new Proxy({}, { get: (_, key) => key.startsWith('create') ? () => ({ addColorStop() {} }) : () => {} });
  dom.window.HTMLCanvasElement.prototype.getContext = () => context;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, .1, 80);
  camera.position.set(0, 3.66, 8.3); camera.lookAt(0, 3.65, -.3); camera.updateMatrixWorld();
  const container = document.getElementById('room');
  let state = { phase: 'idle', selected: null };
  const stickyNote = new THREE.Object3D(); stickyNote.position.set(.4, 1.83, .395);
  const library = createDomainLibrary(scene, camera, container, next => { state = next; }, stickyNote);
  const device = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.4, .8), new THREE.MeshStandardMaterial());
  device.add(body); device.position.set(-3.65, 2.16, -.05); scene.add(device);
  const shelf = container.querySelector('.domain-shelf-target');
  const choices = [...container.querySelectorAll('.domain-case-target')];
  function advance(seconds, reduced = false) {
    for (let t = 0; t < seconds; t += 1 / 120) library.advance(1 / 120, reduced);
    library.draw(1440, 900, 8.3);
  }
  function choose(index) {
    if (state.phase !== 'choosing') { choices[index].click(); return; }
    if (choices[index].getAttribute('aria-pressed') !== 'true') { choices[index].click(); advance(.65); }
    choices[index].click();
  }
  function cleanup() {
    library.dispose();
    scene.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      for (const material of [node.material].flat()) { material.map?.dispose(); material.dispose(); }
    });
    dom.window.close();
    globalThis.document = previousDocument;
  }
  return { dom, scene, camera, container, library, device, shelf, stickyNote, choices, choose, advance, cleanup, state: () => state };
}

test('Domains note is labelled, lifts on collection hover, and settles when the selector opens', () => {
  const f = setup();
  try {
    f.library.setDevice(f.device);
    assert.equal(f.shelf.textContent, 'Domains');
    assert.ok(!f.shelf.textContent.includes('Explore'));
    f.shelf.dispatchEvent(new f.dom.window.Event('pointerenter'));
    f.advance(.5);
    assert.ok(f.stickyNote.position.z > .42);
    f.shelf.click(); f.advance(2);
    assert.equal(f.state().phase, 'choosing');
    assert.ok(Math.abs(f.stickyNote.position.z - .395) < .0001);
  } finally { f.cleanup(); }
});

test('all domain cases share the same full-size game-case shell', () => {
  const f = setup();
  try {
    const cases = f.scene.getObjectByName('ACM domain disc library').children.filter(node => node.name.endsWith('disc case'));
    assert.equal(cases.length, 5);
    for (const box of cases) {
      const size = new THREE.Box3().setFromObject(box).getSize(new THREE.Vector3());
      assert.ok(Math.abs(size.x - GAME_CASE.width) < .003);
      assert.ok(Math.abs(size.y - GAME_CASE.height) < 1e-8);
      assert.ok(Math.abs(size.z - GAME_CASE.depth) < .001);
    }
  } finally { f.cleanup(); }
});

test('shelf clicks are gated on the device, expose five native buttons, and ignore re-entry', () => {
  const f = setup();
  try {
    assert.equal(f.shelf.disabled, true); f.shelf.click(); assert.equal(f.state().phase, 'idle');
    f.library.setDevice(f.device); f.shelf.click(); f.shelf.click();
    assert.equal(f.state().phase, 'presenting'); assert.equal(f.shelf.hidden, true);
    f.advance(2); assert.equal(f.choices.length, 5); assert.ok(f.choices.every(button => !button.hidden));
    f.library.focusChoice(); assert.equal(document.activeElement, f.choices[0]);
    f.choices[0].dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    assert.equal(document.activeElement, f.choices[4]);
    f.advance(.65);
    f.choose(4); f.choose(2);
    assert.equal(f.state().selected, 4); assert.equal(f.state().phase, 'opening');
    assert.ok(f.choices.every(button => button.hidden));
    f.advance(CUES.end + 1); assert.equal(f.state().phase, 'active'); assert.equal(f.library.zoom, 1);
    const escape = new f.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(escape); assert.equal(escape.defaultPrevented, true); assert.equal(f.state().phase, 'returning');
    f.advance(16); assert.equal(f.state().phase, 'idle'); assert.equal(f.shelf.hidden, false);
    assert.equal(f.library.zoom, 0); assert.equal(f.scene.getObjectByName('Removable domain disc').visible, false);
    f.shelf.click(); f.advance(2); f.choose(0); assert.equal(f.state().selected, 0);
  } finally { f.cleanup(); }
});

test('dispose removes interaction elements and its document keyboard handler', () => {
  const f = setup();
  try {
    f.library.setDevice(f.device); f.shelf.click(); f.advance(2);
    const before = f.state(); f.library.dispose();
    assert.equal(f.container.querySelector('.domain-interactions'), null);
    document.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.deepEqual(f.state(), before);
  } finally { f.cleanup(); }
});

test('ejecting a loaded disc brings forward only its matching case', () => {
  for (const selected of [0, 1, 2, 3, 4]) {
    const f = setup();
    try {
      f.library.setDevice(f.device); f.shelf.click(); f.advance(2); f.choose(selected); f.advance(CUES.end + 1);
      const cases = f.scene.getObjectByName('ACM domain disc library').children.filter(node => node.name.endsWith('disc case'));
      const rest = cases.map(node => ({ position: node.position.clone(), rotation: node.quaternion.clone() }));
      let matchingCaseCameForward = false;
      f.library.exit();
      for (let t = 0; t < 16; t += 1 / 120) {
        f.library.advance(1 / 120, false); f.library.draw(1440, 900, 8.3);
        cases.forEach((node, i) => {
          if (i === selected) { if (node.position.z > 1) matchingCaseCameForward = true; return; }
          assert.ok(node.position.distanceTo(rest[i].position) < 1e-9, `case ${i} must stay on the shelf while ejecting ${selected}`);
          assert.ok(node.quaternion.angleTo(rest[i].rotation) < 1e-7);
        });
      }
      assert.ok(matchingCaseCameForward);
      assert.equal(f.state().phase, 'idle');
      assert.ok(cases[selected].position.distanceTo(rest[selected].position) < 1e-9);
    } finally { f.cleanup(); }
  }
});

test('clicking a fanned case brings it forward without inserting its disc', () => {
  const f = setup();
  try {
    f.library.setDevice(f.device); f.shelf.click(); f.advance(2);
    assert.equal(f.choices[0].getAttribute('aria-pressed'), 'true');
    const group = f.scene.getObjectByName('ACM domain disc library');
    const management = group.children.find(node => node.name === 'Management disc case');
    const tech = group.children.find(node => node.name === 'Tech disc case');
    const before = management.position.clone();
    f.choices[4].click();
    assert.equal(f.state().phase, 'choosing');
    assert.equal(f.state().selected, null);
    assert.equal(f.container.querySelector('.domain-insert-action'), null);
    f.choices[4].click();
    assert.equal(f.state().phase, 'choosing', 'second click while moving cannot insert');
    f.advance(.25);
    assert.ok(management.position.distanceTo(before) > .01, 'case glides from its previous fan position');
    f.advance(.4);
    assert.ok(management.position.z > tech.position.z, 'selected case is physically in front');
    assert.equal(f.choices[4].getAttribute('aria-pressed'), 'true');
    assert.ok(f.choices[4].style.clipPath.startsWith('polygon('));
    assert.equal(f.container.querySelector('.domain-labels'), null, 'identification is printed on the cases');
    f.choices[4].click();
    assert.equal(f.state().selected, 4);
    assert.equal(f.state().phase, 'opening');
    f.advance(.02);
    assert.equal(f.scene.getObjectByName('Printed domain disc label').material.map.image.dataset.domain, 'management');
  } finally { f.cleanup(); }
});

test('reduced motion settles every case before the portrait camera focuses the TV', () => {
  const f = setup();
  try {
    f.library.setDevice(f.device); f.shelf.click(); f.advance(.02, true); f.choose(0); f.advance(.02, true);
    assert.equal(f.state().phase, 'booting'); assert.equal(f.library.zoom, 1);
    for (const object of f.scene.getObjectByName('ACM domain disc library').children) {
      if (!object.name.endsWith('disc case')) continue;
      assert.equal(object.position.y, CASE_CENTER_Y); assert.ok(Math.abs(object.position.z - .13) < 1e-10);
    }
    assert.equal(f.scene.getObjectByName('Removable domain disc').visible, false);
    f.advance(2, true); assert.equal(f.state().phase, 'active');
    f.library.exit(); f.advance(.02, true); assert.equal(f.state().phase, 'idle'); assert.equal(f.library.zoom, 0);
  } finally { f.cleanup(); }
});

test('the departing disc clears the actual open case geometry before travelling to the drive', () => {
  const f = setup();
  try {
    f.library.setDevice(f.device); f.shelf.click(); f.advance(2);
    f.choose(0);
    const holder = f.scene.getObjectByName('Tech disc case');
    const disc = f.scene.getObjectByName('Removable domain disc');
    holder.traverse(node => { if (node.isMesh) for (const material of [node.material].flat()) material.side = THREE.DoubleSide; });
    const ray = new THREE.Raycaster();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), direction = new THREE.Vector3();
    const dt = 1 / 120;
    for (let time = 0; time < CUES.flyEnd; time += dt) {
      f.library.advance(dt, false); f.library.draw(1440, 900, 8.3);
      if (time < CUES.liftStart + .25) continue;
      disc.updateWorldMatrix(true, false);
      for (let i = 0; i < 48; i++) {
        const angle = i * Math.PI * 2 / 48;
        const next = (i + 1) * Math.PI * 2 / 48;
        a.set(Math.cos(angle) * .201, Math.sin(angle) * .201, 0).applyMatrix4(disc.matrixWorld);
        b.set(Math.cos(next) * .201, Math.sin(next) * .201, 0).applyMatrix4(disc.matrixWorld);
        direction.subVectors(b, a);
        ray.set(a, direction.clone().normalize()); ray.far = direction.length(); ray.near = .00001;
        assert.equal(ray.intersectObject(holder, true).length, 0, `disc perimeter crosses the case at ${time.toFixed(3)}s`);
      }
    }
    assert.equal(f.container.querySelector('.domain-labels'), null);
  } finally { f.cleanup(); }
});

test('atomic viewport reframing keeps presented cases and a travelling disc in front of the camera', () => {
  const f = setup();
  try {
    f.library.setDevice(f.device); f.shelf.click(); f.advance(2);
    for (const phase of ['choosing', 'travelling']) {
      if (phase === 'travelling') { f.choose(0); f.advance(4); }
      for (const [width, height] of [[390, 844], [1440, 900], [768, 1024]]) {
        const aspect = width / height, fov = width < 680 ? 48 : 38;
        const stagingZ = roomCameraZ(aspect, fov, true);
        f.camera.aspect = aspect; f.camera.fov = fov; f.camera.updateProjectionMatrix();
        // create-room marks resize immediate, applying this framing before draw.
        f.camera.position.z = THREE.MathUtils.lerp(stagingZ, tvCameraZ(aspect, fov), f.library.zoom);
        f.camera.updateMatrixWorld(); f.library.draw(width, height, stagingZ);
        const objects = phase === 'choosing'
          ? f.scene.getObjectByName('ACM domain disc library').children.filter(object => object.name.endsWith('disc case'))
          : [f.scene.getObjectByName('Removable domain disc')];
        for (const object of objects) {
          const p = object.position.clone().project(f.camera);
          assert.ok(Math.abs(p.x) < .95 && Math.abs(p.y) < .95 && p.z < 1, `${phase} stays in frame after ${width}x${height} resize`);
          assert.ok(f.camera.worldToLocal(object.position.clone()).z < -.1, 'no foreground object is behind the camera');
        }
      }
    }
  } finally { f.cleanup(); }
});

test('the animated drive anchors to a real face of the supplied optimized PS5 asset', async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(fileURLToPath(new URL('../public/models/ps5-optimized.glb', import.meta.url)));
  const model = new THREE.Group();
  // Reconstruct geometry only, with the same world transforms and normalization
  // as GLTFLoader/create-room. Embedded image decoding is not needed for picking.
  for (const node of doc.getRoot().listNodes()) {
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      const geometry = new THREE.BufferGeometry();
      const position = primitive.getAttribute('POSITION');
      geometry.setAttribute('position', new THREE.BufferAttribute(position.getArray(), 3, position.getNormalized()));
      const indices = primitive.getIndices();
      if (indices) geometry.setIndex(new THREE.BufferAttribute(indices.getArray(), 1));
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      mesh.matrixAutoUpdate = false; mesh.matrix.fromArray(node.getWorldMatrix()); model.add(mesh);
    }
  }
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
  model.position.sub(bounds.getCenter(new THREE.Vector3()));
  const normalization = new THREE.Group(); normalization.scale.setScalar(1.4 / size.y); normalization.add(model);
  const placement = new THREE.Group(); placement.add(normalization); placement.position.set(-3.65, 2.16, -.05); placement.rotation.y = .08;
  placement.updateWorldMatrix(true, true);
  const origin = new THREE.Vector3(-.055, -.08, 1).applyMatrix4(placement.matrixWorld);
  const direction = new THREE.Vector3(0, 0, -1).transformDirection(placement.matrixWorld);
  const hit = new THREE.Raycaster(origin, direction).intersectObject(placement, true)[0];
  assert.ok(hit, 'the slot location must intersect the model, not use a guessed fallback');
  const frontZ = placement.worldToLocal(hit.point.clone()).z;
  assert.ok(frontZ > .2 && frontZ < .6, 'drive lies on the viewer-facing surface');
  const f = setup();
  try {
    f.scene.add(placement); f.library.setDevice(placement);
    const drive = placement.getObjectByName('Animated disc-drive shutter');
    assert.ok(Math.abs(drive.position.z - frontZ - .009) < 1e-8);
    f.shelf.click(); f.advance(2); f.choose(0); f.advance(CUES.insertStart);
    const disc = f.scene.getObjectByName('Removable domain disc');
    assert.ok(disc.visible);
    assert.ok(drive.worldToLocal(disc.position.clone()).z > .25, 'disc waits in front of the drive before insertion');
    f.advance(2); assert.equal(disc.visible, false);
  } finally { f.cleanup(); }
});
