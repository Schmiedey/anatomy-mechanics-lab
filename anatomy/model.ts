import type { Vec3 } from '../biomechanics/vectors';
import type { MuscleDefinition, MuscleId } from './types';
export type { MuscleId } from './types';
export type { MuscleDefinition } from './types';

export const PRONATION_AXIS: Vec3 = [0, 0, -0.015];

export const muscles: MuscleDefinition[] = [
  {
    id: 'bicepsLong',
    name: 'Biceps long head',
    shortName: 'BIC long',
    color: '#dc786b',
    group: 'flexor',
    maxIsometricForce: 624,
    optimalFiberLength: 0.116,
    tendonSlackLength: 0.272,
    pennationAngle: 0,
    origin: { body: 'humerus', local: [0.01, 0.325, 0.02] },
    insertion: { body: 'radius', local: [0.02, -0.045, -0.012] },
    viaPoints: [],
    wrapping: [
      {
        type: 'cylinder',
        id: 'elbowAnterior',
        body: 'humerus',
        center: [0.008, 0.002, 0.004],
        axis: [0, 0, 1],
        radius: 0.044,
        halfLength: 0.045,
        side: -1,
      },
    ],
  },
  {
    id: 'bicepsShort',
    name: 'Biceps short head',
    shortName: 'BIC short',
    color: '#c45d52',
    group: 'flexor',
    maxIsometricForce: 436,
    optimalFiberLength: 0.132,
    tendonSlackLength: 0.192,
    pennationAngle: 0,
    origin: { body: 'humerus', local: [0.028, 0.305, -0.012] },
    insertion: { body: 'radius', local: [0.02, -0.045, -0.01] },
    viaPoints: [],
    wrapping: [
      {
        type: 'cylinder',
        id: 'elbowAnterior',
        body: 'humerus',
        center: [0.008, 0.002, 0.002],
        axis: [0, 0, 1],
        radius: 0.042,
        halfLength: 0.045,
        side: -1,
      },
    ],
  },
  {
    id: 'brachialis',
    name: 'Brachialis',
    shortName: 'BRA',
    color: '#d8ae63',
    group: 'flexor',
    maxIsometricForce: 987,
    optimalFiberLength: 0.086,
    tendonSlackLength: 0.054,
    pennationAngle: (10 * Math.PI) / 180,
    origin: { body: 'humerus', local: [0.02, 0.135, -0.008] },
    insertion: { body: 'ulna', local: [0.012, -0.03, -0.01] },
    viaPoints: [],
    wrapping: [
      {
        type: 'sphere',
        id: 'trochlea',
        body: 'humerus',
        center: [0.006, 0, -0.006],
        radius: 0.024,
      },
    ],
  },
  {
    id: 'brachioradialis',
    name: 'Brachioradialis',
    shortName: 'BRD',
    color: '#73b9bd',
    group: 'flexor',
    maxIsometricForce: 261,
    optimalFiberLength: 0.173,
    tendonSlackLength: 0.133,
    pennationAngle: 0,
    origin: { body: 'humerus', local: [0.012, 0.085, 0.038] },
    insertion: { body: 'radius', local: [0.008, -0.255, 0.03] },
    viaPoints: [
      {
        id: 'lateralEpicondyle',
        body: 'humerus',
        local: [0.02, 0.018, 0.042],
      },
      {
        id: 'cubitalFold',
        body: 'humerus',
        local: [0.038, 0.012, 0.028],
        condition: { dof: 'flexion', min: 95, max: 140 },
      },
    ],
    wrapping: [],
  },
  {
    id: 'tricepsLong',
    name: 'Triceps long head',
    shortName: 'TRI long',
    color: '#6a7a9a',
    group: 'extensor',
    maxIsometricForce: 799,
    optimalFiberLength: 0.134,
    tendonSlackLength: 0.143,
    pennationAngle: (12 * Math.PI) / 180,
    origin: { body: 'humerus', local: [-0.02, 0.32, 0.01] },
    insertion: { body: 'ulna', local: [-0.022, 0.016, 0] },
    viaPoints: [],
    wrapping: [
      {
        type: 'cylinder',
        id: 'elbowPosterior',
        body: 'humerus',
        center: [-0.004, 0, 0],
        axis: [0, 0, 1],
        radius: 0.023,
        halfLength: 0.04,
        side: 1,
      },
    ],
  },
  {
    id: 'tricepsLat',
    name: 'Triceps lateral head',
    shortName: 'TRI lat',
    color: '#7d8a6e',
    group: 'extensor',
    maxIsometricForce: 624,
    optimalFiberLength: 0.114,
    tendonSlackLength: 0.098,
    pennationAngle: (9 * Math.PI) / 180,
    origin: { body: 'humerus', local: [-0.022, 0.185, 0.024] },
    insertion: { body: 'ulna', local: [-0.022, 0.016, 0.006] },
    viaPoints: [],
    wrapping: [
      {
        type: 'cylinder',
        id: 'elbowPosterior',
        body: 'humerus',
        center: [-0.004, 0, 0.004],
        axis: [0, 0, 1],
        radius: 0.023,
        halfLength: 0.04,
        side: 1,
      },
    ],
  },
  {
    id: 'tricepsMed',
    name: 'Triceps medial head',
    shortName: 'TRI med',
    color: '#8a7a6a',
    group: 'extensor',
    maxIsometricForce: 624,
    optimalFiberLength: 0.114,
    tendonSlackLength: 0.091,
    pennationAngle: (9 * Math.PI) / 180,
    origin: { body: 'humerus', local: [-0.02, 0.1, 0] },
    insertion: { body: 'ulna', local: [-0.022, 0.016, -0.004] },
    viaPoints: [],
    wrapping: [
      {
        type: 'cylinder',
        id: 'elbowPosterior',
        body: 'humerus',
        center: [-0.004, 0, -0.002],
        axis: [0, 0, 1],
        radius: 0.022,
        halfLength: 0.04,
        side: 1,
      },
    ],
  },
  {
    id: 'anconeus',
    name: 'Anconeus',
    shortName: 'ANC',
    color: '#9a8a78',
    group: 'extensor',
    maxIsometricForce: 350,
    optimalFiberLength: 0.027,
    tendonSlackLength: 0.018,
    pennationAngle: 0,
    origin: { body: 'humerus', local: [-0.012, 0.016, 0.034] },
    insertion: { body: 'ulna', local: [-0.028, 0.004, 0.02] },
    viaPoints: [],
    wrapping: [],
  },
];

export const flexors = muscles.filter((m) => m.group === 'flexor');
export const extensors = muscles.filter((m) => m.group === 'extensor');

export interface ModelState {
  angle: number;
  pronation: number;
  loadLb: number;
  upperArm: number;
  forearm: number;
  loadPosition: number;
  strengths: Record<MuscleId, number>;
  bicepsInsertion: number;
  selfWeight: boolean;
  hill: boolean;
  velocity: number;
  coContraction: number;
}

const fullStrength = Object.fromEntries(
  muscles.map((m) => [m.id, 1]),
) as Record<MuscleId, number>;

export const DEFAULT_STATE: ModelState = {
  angle: 90,
  pronation: 0,
  loadLb: 15,
  upperArm: 0.33,
  forearm: 0.3,
  loadPosition: 1.1,
  strengths: fullStrength,
  bicepsInsertion: 0.045,
  selfWeight: true,
  hill: false,
  velocity: 0,
  coContraction: 0,
};

export const anthropometry = {
  gravity: 9.80665,
  lbToKg: 0.45359237,
  forearmMass: 1.2,
  handMass: 0.45,
  forearmComFraction: 0.43,
  handComOffset: 0.04,
};
