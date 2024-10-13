"use client";

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, OrbitControls, TransformControls } from "@react-three/drei";

import * as THREE from "three";

const floor: THREE.Vector3[] = [
  new THREE.Vector3(-2, -4, -2),
  new THREE.Vector3(2, -4, -2),
  new THREE.Vector3(2, -4, 2),
  new THREE.Vector3(-2, -4, 2)
];

const ceiling: THREE.Vector3[] = [
  new THREE.Vector3(-3, 4, 0),
  new THREE.Vector3(0, 4, 3),
  new THREE.Vector3(3, 4, 0),
  new THREE.Vector3(0, 4, -3)
];

function Box(props: { position: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null!!!);

  return (
    <mesh {...props} ref={ref}>
      <sphereGeometry args={[0.25, 32, 16]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

export default function Home() {
  return (
    <Canvas camera={{ position: [0, 20, 20] }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <group>
        {floor.map((point, i) => (
          <Box key={i} position={point} />
        ))}
      </group>
      <group>
        {ceiling.map((point, i) => (
          <Box key={i} position={point} />
        ))}
      </group>

      <OrbitControls />
      <Stats />
    </Canvas>
  );
}
