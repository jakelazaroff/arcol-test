"use client";

import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { YDocProvider, useArray } from "@y-sweet/react";
import { Provider, useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import type * as Y from "yjs";

import Plane from "~/components/Plane";
import { loft } from "~/lib/loft";
import gui, { grid, stats, wireframe } from "~/lib/settings";
import { store } from "~/lib/settings";
import { toVector3, toYMap } from "~/lib/yjs";

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

export default function Home({ params }: { params: { uuid: string } }) {
  useEffect(() => gui(), []);

  return (
    <YDocProvider docId={params.uuid} authEndpoint="/yjs">
      <Provider store={store}>
        <ErrorBoundary fallback={<Fallback />}>
          <Canvas camera={{ position: [0, 30, 30] }}>
            <Scene />
          </Canvas>
        </ErrorBoundary>
      </Provider>
    </YDocProvider>
  );
}

function Scene() {
  const floor = useArray<Y.Map<number>>("floor");
  useEffect(() => {
    if (floor.toArray().length) return;
    floor.push([
      toYMap([-6.6, -10, 5.6]),
      toYMap([-17.9, -10, 1.0]),
      toYMap([-7.2, -10, -5.0]),
      toYMap([-6.1, -10, -17.2]),
      toYMap([2.9, -10, -8.9]),
      toYMap([14.9, -10, -11.6]),
      toYMap([9.8, -10, -4]),
      toYMap([16.0, -10, 10.1]),
      toYMap([3.9, -10, 8.7]),
      toYMap([-4.2, -10, 17.9]),
      // [-2, -4, -2],
      // [2, -4, -2],
      // [2, -4, 2],
      // [-2, -4, 2]
    ]);
  }, [floor]);

  const ceiling = useArray<Y.Map<number>>("ceiling");
  useEffect(() => {
    if (ceiling.toArray().length) return;
    ceiling.push([
      // triangle
      toYMap([6.0, 10, 0]),
      toYMap([-3.0, 10, 5.2]),
      toYMap([-3.0, 10, -5.2]),
      // [-2.5, 4, 0.5],
      // [0.5, 4, 2.5],
      // [2.5, 4, -0.5],
      // [-0.5, 4, -2.5]
    ]);
  }, [ceiling]);

  const [dragging, setDragging] = useState(false);

  const lofted = useMemo(() => {
    if (!floor.length || !ceiling.length)
      return { vertices: new Float32Array(), indices: new Uint16Array() };

    const { vertices, indices } = loft(floor.map(toVector3), ceiling.map(toVector3));
    return {
      vertices: new Float32Array([...vertices, ...zeroes].slice(0, zeroes.length)),
      indices: new Uint16Array([...indices, ...zeroes].slice(0, zeroes.length)),
    };
  }, [floor.toArray(), ceiling.toArray()]);

  const position = useRef<THREE.BufferAttribute>(null);
  const index = useRef<THREE.BufferAttribute>(null);
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

      {Boolean(lofted.vertices.length) && (
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
      )}

      <Plane
        path={floor.map(toVector3)}
        color="blue"
        onPointerDown={() => setDragging(true)}
        onMovePoint={(i, [x, y, z]) => {
          if (!dragging) return;
          const point = floor.get(i);
          point.set("x", x);
          point.set("y", y);
          point.set("z", z);
        }}
        onAddPoint={(i, point) => {
          setDragging(true);
          floor.insert(i, [toYMap(point)]);
        }}
        onRemovePoint={i => floor.delete(i)}
        onPointerUp={() => setDragging(false)}
      />

      <Plane
        path={ceiling.map(toVector3)}
        color="blue"
        onPointerDown={() => setDragging(true)}
        onMovePoint={(i, [x, y, z]) => {
          if (!dragging) return;
          const point = ceiling.get(i);
          point.set("x", x);
          point.set("y", y);
          point.set("z", z);
        }}
        onAddPoint={(i, point) => {
          setDragging(true);
          ceiling.insert(i, [toYMap(point)]);
        }}
        onRemovePoint={i => ceiling.delete(i)}
        onPointerUp={() => setDragging(false)}
      />
    </>
  );
}

function Fallback() {
  const floor = useArray<THREE.Vector3Tuple>("floor");
  const ceiling = useArray<THREE.Vector3Tuple>("ceiling");

  return (
    <div>
      <h2>Whoops!</h2>
      <pre>
        <code>{JSON.stringify(ceiling)}</code>
      </pre>
      <pre>
        <code>{JSON.stringify(floor)}</code>
      </pre>
    </div>
  );
}
