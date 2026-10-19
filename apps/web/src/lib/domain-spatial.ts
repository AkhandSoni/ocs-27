import * as THREE from "three";
import { DOMAIN_SHELF_INDICES, DOMAINS, smooth, type sampleLoad } from "./domain-sequence.ts";
import { GAME_CASE, CASE_CENTER_Y } from "./game-case.ts";

export const DISC_RADIUS = .202;
type LoadPose = ReturnType<typeof sampleLoad>;
export type CaseLayout = ReturnType<typeof makeCaseLayout>;

export function roomCameraZ(aspect: number, fov: number, includeDrive = false) {
  const tangent = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  return Math.max(8, (includeDrive ? 8.55 : 5.84) / (2 * tangent * aspect * .9) - .35);
}

export function tvCameraZ(aspect: number, fov: number) {
  const tangent = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  return Math.max(5.84 / (2 * tangent * aspect * .94), 3.38 / (2 * tangent * .84)) - .35;
}

export function makeCaseLayout(roomZ: number, aspect: number, fov: number, frontIndex = 0) {
  const narrow = aspect < .85;
  const tangent = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const distance = Math.max(1.35, (narrow ? .84 : 1.14) / (2 * tangent * aspect * .9), .92 / (2 * tangent * .9));
  const centerY = 3.65 - distance * tangent * .10;
  const order = [frontIndex, ...DOMAINS.map((_, i) => i).filter(i => i !== frontIndex)];
  const ranks = DOMAINS.map((_, i) => order.indexOf(i));
  const positions = DOMAINS.map((_, i) => {
    const rank = ranks[i];
    const angle = (2 - rank) * (narrow ? .11 : .16);
    const step = narrow ? .035 : .065;
    return new THREE.Vector3((rank - 2) * step - Math.sin(angle) * .25, centerY + Math.cos(angle) * .25 - .25 + rank * .008, roomZ - distance - rank * .10);
  });
  const rotations = DOMAINS.map((_, i) => new THREE.Quaternion().setFromEuler(new THREE.Euler(-.045, -.10, (2 - ranks[i]) * (narrow ? .11 : .16))));
  return {
    positions, rotations, order, frontIndex, distance,
    focusPosition: new THREE.Vector3(-.06, centerY - .25, roomZ - distance - .8),
    focusRotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(.025, -.10, -.025)),
  };
}

export class CaseMotion {
  readonly model: THREE.Object3D;
  readonly index: number;
  readonly restPosition: THREE.Vector3;
  readonly restRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  constructor(model: THREE.Object3D, index: number) {
    this.model = model;
    this.index = index;
    this.restPosition = new THREE.Vector3(-.95 + DOMAIN_SHELF_INDICES[index] * .074, CASE_CENTER_Y, GAME_CASE.centerZ);
  }
  update(presentation: number, pose: LoadPose, selected: number | null, layout: CaseLayout, shelveOthers = 0) {
    // Pull straight out of the tightly packed shelf before turning the case.
    const stagger = this.index * .035;
    const t = Math.max(0, Math.min(1, (presentation - stagger) / (1 - stagger)));
    const pull = smooth(Math.min(1, t / .32));
    const display = smooth(Math.max(0, (t - .22) / .78));
    this.model.position.copy(this.restPosition);
    this.model.position.z += pull * .55;
    this.model.position.lerp(layout.positions[this.index], display);
    this.model.position.y += Math.sin(display * Math.PI) * .18;
    this.model.quaternion.slerpQuaternions(this.restRotation, layout.rotations[this.index], display);
    if (selected === this.index) {
      this.model.position.lerp(layout.focusPosition, pose.focus);
      this.model.quaternion.slerp(layout.focusRotation, pose.focus);
      this.model.position.lerp(this.restPosition, pose.caseReturn);
      this.model.quaternion.slerp(this.restRotation, pose.caseReturn);
    } else if (selected !== null) {
      const shelf = Math.max(pose.focus, shelveOthers);
      this.model.position.lerp(this.restPosition, shelf);
      this.model.quaternion.slerp(this.restRotation, shelf);
    }
  }
}

/** Reused scratch vectors keep disc flight allocation-free. */
export class DiscMotion {
  private readonly disc: THREE.Object3D;
  private readonly seated = new THREE.Vector3();
  private readonly lifted = new THREE.Vector3();
  private readonly approach = new THREE.Vector3();
  private readonly inserted = new THREE.Vector3();
  private readonly control1 = new THREE.Vector3();
  private readonly control2 = new THREE.Vector3();
  private readonly fromRotation = new THREE.Quaternion();
  private readonly toRotation = new THREE.Quaternion();
  private readonly edgeRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  constructor(disc: THREE.Object3D) { this.disc = disc; }
  update(pose: LoadPose, holder: THREE.Object3D, drive: THREE.Object3D) {
    holder.updateWorldMatrix(true, false);
    drive.updateWorldMatrix(true, false);
    this.seated.set(0, 0, .012).applyMatrix4(holder.matrixWorld);
    this.lifted.set(0, 0, .62).applyMatrix4(holder.matrixWorld);
    this.approach.set(0, 0, DISC_RADIUS + .18).applyMatrix4(drive.matrixWorld);
    this.inserted.set(0, 0, -DISC_RADIUS - .045).applyMatrix4(drive.matrixWorld);
    holder.getWorldQuaternion(this.fromRotation);
    drive.getWorldQuaternion(this.toRotation).multiply(this.edgeRotation);
    if (pose.fly === 0) {
      // Pull straight toward the viewer, beyond the lid's complete swept arc.
      // Hold this pose while the case closes; only then travel and rotate.
      this.disc.position.lerpVectors(this.seated, this.lifted, pose.lift);
      this.disc.quaternion.copy(this.fromRotation);
    } else {
      this.control1.set(0, .12, .95).applyMatrix4(holder.matrixWorld);
      this.control2.set(.2, .45, 1).add(this.approach);
      const t = pose.fly, u = 1 - t;
      this.disc.position.copy(this.lifted).multiplyScalar(u * u * u)
        .addScaledVector(this.control1, 3 * u * u * t)
        .addScaledVector(this.control2, 3 * u * t * t)
        .addScaledVector(this.approach, t * t * t);
      this.disc.quaternion.slerpQuaternions(this.fromRotation, this.toRotation, smooth(t));
    }
    if (pose.insert > 0) this.disc.position.lerpVectors(this.approach, this.inserted, pose.insert);
    this.disc.visible = pose.discVisible;
  }
}
