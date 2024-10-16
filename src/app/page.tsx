"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stats, OrbitControls, Text } from "@react-three/drei";
import { loft } from "~/lib/loft";

import * as THREE from "three";

type ThreeTarget = {
  setPointerCapture(pointerId: number): void;
  releasePointerCapture(pointerId: number): void;
} | null;

interface PointProps {
  position: THREE.Vector3Tuple;
  color?: string | number;
  onPointerDown(): void;
  onPointerMove(vector: THREE.Vector3): void;
  onPointerUp(): void;
}

const raycaster = new THREE.Raycaster();

function Point(props: PointProps) {
  const { color = "blue", onPointerDown, onPointerMove, onPointerUp, ...rest } = props;
  const { camera } = useThree();

  return (
    <mesh
      {...rest}
      onPointerDown={e => {
        e.stopPropagation();

        const target = e.target as ThreeTarget;
        target?.setPointerCapture(e.pointerId);

        onPointerDown();
      }}
      onPointerMove={e => {
        const canvas = e.nativeEvent.target as HTMLCanvasElement;
        const { width, height } = canvas.getBoundingClientRect();

        const x = (e.x / width) * 2 - 1,
          y = -(e.y / height) * 2 + 1;

        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        // define the plane
        const normal = new THREE.Vector3(0, 1, 0);
        const p = new THREE.Vector3(0, rest.position[1], 0);

        // get the ray direction
        const dir = raycaster.ray.direction;

        const denominator = dir.dot(normal);

        // ensure the ray isn't parallel to the plane
        if (Math.abs(denominator) <= Number.EPSILON) return;

        // calculate t (the distance along the ray to the intersection point)
        const t = p.sub(raycaster.ray.origin).dot(normal) / denominator;

        // calculate the intersection point
        const intersection = new THREE.Vector3()
          .copy(raycaster.ray.origin)
          .add(dir.multiplyScalar(t));

        onPointerMove(intersection);
      }}
      onPointerUp={e => {
        e.stopPropagation();

        const target = e.target as ThreeTarget;
        target?.releasePointerCapture(e.pointerId);

        onPointerUp();
      }}
      onPointerCancel={() => {}}
    >
      <sphereGeometry args={[0.5, 32, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Cap(props: { path: THREE.Vector3Tuple[]; color?: string | number }) {
  const { path, color = "pink" } = props;

  return (
    <mesh rotation={[0, 0, 0]} position={[0, path[0][1], 0]}>
      <shapeGeometry args={[new THREE.Shape(path.map(([x, , z]) => new THREE.Vector2(x, z))), 0]} />
      <meshStandardMaterial color={color} flatShading side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Home() {
  return (
    <Canvas camera={{ position: [0, 20, 20] }}>
      <Scene />
    </Canvas>
  );
}

function Scene() {
  const [floor, setFloor] = useState<THREE.Vector3Tuple[]>([
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
  ]);

  const [ceiling, setCeiling] = useState<THREE.Vector3Tuple[]>([
    [6.0, 5, 0],
    [-3.0, 5, 5.2],
    [-3.0, 5, -5.2]
    // [-2.5, 4, 0.5],
    // [0.5, 4, 2.5],
    // [2.5, 4, -0.5],
    // [-0.5, 4, -2.5]
  ]);

  const [dragging, setDragging] = useState(false);

  const position = useRef<THREE.BufferAttribute>(null);
  const index = useRef<THREE.BufferAttribute>(null);

  const lofted = useMemo(() => loft(floor, ceiling), [floor, ceiling]);
  useFrame(() => {
    if (!position.current || !index.current) return;

    position.current.array = lofted.vertices;
    position.current.needsUpdate = true;
    index.current.array = lofted.indices;
    index.current.needsUpdate = true;
  });

  return (
    <>
      <gridHelper args={[50, 10]} />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[100, 100, 100]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-100, -100, -100]} decay={0} intensity={Math.PI} />

      {/* <Cap path={ceiling} />
      <Cap path={floor} /> */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            ref={position}
            attach="attributes-position"
            array={lofted.vertices}
            count={lofted.vertices.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            ref={index}
            attach="index"
            array={lofted.indices}
            count={lofted.indices.length}
            itemSize={1}
          />
        </bufferGeometry>
        <meshStandardMaterial color="pink" flatShading side={THREE.DoubleSide} />
      </mesh>

      <group>
        {floor.map((point, i) => (
          <Fragment key={i}>
            <Point
              position={point}
              onPointerDown={() => setDragging(true)}
              onPointerMove={e => {
                if (!dragging) return;

                setFloor(points =>
                  points.map((point, j) => {
                    if (i !== j) return point;
                    return [e.x, point[1], e.z];
                  })
                );
              }}
              onPointerUp={() => setDragging(false)}
            />
          </Fragment>
        ))}
      </group>
      <group>
        {ceiling.map((point, i) => (
          <Fragment key={i}>
            <Point
              position={point}
              onPointerDown={() => setDragging(true)}
              onPointerMove={e => {
                if (!dragging) return;

                setCeiling(points =>
                  points.map((point, j) => {
                    if (i !== j) return point;
                    return [e.x, point[1], e.z];
                  })
                );
              }}
              onPointerUp={() => setDragging(false)}
            />
          </Fragment>
        ))}
      </group>

      <OrbitControls enableRotate={!dragging} />
      <Stats />
    </>
  );
}
