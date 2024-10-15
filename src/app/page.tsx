"use client";

import { Fragment, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, OrbitControls, Text } from "@react-three/drei";
import { loft } from "~/lib/loft";

import * as THREE from "three";

const floor: THREE.Vector3Tuple[] = [
  [-6.6, -5, 5.6],
  [-17.9, -5, 1.0],
  [-7.2, -5, -5.0],
  [-6.1, -5, -17.2],
  [2.9, -5, -8.9],
  [14.9, -5, -11.6],
  [9.8, -5, -4],
  [16.0, -5, 10.1],
  [3.9, -5, 8.7],
  [-4.2, -5, 17.9]
  // [-2, -4, -2],
  // [2, -4, -2],
  // [2, -4, 2],
  // [-2, -4, 2]
];

const ceiling: THREE.Vector3Tuple[] = [
  [6.0, 5, 0],
  [-3.0, 5, 5.2],
  [-3.0, 5, -5.2]
  // [-2.5, 4, 0.5],
  // [0.5, 4, 2.5],
  // [2.5, 4, -0.5],
  // [-0.5, 4, -2.5]
];

const lofted = loft(floor, ceiling);
// const vertices = result.vertices.map(({ x, y, z }) => new THREE.Vector3(x, y, z));

function Box(props: { position: THREE.Vector3Tuple; color?: string | number }) {
  const { color = "blue", ...rest } = props;

  const ref = useRef<THREE.Mesh>(null!!!);

  return (
    <mesh {...rest} ref={ref}>
      <sphereGeometry args={[0.5, 32, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function Home() {
  return (
    <Canvas camera={{ position: [0, 20, 20] }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[100, 100, 100]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-100, -100, -100]} decay={0} intensity={Math.PI} />

      <group>
        {floor.map((point, i) => (
          <Fragment key={i}>
            <Box position={point} />
            <Text scale={[1, 1, 1]} color="black" position={[point[0], point[1] - 2, point[2]]}>
              {i + 4}
            </Text>
          </Fragment>
        ))}
      </group>

      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={lofted.vertices}
            count={lofted.vertices.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            array={lofted.indices}
            count={lofted.indices.length}
            itemSize={1}
          />
        </bufferGeometry>
        <meshStandardMaterial color="gray" flatShading />
      </mesh>

      <group>
        {ceiling.map((point, i) => (
          <Fragment key={i}>
            <Box position={point} />
            <Text scale={[1, 1, 1]} color="black" position={[point[0], point[1] + 2, point[2]]}>
              {i}
            </Text>
          </Fragment>
        ))}
      </group>

      <OrbitControls />
      <Stats />
    </Canvas>
  );
}
