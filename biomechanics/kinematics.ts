import { anthropometry, type ModelState } from '../anatomy/model';
import { rotateZ, type Vec3 } from './vectors';
export function kinematics(s: ModelState) {
  const q = (s.angle * Math.PI) / 180;
  return {
    q,
    elbow: [0, 0, 0] as Vec3,
    shoulder: [0, s.upperArm, 0] as Vec3,
    wrist: rotateZ([0, -s.forearm, 0], q),
    load: rotateZ([0, -s.forearm * s.loadPosition, 0], q),
    forearmCOM: rotateZ(
      [0, -s.forearm * anthropometry.forearmComFraction, 0],
      q,
    ),
    handCOM: rotateZ([0, -s.forearm - anthropometry.handComOffset, 0], q),
  };
}
