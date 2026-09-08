import { PRONATION_AXIS, type ModelState } from '../anatomy/model';
import type { BodyId, PathPoint, WrappingSurface } from '../anatomy/types';
import { add, rotateY, rotateZ, scale, sub, type Vec3 } from './vectors';
import type { Cylinder, Sphere } from './wrapping';

function scaleLocal(body: BodyId, local: Vec3, s: ModelState): Vec3 {
  const along =
    body === 'humerus' ? s.upperArm / 0.33 : s.forearm / 0.3;
  return [local[0], local[1] * along, local[2]];
}

export function bodyToWorld(point: PathPoint, s: ModelState): Vec3 {
  let local = scaleLocal(point.body, point.local, s);
  if (point.body === 'radius') {
    local = add(
      rotateY(sub(local, PRONATION_AXIS), (-s.pronation * Math.PI) / 180),
      PRONATION_AXIS,
    );
  }
  if (point.body === 'humerus') return local;
  return rotateZ(local, (s.angle * Math.PI) / 180);
}

export function bodyVectorToWorld(
  body: BodyId,
  local: Vec3,
  s: ModelState,
): Vec3 {
  const origin = bodyToWorld({ body, local: [0, 0, 0] }, s);
  const tip = bodyToWorld({ body, local }, s);
  return sub(tip, origin);
}

export function surfaceToWorld(surface: WrappingSurface, s: ModelState) {
  const center = bodyToWorld({ body: surface.body, local: surface.center }, s);
  if (surface.type === 'sphere') {
    const sphere: Sphere = { center, radius: surface.radius };
    return { kind: 'sphere' as const, sphere };
  }
  const axis = bodyVectorToWorld(surface.body, surface.axis, s);
  const cylinder: Cylinder = {
    center,
    axis: lengthSafe(axis),
    radius: surface.radius,
    halfLength: surface.halfLength,
    side: surface.side,
  };
  return { kind: 'cylinder' as const, cylinder };
}

function lengthSafe(axis: Vec3): Vec3 {
  const n = Math.hypot(...axis);
  return n > 1e-12 ? scale(axis, 1 / n) : [0, 0, 1];
}
