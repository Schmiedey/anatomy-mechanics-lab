'use client';
import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  mergeVertices,
  mergeGeometries,
} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import type { Solution } from '@/biomechanics/inverseDynamics';
const assets = {
  biceps: ['/models/biceps-short.stl', '/models/biceps-long.stl'],
  brachialis: ['/models/brachialis.stl'],
  brachioradialis: ['/models/brachioradialis.stl'],
};
export function AtlasMuscle({
  muscle: m,
  selected,
  onSelect,
}: {
  muscle: Solution['muscles'][number];
  selected: boolean;
  onSelect: () => void;
}) {
  const sources = useLoader(STLLoader, assets[m.id]);
  const { geometry, referenceLength } = useMemo(() => {
    const g = mergeGeometries(sources.map((s) => s.clone()))!;
    g.deleteAttribute('normal');
    g.computeBoundingBox();
    const bb = g.boundingBox!,
      span = bb.max.z - bb.min.z;
    const a = g.getAttribute('position');
    const top = new THREE.Vector3(),
      bottom = new THREE.Vector3();
    let nt = 0,
      nb = 0;
    for (let i = 0; i < a.count; i++) {
      const p = new THREE.Vector3().fromBufferAttribute(a, i);
      if (p.z > bb.max.z - span * 0.06) {
        top.add(p);
        nt++;
      }
      if (p.z < bb.min.z + span * 0.06) {
        bottom.add(p);
        nb++;
      }
    }
    top.divideScalar(nt);
    bottom.divideScalar(nb);
    const d = bottom.clone().sub(top);
    const length = d.length() * 0.001;
    const rotation = new THREE.Quaternion().setFromUnitVectors(
      d.normalize(),
      new THREE.Vector3(0, 1, 0),
    );
    for (let i = 0; i < a.count; i++) {
      const p = new THREE.Vector3()
        .fromBufferAttribute(a, i)
        .sub(top)
        .applyQuaternion(rotation)
        .multiplyScalar(0.001);
      a.setXYZ(i, p.x, p.y, p.z);
    }
    const welded = mergeVertices(g, 0.000015);
    welded.computeVertexNormals();
    g.dispose();
    return { geometry: welded, referenceLength: length };
  }, [sources]);
  const start = new THREE.Vector3(...m.origin),
    direction = new THREE.Vector3(...m.insertion).sub(start);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh
      geometry={geometry}
      position={start}
      quaternion={rotation}
      scale={[1, direction.length() / referenceLength, 1]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <meshStandardMaterial
        color={
          m.id === 'biceps'
            ? '#b44d42'
            : m.id === 'brachialis'
              ? '#995c42'
              : '#a9554b'
        }
        roughness={0.53}
        emissive={selected ? '#9e3e29' : '#000'}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}
