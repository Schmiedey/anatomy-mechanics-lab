export type Vec3 = [number, number, number];
export const add = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export const sub = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
export const scale = (a: Vec3, s: number): Vec3 => [
  a[0] * s,
  a[1] * s,
  a[2] * s,
];
export const dot = (a: Vec3, b: Vec3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const length = (a: Vec3) => Math.hypot(...a);
export const unit = (a: Vec3): Vec3 =>
  length(a) > 1e-12 ? scale(a, 1 / length(a)) : [0, 0, 0];
export const rotateZ = (a: Vec3, q: number): Vec3 => [
  a[0] * Math.cos(q) - a[1] * Math.sin(q),
  a[0] * Math.sin(q) + a[1] * Math.cos(q),
  a[2],
];
export const rotateY = (a: Vec3, q: number): Vec3 => [
  a[0] * Math.cos(q) + a[2] * Math.sin(q),
  a[1],
  -a[0] * Math.sin(q) + a[2] * Math.cos(q),
];
export function polylineLength(points: Vec3[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++)
    total += length(sub(points[i], points[i - 1]));
  return total;
}
