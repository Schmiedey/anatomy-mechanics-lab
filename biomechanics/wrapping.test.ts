import { describe, it, expect } from 'vitest';
import { polylineLength, type Vec3 } from './vectors';
import { wrapCylinder, wrapSphere } from './wrapping';

describe('wrapping primitives', () => {
  it('wraps a cylinder along the shorter exterior arc', () => {
    const extra = wrapCylinder([2, 0, 0], [-2, 0, 0], {
      center: [0, 0, 0],
      axis: [0, 0, 1],
      radius: 1,
      halfLength: 2,
      side: 1,
    });
    expect(extra).not.toBeNull();
    const path: Vec3[] = [[2, 0, 0], ...extra!, [-2, 0, 0]];
    expect(polylineLength(path)).toBeCloseTo(2 * Math.sqrt(3) + Math.PI / 3, 2);
    expect(extra![Math.floor(extra!.length / 2)][1]).toBeGreaterThan(0.5);
  });

  it('does not wrap when the chord misses the cylinder', () => {
    expect(
      wrapCylinder([2, 2, 0], [2, -2, 0], {
        center: [0, 0, 0],
        axis: [0, 0, 1],
        radius: 1,
        halfLength: 2,
        side: 1,
      }),
    ).toBeNull();
  });

  it('rejects a wrap that would leave a finite cylinder', () => {
    expect(
      wrapCylinder([2, 0, 3], [-2, 0, -3], {
        center: [0, 0, 0],
        axis: [0, 0, 1],
        radius: 1,
        halfLength: 0.4,
        side: 1,
      }),
    ).toBeNull();
  });

  it('wraps a sphere in the plane of the endpoints', () => {
    const extra = wrapSphere([2, 0.5, 0], [-2, 0.5, 0], {
      center: [0, 0, 0],
      radius: 1,
    });
    expect(extra).not.toBeNull();
    expect(
      polylineLength([[2, 0.5, 0], ...extra!, [-2, 0.5, 0]]),
    ).toBeGreaterThan(4);
  });
});
