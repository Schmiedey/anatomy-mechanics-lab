'use client';
import { useMemo, Suspense } from 'react';
import { AtlasBone } from './AtlasBones';
import { AtlasMuscle, muscleAssets } from './AtlasMuscle';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  Line,
  OrthographicCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { anthropometry, PRONATION_AXIS, type ModelState } from '@/anatomy/model';
import type { Solution } from '@/biomechanics/inverseDynamics';
import type { Vec3 } from '@/biomechanics/vectors';
export interface Overlays {
  muscles: boolean;
  external: boolean;
  arms: boolean;
  attachments: boolean;
  labels: boolean;
  paths: boolean;
}
interface Props {
  state: ModelState;
  result: Solution;
  selected: string;
  onSelect: (id: string) => void;
  overlays: Overlays;
  view: 'anatomy' | 'skeleton';
  resetKey: number;
  focusJoint: boolean;
}
const bone = '#e5d9ba';
function Ellipsoid({
  position,
  scale,
  color = bone,
  onClick,
}: {
  position: Vec3;
  scale: Vec3;
  color?: string;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <mesh position={position} scale={scale} onClick={onClick}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshStandardMaterial color={color} roughness={0.58} />
    </mesh>
  );
}
function Arrow({
  origin,
  direction,
  magnitude,
  color,
}: {
  origin: Vec3;
  direction: Vec3;
  magnitude: number;
  color: string;
}) {
  const arrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(...direction).normalize(),
        new THREE.Vector3(...origin),
        magnitude > 0 ? 0.025 + 0.15 * Math.sqrt(magnitude / 500) : 0,
        color,
        0.018,
        0.009,
      ),
    [origin, direction, magnitude, color],
  );
  return magnitude > 0.001 ? <primitive object={arrow} /> : null;
}
function Anatomy({
  state: s,
  result: r,
  selected,
  onSelect,
  overlays: o,
  view,
  focusJoint,
}: Props) {
  const q = r.kinematics.q;
  return (
    <group>
      <Suspense fallback={null}>
        <AtlasBone
          id="humerus"
          state={s}
          selected={selected}
          onSelect={onSelect}
        />
      </Suspense>
      <group rotation={[0, 0, q]}>
        <Suspense fallback={null}>
          <AtlasBone
            id="ulna"
            state={s}
            selected={selected}
            onSelect={onSelect}
          />
        </Suspense>
        <group
          position={PRONATION_AXIS}
          rotation={[0, (-s.pronation * Math.PI) / 180, 0]}
        >
          <group position={[-PRONATION_AXIS[0], -PRONATION_AXIS[1], -PRONATION_AXIS[2]]}>
            <Suspense fallback={null}>
              <AtlasBone
                id="radius"
                state={s}
                selected={selected}
                onSelect={onSelect}
              />
            </Suspense>
          </group>
        </group>
        {s.loadLb > 0 && (
          <group position={[0, -s.forearm * s.loadPosition, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.17, 24]} />
              <meshStandardMaterial
                color="#9aa6a8"
                metalness={0.85}
                roughness={0.27}
              />
            </mesh>
            {[-1, 1].map((sign) => (
              <group key={sign} position={[0, 0, sign * 0.073]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry
                    args={[
                      0.034 + s.loadLb * 0.00015,
                      0.034 + s.loadLb * 0.00015,
                      0.037,
                      12,
                    ]}
                  />
                  <meshStandardMaterial
                    color="#303c3f"
                    metalness={0.7}
                    roughness={0.32}
                  />
                </mesh>
                <mesh
                  position={[0, 0, sign * 0.021]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.025, 0.025, 0.008, 12]} />
                  <meshStandardMaterial
                    color="#667373"
                    metalness={0.6}
                    roughness={0.4}
                  />
                </mesh>
              </group>
            ))}
          </group>
        )}
      </group>
      {r.muscles.map((m) => {
        return (
          <group key={m.id}>
            {view === 'anatomy' && muscleAssets[m.id] && (
              <Suspense fallback={null}>
                <AtlasMuscle
                  muscle={m}
                  selected={selected === m.id}
                  onSelect={() => onSelect(m.id)}
                />
              </Suspense>
            )}
            {o.paths && m.points.length > 1 && (
              <Line
                points={m.points}
                color={m.color}
                lineWidth={selected === m.id ? 2.4 : 1.4}
                transparent
                opacity={selected === m.id ? 0.95 : 0.55}
              />
            )}
            {o.attachments &&
              [m.origin, m.insertion].map((p, j) => (
                <Ellipsoid
                  key={j}
                  position={p}
                  scale={[0.004, 0.004, 0.004]}
                  color={m.color}
                />
              ))}
            {o.muscles && (
              <Arrow
                origin={m.insertion}
                direction={m.direction}
                magnitude={m.force}
                color={m.color}
              />
            )}{' '}
            {o.arms && (
              <Line
                points={[[0, 0, m.foot[2]], m.foot]}
                color={m.color}
                lineWidth={2}
                dashed
                dashSize={0.004}
                gapSize={0.003}
              />
            )}
          </group>
        );
      })}
      <Line
        points={[
          [0, 0, -0.065],
          [0, 0, 0.075],
        ]}
        color="#c4ae8a"
        lineWidth={1}
        dashed
        dashSize={0.004}
        gapSize={0.004}
      />
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.047, 0.0008, 8, 80, Math.max(0.01, q)]} />
        <meshBasicMaterial color="#d4b48a" />
      </mesh>
      {o.external && (
        <>
          <Arrow
            origin={r.kinematics.load}
            direction={[0, -1, 0]}
            magnitude={Math.abs(r.external.loadForce[1])}
            color="#e2c9a0"
          />
          {s.selfWeight && (
            <Arrow
              origin={r.kinematics.forearmCOM}
              direction={[0, -1, 0]}
              magnitude={anthropometry.forearmMass * anthropometry.gravity}
              color="#c9b8a0"
            />
          )}
          {s.selfWeight && (
            <Arrow
              origin={r.kinematics.handCOM}
              direction={[0, -1, 0]}
              magnitude={anthropometry.handMass * anthropometry.gravity}
              color="#c9b8a0"
            />
          )}
        </>
      )}
      {o.labels && !focusJoint && (
        <>
          <Html position={[-0.01, s.upperArm * 0.68, 0.035]} center>
            <button
              className="anatomy-label"
              onClick={() => onSelect('humerus')}
            >
              Humerus <span>↗</span>
            </button>
          </Html>
          <Html position={[0.075, 0.15, 0.04]} center>
            <button
              className="anatomy-label muscle-label"
              onClick={() => onSelect('bicepsLong')}
            >
              Biceps brachii<span>↙</span>
            </button>
          </Html>
          <Html position={[-0.055, -0.023, 0.045]} center>
            <div className="joint-label">
              {s.angle.toFixed(0)}°<small>ELBOW</small>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
function CameraRig({ state, focusJoint, resetKey }: Props) {
  const { size } = useThree();
  const fitZoom = Math.min(
    900,
    (size.width - 50) / (state.forearm * state.loadPosition + 0.15),
    (size.height - 70) /
      (state.upperArm + state.forearm * state.loadPosition + 0.06),
  );
  return (
    <>
      <OrthographicCamera
        key={`${resetKey}-${focusJoint}`}
        makeDefault
        position={focusJoint ? [0.35, 0.15, 1.5] : [0.48, 0.25, 1.5]}
        zoom={focusJoint ? Math.min(2800, size.width / 0.22) : fitZoom}
        near={0.01}
        far={20}
      />
      <OrbitControls
        key={`o${resetKey}-${focusJoint}`}
        target={focusJoint ? [0, 0, 0] : [0.1, 0.07, 0]}
        enablePan
        minZoom={200}
        maxZoom={5000}
      />
    </>
  );
}
export default function ArmScene(props: Props) {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <CameraRig {...props} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[-2, 3.4, 4]}
        intensity={2.5}
        color="#ffe3c0"
      />
      <directionalLight
        position={[2.4, -1, -2]}
        intensity={0.85}
        color="#6d5344"
      />
      <Anatomy {...props} />
    </Canvas>
  );
}
