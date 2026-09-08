import { describe, it, expect } from 'vitest';
import { DEFAULT_STATE as D, muscles } from '../anatomy/model';
import { solve } from './inverseDynamics';
import { recruit } from './muscleRecruitment';
import { muscleGeometry } from './muscleGeometry';
import { forceLength, forceVelocity } from './muscleModels';
describe('elbow mechanics', () => {
  it('zero load has zero external torque; self weight is separate', () => {
    const r = solve({ ...D, loadLb: 0 });
    expect(r.external.loadTorque).toBe(0);
    expect(r.external.selfTorque).toBeGreaterThan(0);
    expect(
      solve({ ...D, loadLb: 0, selfWeight: false }).external.requiredTorque,
    ).toBe(0);
  });
  it('gravity torque follows r F sin(q)', () => {
    for (const angle of [0, 30, 90, 140]) {
      const r = solve({ ...D, angle });
      expect(r.external.loadTorque).toBeCloseTo(
        D.forearm *
          D.loadPosition *
          D.loadLb *
          0.45359237 *
          9.80665 *
          Math.sin((angle * Math.PI) / 180),
        10,
      );
    }
  });
  it('longer forearms increase torque linearly', () => {
    expect(
      solve({ ...D, forearm: 0.36 }).external.loadTorque /
        solve(D).external.loadTorque,
    ).toBeCloseTo(1.2, 10);
  });
  it('doubling moment arm halves single actuator force', () => {
    expect(
      recruit([{ momentArm: 0.04, capacity: 1000 }], 10).forces[0],
    ).toBeCloseTo(
      recruit([{ momentArm: 0.02, capacity: 1000 }], 10).forces[0] / 2,
      8,
    );
  });
  it('satisfies equilibrium and force bounds throughout ROM', () => {
    for (let angle = 0; angle <= 140; angle += 2) {
      const r = solve({ ...D, angle, loadLb: 5 });
      expect(r.recruitment.feasible).toBe(true);
      expect(Math.abs(r.recruitment.residual)).toBeLessThan(1e-7);
      r.muscles.forEach((m) => {
        expect(m.force).toBeGreaterThanOrEqual(0);
        expect(m.force).toBeLessThanOrEqual(m.capacity + 1e-10);
      });
    }
  });
  it('geometric moment arms equal negative length derivative', () => {
    for (const angle of [0, 45, 90, 140])
      for (const m of muscles) {
        const h = 1e-4;
        const derivative =
          (muscleGeometry(m, { ...D, angle: angle + h }).length -
            muscleGeometry(m, { ...D, angle: angle - h }).length) /
          ((2 * h * Math.PI) / 180);
        expect(muscleGeometry(m, { ...D, angle }).momentArm).toBeCloseTo(
          -derivative,
          7,
        );
      }
  });
  it('zero biceps strength redistributes load', () => {
    const a = solve({ ...D, loadLb: 5 }),
      b = solve({ ...D, loadLb: 5, strengths: { ...D.strengths, biceps: 0 } });
    expect(b.muscles[0].force).toBe(0);
    expect(b.muscles[1].force).toBeGreaterThan(a.muscles[1].force);
    expect(b.recruitment.residual).toBeCloseTo(0, 8);
  });
  it('reports infeasibility without exceeding bounds', () => {
    const r = solve({ ...D, loadLb: 100 });
    expect(r.recruitment.feasible).toBe(false);
    expect(r.recruitment.residual).toBeGreaterThan(0);
    r.muscles.forEach((m) => expect(m.force).toBeLessThanOrEqual(m.capacity));
  });
  it('handles all muscles disabled', () => {
    const r = solve({
      ...D,
      strengths: { biceps: 0, brachialis: 0, brachioradialis: 0 },
    });
    expect(r.recruitment.achievedTorque).toBe(0);
    expect(r.recruitment.feasible).toBe(false);
  });
  it('matches unconstrained analytical quadratic optimum', () => {
    const a = [
      { momentArm: 0.03, capacity: 800 },
      { momentArm: 0.02, capacity: 1000 },
    ];
    const r = recruit(a, 5);
    const den = a.reduce((s, m) => s + m.momentArm ** 2 * m.capacity ** 2, 0);
    a.forEach((m, i) =>
      expect(r.forces[i]).toBeCloseTo(
        (5 * m.momentArm * m.capacity ** 2) / den,
        8,
      ),
    );
  });
  it('Hill curve has unity at optimal length and zero speed', () => {
    expect(forceLength(1)).toBe(1);
    expect(forceVelocity(0)).toBe(1);
    expect(forceVelocity(-2)).toBeLessThan(1);
    expect(forceVelocity(2)).toBeGreaterThan(1);
    expect(forceVelocity(-10)).toBe(0);
  });
  it('insertion displacement changes geometry and required recruitment', () => {
    const a = solve(D),
      b = solve({ ...D, bicepsInsertion: 0.065 });
    expect(b.muscles[0].momentArm).toBeGreaterThan(a.muscles[0].momentArm);
    expect(b.muscles[0].mechanicalAdvantage!).toBeGreaterThan(
      a.muscles[0].mechanicalAdvantage!,
    );
    expect(b.muscles[0].force).not.toBeCloseTo(a.muscles[0].force);
  });
});
