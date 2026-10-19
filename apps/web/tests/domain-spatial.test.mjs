import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makeCaseLayout, CaseMotion, DiscMotion, DISC_RADIUS, roomCameraZ, tvCameraZ } from '../src/lib/domain-spatial.ts';
import { DOMAINS, DOMAIN_SHELF_INDICES, CUES, sampleLoad } from '../src/lib/domain-sequence.ts';

test('all five cases remain visible and separated in wide and portrait viewports', () => {
  for (const [width, height] of [[1440, 900], [843, 524], [390, 844], [768, 1024]]) {
    const aspect = width / height;
    const fov = width < 680 ? 48 : 38;
    const camera = new THREE.PerspectiveCamera(fov, aspect, .1, 80);
    camera.position.set(0, 3.66, roomCameraZ(aspect, fov, true));
    camera.lookAt(0, 3.65, -.3); camera.updateMatrixWorld();
    const layout = makeCaseLayout(camera.position.z, aspect, fov);
    const centers = [];
    for (let i = 0; i < DOMAINS.length; i++) {
      const model = new THREE.Group();
      const motion = new CaseMotion(model, i);
      motion.update(1, sampleLoad(0), null, layout);
      model.updateMatrixWorld();
      const center = model.position.clone().project(camera);
      centers.push(center);
      for (const x of [-.17, .17]) for (const y of [-.2025, .2025]) for (const z of [-.033, .033]) {
        const projected = new THREE.Vector3(x, y, z).applyMatrix4(model.matrixWorld).project(camera);
        assert.ok(Math.abs(projected.x) < .94 && Math.abs(projected.y) < .94, `${width}x${height}: case ${i} stays in the view`);
      }
    }
    for (let i = 0; i < centers.length; i++) for (let j = i + 1; j < centers.length; j++) {
      assert.ok(centers[i].distanceTo(centers[j]) > .12, 'cases have separate click targets');
    }
  }
});

test('the loading camera includes the PS5 drive on portrait screens, then focuses the complete TV', () => {
  for (const aspect of [390 / 844, 843 / 524, 16 / 10, 21 / 9]) {
    const camera = new THREE.PerspectiveCamera(38, aspect, .1, 80);
    camera.position.set(0, 3.65, roomCameraZ(aspect, 38, true)); camera.updateMatrixWorld();
    for (const x of [-3.95, -3.4]) for (const y of [1.46, 2.86]) {
      const p = new THREE.Vector3(x, y, .45).project(camera);
      assert.ok(Math.abs(p.x) < .94 && Math.abs(p.y) < .94, 'the console stays inside the loading shot');
    }
    camera.position.z = tvCameraZ(aspect, 38); camera.updateMatrixWorld();
    for (const x of [-2.92, 2.92]) for (const y of [1.96, 5.34]) {
      const p = new THREE.Vector3(x, y, -.35).project(camera);
      assert.ok(Math.abs(p.x) <= .941 && Math.abs(p.y) <= .841, 'TV borders stay visible in the final shot');
    }
  }
});

test('restored cases exactly replace their shelf instances, without duplicate case geometry', () => {
  DOMAINS.forEach((_, i) => {
    const model = new THREE.Group();
    const motion = new CaseMotion(model, i);
    const layout = makeCaseLayout(8, 16 / 9, 38);
    motion.update(1, sampleLoad(3), i, layout);
    motion.update(0, sampleLoad(0), null, layout);
    assert.ok(model.position.distanceTo(new THREE.Vector3(-.95 + DOMAIN_SHELF_INDICES[i] * .074, 1.6525, .13)) < 1e-10);
    assert.ok(model.quaternion.angleTo(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0))) < 1e-7);
    assert.equal(model.scale.x, 1, 'the physical cases never inflate');
  });
});

test('the selected empty case is back on the shelf before the domain becomes active', () => {
  for (let i = 0; i < DOMAINS.length; i++) {
    const model = new THREE.Group(); const motion = new CaseMotion(model, i);
    motion.update(1, sampleLoad(CUES.end), i, makeCaseLayout(8, 16 / 9, 38));
    assert.ok(model.position.distanceTo(motion.restPosition) < 1e-9, 'the case cannot obstruct the TV zoom');
  }
});

test('disc leaves its holder continuously and enters the drive edge first', () => {
  const holder = new THREE.Group(); holder.position.set(-.2, 3, 3.5); holder.rotation.y = -.18;
  const drive = new THREE.Group(); drive.position.set(-3.65, 2.1, .43); drive.rotation.y = .08;
  holder.updateMatrixWorld(); drive.updateMatrixWorld();
  const disc = new THREE.Group(); const motion = new DiscMotion(disc);
  let previous;
  for (let t = 0; t <= CUES.end; t += 1 / 240) {
    motion.update(sampleLoad(t), holder, drive);
    assert.ok(disc.position.toArray().every(Number.isFinite));
    assert.ok(disc.position.y > 1.6, 'flight clears the cabinet');
    if (previous) assert.ok(previous.distanceTo(disc.position) < .045, 'no position jump between stages');
    previous = disc.position.clone();
  }
  motion.update(sampleLoad(CUES.insertStart), holder, drive);
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(disc.quaternion);
  const slotNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(drive.quaternion);
  assert.ok(Math.abs(normal.dot(slotNormal)) < 1e-8, 'disc plane is parallel to insertion direction');
  motion.update(sampleLoad(CUES.insertEnd), holder, drive);
  const local = drive.worldToLocal(disc.position.clone());
  assert.ok(local.z + DISC_RADIUS < 0, 'the whole disc has crossed the slot plane');
  assert.equal(disc.visible, false);
  motion.update(sampleLoad(CUES.insertEnd - .1), holder, drive);
  assert.equal(disc.visible, true, 'the same disc reappears during ejection');
});
