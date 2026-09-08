import { muscles, type ModelState } from '../anatomy/model';
import { kinematics } from './kinematics';
import { muscleGeometry } from './musclePath';
import { muscleCapacity } from './muscleModels';
import { externalForces } from './externalForces';
import { recruit } from './muscleRecruitment';

export function solve(s: ModelState) {
  const k = kinematics(s),
    external = externalForces(s);
  const geometry = muscles.map((m) => {
    const g = muscleGeometry(m, s);
    return {
      ...m,
      ...g,
      ...muscleCapacity(
        m,
        g.length,
        g.momentArm,
        s.velocity,
        s.strengths[m.id],
        s.hill,
      ),
    };
  });
  const recruitment = recruit(
    geometry,
    external.requiredTorque,
    s.coContraction,
  );
  const musclesOut = geometry.map((m, i) => ({
    ...m,
    force: recruitment.forces[i],
    activation: m.capacity > 0 ? recruitment.forces[i] / m.capacity : 0,
    torque: recruitment.forces[i] * m.momentArm,
    mechanicalAdvantage:
      Math.abs(external.loadMomentArm) > 1e-8
        ? m.momentArm / external.loadMomentArm
        : null,
  }));
  const flexorTorque = musclesOut
    .filter((m) => m.group === 'flexor')
    .reduce((t, m) => t + m.torque, 0);
  const extensorTorque = musclesOut
    .filter((m) => m.group === 'extensor')
    .reduce((t, m) => t + m.torque, 0);
  return {
    kinematics: k,
    external,
    recruitment,
    muscles: musclesOut,
    flexorTorque,
    extensorTorque,
  };
}

export type Solution = ReturnType<typeof solve>;
export const sweep = (s: ModelState) =>
  Array.from({ length: 71 }, (_, i) => ({
    angle: i * 2,
    ...solve({ ...s, angle: i * 2 }),
  }));
