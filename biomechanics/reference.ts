export interface ReferenceCurve {
  id: string;
  muscle: 'biceps' | 'brachialis' | 'brachioradialis' | 'triceps';
  quantity: 'flexionMomentArm';
  unit: 'm';
  forearm: 'supinated' | 'neutral' | 'pronated';
  citation: string;
  notes: string;
  samples: { angle: number; value: number }[];
}

// Characteristic curves reconstructed from Murray et al. peak moment arms,
// peak angles, and the reported ≥30% variation over 95° of flexion.
// These are not point-by-point digitizations of a single specimen trace.
const murray = 'Murray WM, Delp SL, Buchanan TS. J Biomech. 1995;28:513–525. Peak magnitudes: Murray WM, et al. J Biomech. 2002;35:19–26.';

function table(
  pairs: [number, number][],
): { angle: number; value: number }[] {
  return pairs.map(([angle, cm]) => ({ angle, value: cm / 100 }));
}

export const murrayCurves: ReferenceCurve[] = [
  {
    id: 'biceps-supinated',
    muscle: 'biceps',
    quantity: 'flexionMomentArm',
    unit: 'm',
    forearm: 'supinated',
    citation: murray,
    notes:
      'Combined biceps. Peak 4.7 cm near 88°. Larger peak in supination than pronation.',
    samples: table([
      [0, 2.2],
      [10, 2.6],
      [20, 3.1],
      [30, 3.5],
      [40, 3.9],
      [50, 4.2],
      [60, 4.45],
      [70, 4.6],
      [80, 4.7],
      [88, 4.7],
      [90, 4.68],
      [100, 4.55],
      [110, 4.35],
      [120, 4.1],
      [130, 3.7],
      [140, 3.3],
    ]),
  },
  {
    id: 'biceps-pronated',
    muscle: 'biceps',
    quantity: 'flexionMomentArm',
    unit: 'm',
    forearm: 'pronated',
    citation: murray,
    notes:
      'Combined biceps in pronation. Smaller peak, shifted toward greater flexion.',
    samples: table([
      [0, 1.7],
      [20, 2.3],
      [40, 2.9],
      [60, 3.3],
      [80, 3.5],
      [100, 3.55],
      [120, 3.35],
      [140, 2.9],
    ]),
  },
  {
    id: 'brachialis',
    muscle: 'brachialis',
    quantity: 'flexionMomentArm',
    unit: 'm',
    forearm: 'neutral',
    citation: murray,
    notes: 'Peak 2.6 cm near 88°. Weakly dependent on forearm rotation.',
    samples: table([
      [0, 1.15],
      [20, 1.55],
      [40, 1.95],
      [60, 2.3],
      [80, 2.55],
      [88, 2.6],
      [100, 2.55],
      [120, 2.35],
      [140, 2.0],
    ]),
  },
  {
    id: 'brachioradialis',
    muscle: 'brachioradialis',
    quantity: 'flexionMomentArm',
    unit: 'm',
    forearm: 'neutral',
    citation: murray,
    notes: 'Peak 7.7 cm near 108°.',
    samples: table([
      [0, 3.3],
      [20, 4.2],
      [40, 5.15],
      [60, 6.05],
      [80, 6.9],
      [100, 7.5],
      [108, 7.7],
      [120, 7.55],
      [140, 6.9],
    ]),
  },
  {
    id: 'triceps',
    muscle: 'triceps',
    quantity: 'flexionMomentArm',
    unit: 'm',
    forearm: 'neutral',
    citation: murray,
    notes:
      'Combined triceps extension moment arm, stored as signed flexion moment arm. Peak 2.3 cm near 44°.',
    samples: table([
      [0, -1.5],
      [20, -1.95],
      [31, -2.2],
      [44, -2.3],
      [60, -2.2],
      [80, -1.95],
      [100, -1.65],
      [120, -1.35],
      [140, -1.05],
    ]),
  },
];

export function interpolateCurve(
  samples: { angle: number; value: number }[],
  angle: number,
) {
  if (!samples.length) return 0;
  if (angle <= samples[0].angle) return samples[0].value;
  const last = samples[samples.length - 1];
  if (angle >= last.angle) return last.value;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1],
      b = samples[i];
    if (angle <= b.angle) {
      const u = (angle - a.angle) / (b.angle - a.angle);
      return a.value + u * (b.value - a.value);
    }
  }
  return last.value;
}

export interface CurveError {
  rmse: number;
  mae: number;
  peakError: number;
  peakAngleError: number;
  simulatedPeak: { angle: number; value: number };
  referencePeak: { angle: number; value: number };
}

function peakOf(samples: { angle: number; value: number }[]) {
  return samples.reduce((best, s) =>
    Math.abs(s.value) > Math.abs(best.value) ? s : best,
  );
}

export function compareCurves(
  simulated: { angle: number; value: number }[],
  reference: { angle: number; value: number }[],
): CurveError {
  const errors = simulated.map((s) => s.value - interpolateCurve(reference, s.angle));
  const rmse = Math.sqrt(
    errors.reduce((t, e) => t + e * e, 0) / Math.max(1, errors.length),
  );
  const mae =
    errors.reduce((t, e) => t + Math.abs(e), 0) / Math.max(1, errors.length);
  const simulatedPeak = peakOf(simulated);
  const referencePeak = peakOf(reference);
  return {
    rmse,
    mae,
    peakError: simulatedPeak.value - referencePeak.value,
    peakAngleError: simulatedPeak.angle - referencePeak.angle,
    simulatedPeak,
    referencePeak,
  };
}
