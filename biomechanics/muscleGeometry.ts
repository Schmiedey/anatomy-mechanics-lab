import type { ModelState, MuscleDefinition } from '../anatomy/model';
import {
  rotateZ,
  sub,
  length,
  unit,
  cross,
  scale,
  dot,
  type Vec3,
} from './vectors';
export function muscleGeometry(m: MuscleDefinition, s: ModelState) {
  const origin: Vec3 = [
    m.origin[0],
    (m.origin[1] * s.upperArm) / 0.33,
    m.origin[2],
  ];
  const local: Vec3 = [
    m.insertion[0],
    m.id === 'biceps' ? -s.bicepsInsertion : (m.insertion[1] * s.forearm) / 0.3,
    m.insertion[2],
  ];
  const insertion = rotateZ(local, (s.angle * Math.PI) / 180),
    path = sub(origin, insertion),
    direction = unit(path);
  const momentArm = cross(insertion, direction)[2];
  const foot = sub(insertion, scale(direction, dot(insertion, direction)));
  return {
    origin,
    insertion,
    direction,
    length: length(path),
    momentArm,
    foot,
  };
}
