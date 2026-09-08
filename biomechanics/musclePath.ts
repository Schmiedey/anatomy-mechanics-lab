import type { ModelState, MuscleDefinition } from '../anatomy/model';
import type { PathPoint, ViaPoint } from '../anatomy/types';
import { bodyToWorld, surfaceToWorld } from './frames';
import {
  cross,
  dot,
  length,
  polylineLength,
  sub,
  unit,
  type Vec3,
} from './vectors';
import { wrapCylinder, wrapSphere } from './wrapping';

function viaActive(via: ViaPoint, s: ModelState) {
  if (!via.condition) return true;
  const value = via.condition.dof === 'flexion' ? s.angle : s.pronation;
  return value >= via.condition.min && value <= via.condition.max;
}

function insertionPoint(m: MuscleDefinition, s: ModelState): PathPoint {
  if (m.id === 'bicepsLong' || m.id === 'bicepsShort') {
    return {
      body: 'radius',
      local: [m.insertion.local[0], -s.bicepsInsertion, m.insertion.local[2]],
    };
  }
  return m.insertion;
}

function wrapBetween(a: Vec3, b: Vec3, m: MuscleDefinition, s: ModelState) {
  for (const surface of m.wrapping) {
    const world = surfaceToWorld(surface, s);
    const extra =
      world.kind === 'cylinder'
        ? wrapCylinder(a, b, world.cylinder)
        : wrapSphere(a, b, world.sphere);
    if (extra && extra.length) return extra;
  }
  return null;
}

export function pathPoints(m: MuscleDefinition, s: ModelState): Vec3[] {
  const origin = bodyToWorld(m.origin, s);
  const insertion = bodyToWorld(insertionPoint(m, s), s);
  const vias = m.viaPoints
    .filter((v) => viaActive(v, s))
    .map((v) => bodyToWorld(v, s));
  const nodes = [origin, ...vias, insertion];
  const points: Vec3[] = [nodes[0]];
  for (let i = 0; i < nodes.length - 1; i++) {
    const extra = wrapBetween(nodes[i], nodes[i + 1], m, s);
    if (extra) points.push(...extra);
    points.push(nodes[i + 1]);
  }
  return points;
}

function closestFoot(points: Vec3[]): Vec3 {
  let best: Vec3 = points[0],
    bestD = length(points[0]);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1],
      ab = sub(b, a);
    const denom = dot(ab, ab);
    const t =
      denom < 1e-16 ? 0 : Math.min(1, Math.max(0, -dot(a, ab) / denom));
    const p = [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t] as Vec3;
    const d = length(p);
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

const H = 1e-3;

export function muscleGeometry(m: MuscleDefinition, s: ModelState) {
  const points = pathPoints(m, s);
  const origin = points[0];
  const insertion = points[points.length - 1];
  const pathLength = polylineLength(points);
  const plusFlex = polylineLength(pathPoints(m, { ...s, angle: s.angle + H }));
  const minusFlex = polylineLength(pathPoints(m, { ...s, angle: s.angle - H }));
  const plusPron = polylineLength(
    pathPoints(m, { ...s, pronation: s.pronation + H }),
  );
  const minusPron = polylineLength(
    pathPoints(m, { ...s, pronation: s.pronation - H }),
  );
  const dDeg = 2 * H * (Math.PI / 180);
  const incoming = unit(sub(points[points.length - 2] ?? origin, insertion));
  return {
    origin,
    insertion,
    points,
    direction: incoming,
    length: pathLength,
    momentArm: -(plusFlex - minusFlex) / dDeg,
    pronationMomentArm: -(plusPron - minusPron) / dDeg,
    foot: closestFoot(points),
    wrapped: points.length > 2,
  };
}

export function geometricMomentArm(insertion: Vec3, direction: Vec3) {
  return cross(insertion, direction)[2];
}
