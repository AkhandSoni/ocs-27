import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ControllerMotion } from '../src/lib/controller-pickup.ts';

function setup(quiet = false) {
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, .1, 80);
  camera.position.set(0, 3.65, 8);
  const model = new THREE.Group();
  model.position.set(-2.47, 1.705, .28);
  model.rotation.set(-.25, Math.PI - .08, .02);
  const rest = model.clone();
  const motion = new ControllerMotion(model, camera, () => quiet);
  return { model, camera, rest, motion };
}
function settle(motion) { for (let i = 0; i < 90; i++) motion.update(1 / 60, i / 60); }
function closeVector(actual, expected) { assert.ok(actual.distanceTo(expected) < 1e-8); }

test('pickup settles below the camera in a tilted first-person pose', () => {
  const { model, camera, rest, motion } = setup();
  motion.toggle(); settle(motion);
  assert.equal(motion.held, true);
  assert.equal(motion.moving, false);
  const relative = camera.worldToLocal(model.position.clone());
  assert.ok(relative.z < -1 && relative.z > -3, 'controller stays in front of the viewer');
  assert.ok(relative.y < -.2, 'controller sits below the TV centre');
  assert.ok(model.quaternion.angleTo(rest.quaternion) > .1, 'grip is visibly tilted');
});

test('held controller follows camera translation and rotation', () => {
  const { model, camera, motion } = setup(true);
  motion.toggle(); motion.update(0, 0);
  const before = camera.worldToLocal(model.position.clone());
  camera.position.set(4, 6, 12);
  camera.rotation.set(.1, -.3, 0);
  motion.update(1 / 60, 1);
  closeVector(camera.worldToLocal(model.position.clone()), before);
});

test('putting it down restores the exact cabinet transform', () => {
  const { model, rest, motion } = setup();
  motion.toggle(); settle(motion); motion.toggle(); settle(motion);
  assert.equal(motion.held, false);
  assert.equal(motion.moving, false);
  closeVector(model.position, rest.position);
  closeVector(model.scale, rest.scale);
  assert.ok(model.quaternion.angleTo(rest.quaternion) < 1e-7);
});

test('reversing a pickup starts from its current pose without a jump', () => {
  const { model, motion } = setup();
  motion.toggle(); motion.update(.4, .4);
  const midway = model.position.clone();
  motion.toggle(); motion.update(0, .4);
  closeVector(model.position, midway);
  settle(motion);
  assert.equal(motion.moving, false);
});

test('reduced motion skips the flight and hand sway', () => {
  const { model, motion } = setup(true);
  motion.toggle(); motion.update(0, 0, -1, -1);
  assert.equal(motion.moving, false);
  const held = model.position.clone();
  motion.update(.1, 30, 1, 1);
  closeVector(model.position, held);
});
