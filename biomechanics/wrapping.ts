import {
  add,
  cross,
  dot,
  length,
  scale,
  sub,
  unit,
  type Vec3,
} from './vectors';

export interface Cylinder {
  center: Vec3;
  axis: Vec3;
  radius: number;
  halfLength: number;
  side: 1 | -1;
}

export interface Sphere {
  center: Vec3;
  radius: number;
}

interface CylFrame {
  n: Vec3;
  b: Vec3;
  t: Vec3;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x));
}

function cylinderFrame(axis: Vec3): CylFrame {
  const t = unit(axis);
  const helper: Vec3 = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const n = unit(cross(helper, t));
  return { n, b: cross(t, n), t };
}

function toCylinder(p: Vec3, center: Vec3, frame: CylFrame) {
  const d = sub(p, center);
  return { x: dot(d, frame.n), y: dot(d, frame.b), z: dot(d, frame.t) };
}

function fromCylinder(
  c: { x: number; y: number; z: number },
  center: Vec3,
  frame: CylFrame,
): Vec3 {
  return add(
    center,
    add(add(scale(frame.n, c.x), scale(frame.b, c.y)), scale(frame.t, c.z)),
  );
}

function chordHitsCircle(
  px: number,
  py: number,
  qx: number,
  qy: number,
  radius: number,
) {
  const dx = qx - px,
    dy = qy - py;
  const denom = dx * dx + dy * dy;
  if (denom < 1e-16) return false;
  const t = clamp((-px * dx - py * dy) / denom, 0, 1);
  const cx = px + t * dx,
    cy = py + t * dy;
  return cx * cx + cy * cy < radius * radius - 1e-12;
}

function unwrapDelta(from: number, to: number, side: 1 | -1) {
  let delta = to - from;
  if (side > 0) {
    while (delta < 0) delta += 2 * Math.PI;
    while (delta >= 2 * Math.PI) delta -= 2 * Math.PI;
  } else {
    while (delta > 0) delta -= 2 * Math.PI;
    while (delta <= -2 * Math.PI) delta += 2 * Math.PI;
  }
  return delta;
}

function wrapCircle2d(
  px: number,
  py: number,
  qx: number,
  qy: number,
  radius: number,
  side: 1 | -1,
) {
  const rp = Math.hypot(px, py),
    rq = Math.hypot(qx, qy);
  if (rp <= radius + 1e-8 || rq <= radius + 1e-8) return null;
  if (!chordHitsCircle(px, py, qx, qy, radius)) return null;
  const thetaP = Math.atan2(py, px),
    thetaQ = Math.atan2(qy, qx);
  const alphaP = Math.acos(clamp(radius / rp, -1, 1)),
    alphaQ = Math.acos(clamp(radius / rq, -1, 1));
  const thetaT = thetaP + side * alphaP,
    thetaS = thetaQ - side * alphaQ;
  const delta = unwrapDelta(thetaT, thetaS, side);
  if (Math.abs(delta) < 1e-4 || Math.abs(delta) > 0.95 * 2 * Math.PI)
    return null;
  return { thetaT, delta, rp, rq, alphaP, alphaQ };
}

export function wrapCylinder(
  p: Vec3,
  q: Vec3,
  cylinder: Cylinder,
): Vec3[] | null {
  const frame = cylinderFrame(cylinder.axis);
  const P = toCylinder(p, cylinder.center, frame),
    Q = toCylinder(q, cylinder.center, frame);
  const wrap = wrapCircle2d(P.x, P.y, Q.x, Q.y, cylinder.radius, cylinder.side);
  if (!wrap) return null;
  const samples = Math.max(3, Math.ceil(Math.abs(wrap.delta) / (Math.PI / 18)));
  const points: Vec3[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const theta = wrap.thetaT + wrap.delta * u;
    const z = P.z + (Q.z - P.z) * u;
    if (Math.abs(z) > cylinder.halfLength) return null;
    points.push(
      fromCylinder(
        {
          x: cylinder.radius * Math.cos(theta),
          y: cylinder.radius * Math.sin(theta),
          z,
        },
        cylinder.center,
        frame,
      ),
    );
  }
  return points.length ? points : null;
}

export function wrapSphere(p: Vec3, q: Vec3, sphere: Sphere): Vec3[] | null {
  const u = sub(q, p);
  const denom = dot(u, u);
  if (denom < 1e-16) return null;
  const t = clamp(dot(sub(sphere.center, p), u) / denom, 0, 1);
  const closest = add(p, scale(u, t));
  if (length(sub(closest, sphere.center)) >= sphere.radius - 1e-12) return null;
  const normal = unit(cross(sub(p, sphere.center), sub(q, sphere.center)));
  if (length(normal) < 1e-10) return null;
  const b = unit(cross(normal, [0, 0, 1] as Vec3));
  const n = length(b) > 0.2 ? b : unit(cross(normal, [0, 1, 0]));
  const frame = { n, b: cross(normal, n), t: normal };
  const P = toCylinder(p, sphere.center, frame),
    Q = toCylinder(q, sphere.center, frame);
  const side: 1 | -1 = P.x * Q.y - P.y * Q.x >= 0 ? 1 : -1;
  const wrap = wrapCircle2d(P.x, P.y, Q.x, Q.y, sphere.radius, side);
  if (!wrap) return null;
  const samples = Math.max(3, Math.ceil(Math.abs(wrap.delta) / (Math.PI / 18)));
  const points: Vec3[] = [];
  for (let i = 0; i <= samples; i++) {
    const uArc = i / samples;
    const theta = wrap.thetaT + wrap.delta * uArc;
    points.push(
      fromCylinder(
        {
          x: sphere.radius * Math.cos(theta),
          y: sphere.radius * Math.sin(theta),
          z: 0,
        },
        sphere.center,
        frame,
      ),
    );
  }
  return points.length ? points : null;
}
