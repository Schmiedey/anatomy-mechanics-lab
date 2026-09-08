import type { Vec3 } from '../biomechanics/vectors';
export type MuscleId = 'biceps' | 'brachialis' | 'brachioradialis';
export interface MuscleDefinition {
  id: MuscleId;
  name: string;
  color: string;
  maxIsometricForce: number;
  optimalFiberLength: number;
  tendonSlackLength: number;
  pennationAngle: number;
  origin: Vec3;
  insertion: Vec3;
}
// Illustrative adult geometry, SI units. These are editable assumptions, not patient-specific measurements.
export const muscles: MuscleDefinition[] = [
  {
    id: 'biceps',
    name: 'Biceps brachii',
    color: '#dc786b',
    maxIsometricForce: 800,
    optimalFiberLength: 0.12,
    tendonSlackLength: 0.17,
    pennationAngle: 0,
    origin: [0.018, 0.29, 0.016],
    insertion: [0.018, -0.045, 0.016],
  },
  {
    id: 'brachialis',
    name: 'Brachialis',
    color: '#d8ae63',
    maxIsometricForce: 1000,
    optimalFiberLength: 0.085,
    tendonSlackLength: 0.045,
    pennationAngle: (10 * Math.PI) / 180,
    origin: [0.022, 0.14, -0.009],
    insertion: [0.016, -0.028, -0.009],
  },
  {
    id: 'brachioradialis',
    name: 'Brachioradialis',
    color: '#73b9bd',
    maxIsometricForce: 450,
    optimalFiberLength: 0.19,
    tendonSlackLength: 0.09,
    pennationAngle: 0,
    origin: [0.023, 0.072, 0.033],
    insertion: [0.012, -0.255, 0.033],
  },
];
export interface ModelState {
  angle: number;
  loadLb: number;
  upperArm: number;
  forearm: number;
  loadPosition: number;
  strengths: Record<MuscleId, number>;
  bicepsInsertion: number;
  selfWeight: boolean;
  hill: boolean;
  velocity: number;
}
export const DEFAULT_STATE: ModelState = {
  angle: 90,
  loadLb: 15,
  upperArm: 0.33,
  forearm: 0.3,
  loadPosition: 1.1,
  strengths: { biceps: 1, brachialis: 1, brachioradialis: 1 },
  bicepsInsertion: 0.045,
  selfWeight: true,
  hill: false,
  velocity: 0,
};
export const anthropometry = {
  gravity: 9.80665,
  lbToKg: 0.45359237,
  forearmMass: 1.2,
  handMass: 0.45,
  forearmComFraction: 0.43,
  handComOffset: 0.04,
};
