import { DEFAULT_STATE, muscles } from '../anatomy/model';
import type { MuscleId } from '../anatomy/types';
import { compareCurves, interpolateCurve, murrayCurves } from './reference';
import { muscleGeometry } from './musclePath';
import { solve } from './inverseDynamics';

const bicepsIds: MuscleId[] = ['bicepsLong', 'bicepsShort'];
const tricepsIds: MuscleId[] = [
  'tricepsLong',
  'tricepsLat',
  'tricepsMed',
];

function forearmPronation(forearm: 'supinated' | 'neutral' | 'pronated') {
  if (forearm === 'supinated') return 0;
  if (forearm === 'pronated') return 180;
  return 90;
}

function combinedMomentArm(ids: MuscleId[], angle: number, pronation: number) {
  const state = { ...DEFAULT_STATE, angle, pronation, hill: false };
  const arms = ids.map((id) => {
    const muscle = muscles.find((m) => m.id === id)!;
    return muscleGeometry(muscle, state).momentArm;
  });
  return arms.reduce((t, a) => t + a, 0) / arms.length;
}

export function simulatedReferenceSeries(
  curve: (typeof murrayCurves)[number],
) {
  const pronation = forearmPronation(curve.forearm);
  const ids =
    curve.muscle === 'biceps'
      ? bicepsIds
      : curve.muscle === 'triceps'
        ? tricepsIds
        : ([curve.muscle] as MuscleId[]);
  return Array.from({ length: 29 }, (_, i) => {
    const angle = i * 5;
    return {
      angle,
      value: combinedMomentArm(ids, angle, pronation),
      reference: interpolateCurve(curve.samples, angle),
    };
  });
}

export function validateCurve(curveId: string) {
  const curve = murrayCurves.find((c) => c.id === curveId);
  if (!curve) throw new Error(`Unknown reference curve ${curveId}`);
  const series = simulatedReferenceSeries(curve);
  return {
    curve,
    series,
    error: compareCurves(series, curve.samples),
  };
}

export function bicepsPronationEffect(angle = 90) {
  const supinated = solve({ ...DEFAULT_STATE, angle, pronation: 0 });
  const pronated = solve({ ...DEFAULT_STATE, angle, pronation: 180 });
  const biceps = (s: typeof supinated) =>
    s.muscles.filter((m) => m.id === 'bicepsLong' || m.id === 'bicepsShort');
  return {
    supinated: biceps(supinated),
    pronated: biceps(pronated),
  };
}
