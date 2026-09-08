import { anthropometry as a, type ModelState } from '../anatomy/model';
import { kinematics } from './kinematics';
import { cross, type Vec3 } from './vectors';
export function externalForces(s: ModelState) {
  const k = kinematics(s);
  const gravity: Vec3 = [0, -a.gravity, 0];
  const loadForce: Vec3 = [0, -s.loadLb * a.lbToKg * a.gravity, 0];
  const torqueVector = cross(k.load, loadForce);
  const loadTorque = -torqueVector[2] || 0;
  const selfTorque = s.selfWeight
    ? a.gravity * (a.forearmMass * k.forearmCOM[0] + a.handMass * k.handCOM[0])
    : 0;
  return {
    gravity,
    loadForce,
    torqueVector,
    loadTorque,
    selfTorque,
    requiredTorque: Math.max(0, loadTorque + selfTorque),
    loadMomentArm: k.load[0],
  };
}
