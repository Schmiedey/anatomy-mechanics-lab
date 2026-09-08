import { describe, it, expect } from 'vitest';
import { DEFAULT_STATE as D, muscles } from '../anatomy/model';
import { solve } from './inverseDynamics';
import { recruit } from './muscleRecruitment';
import { muscleGeometry, pathPoints } from './musclePath';
import { forceLength, forceVelocity } from './muscleModels';
import { polylineLength } from './vectors';
import { compareCurves } from './reference';
import { validateCurve } from './validation';

const zeroStrength = Object.fromEntries(
  muscles.map((m) => [m.id, 0]),
) as typeof D.strengths;

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
      expect(Math.abs(r.recruitment.residual)).toBeLessThan(1e-6);
      r.muscles.forEach((m) => {
        expect(m.force).toBeGreaterThanOrEqual(0);
        expect(m.force).toBeLessThanOrEqual(m.capacity + 1e-10);
      });
    }
  });
  it('geometric moment arms equal negative length derivative', () => {
    for (const angle of [20, 60, 90, 120])
      for (const m of muscles) {
        const h = 1e-3;
        const derivative =
          (muscleGeometry(m, { ...D, angle: angle + h }).length -
            muscleGeometry(m, { ...D, angle: angle - h }).length) /
          ((2 * h * Math.PI) / 180);
        expect(muscleGeometry(m, { ...D, angle }).momentArm).toBeCloseTo(
          -derivative,
          6,
        );
      }
  });
  it('zero biceps strength redistributes load', () => {
    const a = solve({ ...D, loadLb: 5 }),
      b = solve({
        ...D,
        loadLb: 5,
        strengths: { ...D.strengths, bicepsLong: 0, bicepsShort: 0 },
      });
    expect(b.muscles.find((m) => m.id === 'bicepsLong')!.force).toBe(0);
    expect(b.muscles.find((m) => m.id === 'bicepsShort')!.force).toBe(0);
    expect(b.muscles.find((m) => m.id === 'brachialis')!.force).toBeGreaterThan(
      a.muscles.find((m) => m.id === 'brachialis')!.force,
    );
    expect(b.recruitment.residual).toBeCloseTo(0, 6);
  });
  it('reports infeasibility without exceeding bounds', () => {
    const r = solve({ ...D, loadLb: 100 });
    expect(r.recruitment.feasible).toBe(false);
    expect(r.recruitment.residual).toBeGreaterThan(0);
    r.muscles.forEach((m) => expect(m.force).toBeLessThanOrEqual(m.capacity));
  });
  it('handles all muscles disabled', () => {
    const r = solve({ ...D, strengths: zeroStrength });
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
    const aBic = a.muscles.find((m) => m.id === 'bicepsLong')!,
      bBic = b.muscles.find((m) => m.id === 'bicepsLong')!;
    expect(bBic.momentArm).toBeGreaterThan(aBic.momentArm);
    expect(bBic.mechanicalAdvantage!).toBeGreaterThan(
      aBic.mechanicalAdvantage!,
    );
    expect(bBic.force).not.toBeCloseTo(aBic.force);
  });
  it('flexors have positive moment arms and extensors negative', () => {
    const r = solve({ ...D, angle: 90 });
    r.muscles
      .filter((m) => m.group === 'flexor')
      .forEach((m) => expect(m.momentArm).toBeGreaterThan(0.01));
    r.muscles
      .filter((m) => m.group === 'extensor')
      .forEach((m) =>
        expect(m.momentArm, m.id).toBeLessThan(-0.005),
      );
  });
  it('pronation lengthens biceps and reduces its flexion moment arm', () => {
    const sup = solve({ ...D, angle: 90, pronation: 0 });
    const pro = solve({ ...D, angle: 90, pronation: 180 });
    const sBic = sup.muscles.find((m) => m.id === 'bicepsLong')!;
    const pBic = pro.muscles.find((m) => m.id === 'bicepsLong')!;
    expect(pBic.length).toBeGreaterThan(sBic.length);
    expect(pBic.momentArm).toBeLessThan(sBic.momentArm);
    expect(sBic.pronationMomentArm).toBeLessThan(0);
  });
  it('brachialis on the ulna is nearly insensitive to pronation', () => {
    const sup = muscleGeometry(
      muscles.find((m) => m.id === 'brachialis')!,
      { ...D, pronation: 0 },
    );
    const pro = muscleGeometry(
      muscles.find((m) => m.id === 'brachialis')!,
      { ...D, pronation: 180 },
    );
    expect(Math.abs(pro.length - sup.length)).toBeLessThan(1e-6);
    expect(Math.abs(pro.momentArm - sup.momentArm)).toBeLessThan(1e-6);
  });
  it('conditional via points appear only inside their range', () => {
    const brd = muscles.find((m) => m.id === 'brachioradialis')!;
    const extended = pathPoints(brd, { ...D, angle: 40 });
    const flexed = pathPoints(brd, { ...D, angle: 120 });
    expect(flexed.length).toBeGreaterThan(extended.length);
  });
  it('wrapping makes the biceps path longer than a straight chord', () => {
    const m = muscles.find((m) => m.id === 'bicepsLong')!;
    const g = muscleGeometry(m, { ...D, angle: 90 });
    expect(g.length).toBeGreaterThan(
      polylineLength([g.origin, g.insertion]) - 1e-6,
    );
  });
  it('recruits extensors for a negative required torque', () => {
    const r = recruit(
      [
        { momentArm: 0.04, capacity: 800 },
        { momentArm: -0.02, capacity: 1000 },
      ],
      -5,
    );
    expect(r.forces[0]).toBeCloseTo(0, 8);
    expect(r.forces[1]).toBeCloseTo(250, 6);
    expect(r.feasible).toBe(true);
  });
  it('co-contraction fires antagonists and preserves net torque', () => {
    const r = recruit(
      [
        { momentArm: 0.04, capacity: 800 },
        { momentArm: -0.025, capacity: 600 },
      ],
      8,
      0.4,
    );
    expect(r.forces[1]).toBeCloseTo(0.4 * 600, 8);
    expect(r.forces[0] * 0.04 + r.forces[1] * -0.025).toBeCloseTo(8, 6);
    expect(r.forces[0]).toBeGreaterThan(8 / 0.04);
  });
  it('computes RMSE against a reference curve', () => {
    const error = compareCurves(
      [
        { angle: 0, value: 0.02 },
        { angle: 90, value: 0.05 },
      ],
      [
        { angle: 0, value: 0.02 },
        { angle: 90, value: 0.04 },
      ],
    );
    expect(error.rmse).toBeCloseTo(Math.sqrt((0 + 0.01 ** 2) / 2), 10);
    expect(error.peakError).toBeCloseTo(0.01, 10);
  });
  it('emits a biceps validation report', () => {
    const report = validateCurve('biceps-supinated');
    expect(report.series).toHaveLength(29);
    expect(report.error.rmse).toBeGreaterThan(0);
    expect(Number.isFinite(report.error.rmse)).toBe(true);
  });
});
