"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, OrbitControls } from "@react-three/drei";

import Plane from "~/components/Plane";
import { loft } from "~/lib/loft";
import gui, { grid, stats, wireframe } from "~/lib/settings";

import * as THREE from "three";
import { ErrorBoundary } from "react-error-boundary";
import { Provider, useAtomValue } from "jotai";
import { store } from "~/lib/settings";

function Cap(props: { path: THREE.Vector3Tuple[]; color?: string | number }) {
  const { path, color = "pink" } = props;

  return (
    <mesh rotation={[0, 0, 0]} position={[0, path[0][1], 0]}>
      <shapeGeometry args={[new THREE.Shape(path.map(([x, , z]) => new THREE.Vector2(x, z))), 0]} />
      <meshStandardMaterial color={color} flatShading side={THREE.DoubleSide} />
    </mesh>
  );
}

const zeroes = new Array(600).fill(0);

type Path = THREE.Vector3Tuple[];

export default function Home() {
  useEffect(() => gui(), []);

  const [floor, setFloor] = useState<Path>([
    [-6.6, -10, 5.6],
    [-17.9, -10, 1.0],
    [-7.2, -10, -5.0],
    [-6.1, -10, -17.2],
    [2.9, -10, -8.9],
    [14.9, -10, -11.6],
    [9.8, -10, -4],
    [16.0, -10, 10.1],
    [3.9, -10, 8.7],
    [-4.2, -10, 17.9],
    // [-2, -4, -2],
    // [2, -4, -2],
    // [2, -4, 2],
    // [-2, -4, 2]
  ]);

  const [ceiling, setCeiling] = useState<Path>([
    // triangle
    [6.0, 10, 0],
    [-3.0, 10, 5.2],
    [-3.0, 10, -5.2],
    // [-2.5, 4, 0.5],
    // [0.5, 4, 2.5],
    // [2.5, 4, -0.5],
    // [-0.5, 4, -2.5]
  ]);

  return (
    <Provider store={store}>
      <ErrorBoundary fallback={<Fallback floor={floor} ceiling={ceiling} />}>
        <Canvas camera={{ position: [0, 30, 30] }}>
          <Scene
            floor={floor}
            onChangeFloor={setFloor}
            ceiling={ceiling}
            onChangeCeiling={setCeiling}
          />
        </Canvas>
      </ErrorBoundary>
    </Provider>
  );
}

interface SceneProps {
  floor: Path;
  ceiling: Path;
  onChangeFloor(floor: Path | ((path: Path) => Path)): void;
  onChangeCeiling(ceiling: Path | ((path: Path) => Path)): void;
}

function Scene(props: SceneProps) {
  const { floor, ceiling, onChangeFloor, onChangeCeiling } = props;

  const [dragging, setDragging] = useState(false);

  const position = useRef<THREE.BufferAttribute>(null);
  const index = useRef<THREE.BufferAttribute>(null);

  const lofted = useMemo(() => {
    const { vertices, indices } = loft(floor, ceiling);
    return {
      vertices: new Float32Array([...vertices, ...zeroes].slice(0, zeroes.length)),
      indices: new Uint16Array([...indices, ...zeroes].slice(0, zeroes.length)),
    };
  }, [floor, ceiling]);

  useEffect(() => {
    if (!position.current || !index.current) return;
    position.current.needsUpdate = true;
    index.current.needsUpdate = true;
  }, [lofted]);

  const displayStats = useAtomValue(stats);
  const displayGrid = useAtomValue(grid);
  const displayWireframe = useAtomValue(wireframe);

  return (
    <>
      {displayGrid && <gridHelper args={[50, 10]} />}
      {displayStats && <Stats />}
      <OrbitControls enableRotate={!dragging} />
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
            needsUpdate
          />
          <bufferAttribute
            ref={index}
            attach="index"
            array={lofted.indices}
            count={lofted.indices.length}
            itemSize={1}
            needsUpdate
          />
        </bufferGeometry>
        <meshStandardMaterial
          color="pink"
          flatShading
          side={THREE.DoubleSide}
          wireframe={displayWireframe}
        />
      </mesh>

      <Plane
        path={floor}
        color="blue"
        onPointerDown={() => setDragging(true)}
        onMovePoint={(i, point) => {
          if (!dragging) return;
          onChangeFloor(path => [...path.slice(0, i), point, ...path.slice(i + 1)]);
        }}
        onAddPoint={(i, point) => {
          setDragging(true);
          onChangeFloor(path => [...path.slice(0, i), point, ...path.slice(i)]);
        }}
        onRemovePoint={i => onChangeFloor(path => path.filter((_, j) => i !== j))}
        onPointerUp={() => setDragging(false)}
      />

      <Plane
        path={ceiling}
        color="blue"
        onPointerDown={() => setDragging(true)}
        onMovePoint={(i, point) => {
          if (!dragging) return;
          onChangeCeiling(path => [...path.slice(0, i), point, ...path.slice(i + 1)]);
        }}
        onAddPoint={(i, point) => {
          setDragging(true);
          onChangeCeiling(path => [...path.slice(0, i), point, ...path.slice(i)]);
        }}
        onRemovePoint={i => onChangeCeiling(path => path.filter((_, j) => i !== j))}
        onPointerUp={() => setDragging(false)}
      />
    </>
  );
}

function Fallback(props: { floor: Path; ceiling: Path }) {
  return (
    <div>
      <h2>Whoops!</h2>
      <pre>
        <code>{JSON.stringify(props.ceiling)}</code>
      </pre>
      <pre>
        <code>{JSON.stringify(props.floor)}</code>
      </pre>
    </div>
  );
}
