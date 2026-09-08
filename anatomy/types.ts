import type { Vec3 } from '../biomechanics/vectors';

export type BodyId = 'humerus' | 'ulna' | 'radius';

export type MuscleId =
  | 'bicepsLong'
  | 'bicepsShort'
  | 'brachialis'
  | 'brachioradialis'
  | 'tricepsLong'
  | 'tricepsLat'
  | 'tricepsMed'
  | 'anconeus';

export type MuscleGroup = 'flexor' | 'extensor';

export interface PathPoint {
  body: BodyId;
  local: Vec3;
}

export interface ViaPoint extends PathPoint {
  id: string;
  condition?: {
    dof: 'flexion' | 'pronation';
    min: number;
    max: number;
  };
}

export type WrappingSurface =
  | {
      type: 'cylinder';
      id: string;
      body: BodyId;
      center: Vec3;
      axis: Vec3;
      radius: number;
      halfLength: number;
      side: 1 | -1;
    }
  | {
      type: 'sphere';
      id: string;
      body: BodyId;
      center: Vec3;
      radius: number;
    };

export interface MuscleDefinition {
  id: MuscleId;
  name: string;
  shortName: string;
  color: string;
  group: MuscleGroup;
  maxIsometricForce: number;
  optimalFiberLength: number;
  tendonSlackLength: number;
  pennationAngle: number;
  origin: PathPoint;
  insertion: PathPoint;
  viaPoints: ViaPoint[];
  wrapping: WrappingSurface[];
}
