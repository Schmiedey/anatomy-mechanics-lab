import type { MuscleDefinition } from '../anatomy/model';
export const forceLength = (normalizedLength: number) =>
  Math.exp(-Math.pow((normalizedLength - 1) / 0.56, 2));
// v is normalized fiber lengthening velocity in optimal lengths / s; vmax=10.
export function forceVelocity(v: number) {
  return v < 0
    ? Math.max(0, (1 + v / 10) / (1 - v / 2.5))
    : 1 + (0.5 * v) / (v + 1.5);
}
export function muscleCapacity(
  m: MuscleDefinition,
  pathLength: number,
  momentArm: number,
  velocity: number,
  strength: number,
  hill: boolean,
) {
  const cos = Math.cos(m.pennationAngle);
  const fiberLength = Math.max(0.001, (pathLength - m.tendonSlackLength) / cos);
  const fiberVelocity = (-momentArm * velocity * Math.PI) / 180 / cos;
  const fl = hill ? forceLength(fiberLength / m.optimalFiberLength) : 1;
  const fv = hill ? forceVelocity(fiberVelocity / m.optimalFiberLength) : 1;
  return {
    fiberLength,
    fiberVelocity,
    forceLength: fl,
    forceVelocity: fv,
    capacity: m.maxIsometricForce * strength * fl * fv * (hill ? cos : 1),
  };
}
