'use client';
import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { skeleton, type BoneId } from '@/anatomy/skeleton';
import type { ModelState } from '@/anatomy/model';
// Source frame: millimetres, Z superior. Lab: X anterior, Y superior, Z lateral.
const atlasToLab = (p: THREE.Vector3) => new THREE.Vector3(-p.y, p.z, -p.x);
export function AtlasBone({
  id,
  state,
  selected,
  onSelect,
}: {
  id: BoneId;
  state: ModelState;
  selected: string;
  onSelect: (s: string) => void;
}) {
  const definition = skeleton.bones.find((b) => b.id === id)!;
  const source = useLoader(STLLoader, definition.asset);
  const geometry = useMemo(() => {
    const g = source.clone();
    g.deleteAttribute('normal');
    const elbow = new THREE.Vector3(...skeleton.registration.elbow);
    const anchor = new THREE.Vector3(
      ...(id === 'humerus'
        ? skeleton.registration.shoulder
        : skeleton.registration.wrist),
    );
    const longitudinal = atlasToLab(anchor.sub(elbow));
    const target = new THREE.Vector3(0, id === 'humerus' ? 1 : -1, 0);
    const registration = new THREE.Quaternion().setFromUnitVectors(
      longitudinal.clone().normalize(),
      target,
    );
    const referenceLength = id === 'humerus' ? 0.33 : 0.3;
    const scale = referenceLength / longitudinal.length();
    const a = g.getAttribute('position');
    for (let i = 0; i < a.count; i++) {
      const p = atlasToLab(
        new THREE.Vector3().fromBufferAttribute(a, i).sub(elbow),
      )
        .applyQuaternion(registration)
        .multiplyScalar(scale);
      a.setXYZ(i, p.x, p.y, p.z);
    }
    const welded = mergeVertices(g, 0.00001);
    welded.computeVertexNormals();
    g.dispose();
    return welded;
  }, [source, id]);
  return (
    <mesh
      geometry={geometry}
      scale={[
        1,
        id === 'humerus' ? state.upperArm / 0.33 : state.forearm / 0.3,
        1,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
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
        color={selected === id ? '#f3e3b6' : '#ddd3b6'}
        roughness={0.6}
        metalness={0.02}
        emissive={selected === id ? '#967d44' : '#000'}
        emissiveIntensity={0.12}
      />
    </mesh>
  );
}
