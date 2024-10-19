"use client";

import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { YDocProvider, useArray, useYjsProvider } from "@y-sweet/react";
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

export default function Home({ params }: { params: { uuid: string } }) {
  useEffect(() => gui(), []);

  return (
    <YDocProvider docId={params.uuid} authEndpoint="/yjs">
      <Provider store={store}>
        <ErrorBoundary fallback={<Fallback />}>
          <Scene />
        </ErrorBoundary>
      </Provider>
    </YDocProvider>
  );
}

function Scene() {
  const provider = useYjsProvider();

  const floor = useArray<Y.Map<number>>("floor");
  const ceiling = useArray<Y.Map<number>>("ceiling");

  useEffect(() => {
    function sync() {
      if (!floor.length) {
        floor.push([
          toYMap({ x: -6.6, y: -10, z: 5.6 }),
          toYMap({ x: -17.9, y: -10, z: 1.0 }),
          toYMap({ x: -7.2, y: -10, z: -5.0 }),
          toYMap({ x: -6.1, y: -10, z: -17.2 }),
          toYMap({ x: 2.9, y: -10, z: -8.9 }),
          toYMap({ x: 14.9, y: -10, z: -11.6 }),
          toYMap({ x: 9.8, y: -10, z: -4 }),
          toYMap({ x: 16.0, y: -10, z: 10.1 }),
          toYMap({ x: 3.9, y: -10, z: 8.7 }),
          toYMap({ x: -4.2, y: -10, z: 17.9 }),
          // [-2, -4, -2],
          // [2, -4, -2],
          // [2, -4, 2],
          // [-2, -4, 2]
        ]);
      }

      if (!ceiling.length) {
        ceiling.push([
          // triangle
          toYMap({ x: 6.0, y: 10, z: 0 }),
          toYMap({ x: -3.0, y: 10, z: 5.2 }),
          toYMap({ x: -3.0, y: 10, z: -5.2 }),
          // [-2.5, 4, 0.5],
          // [0.5, 4, 2.5],
          // [2.5, 4, -0.5],
          // [-0.5, 4, -2.5]
        ]);
      }
    }
    provider.on("synced", sync);
    return () => provider.off("synced", sync);
  }, [provider, floor, ceiling]);

  const [dragging, setDragging] = useState<[id: string, index: number] | undefined>(undefined);

  const floorArray = floor.toArray(),
    ceilingArray = ceiling.toArray();
  const lofted = useMemo(() => {
    if (!floorArray.length || !ceilingArray.length)
      return { vertices: new Float32Array(), indices: new Uint16Array() };

    const { vertices, indices } = loft(floorArray.map(toVector3), ceilingArray.map(toVector3));
    return {
      vertices: new Float32Array([...vertices, ...zeroes].slice(0, zeroes.length)),
      indices: new Uint16Array([...indices, ...zeroes].slice(0, zeroes.length)),
    };
  }, [floorArray, ceilingArray]);

  const position = useRef<THREE.BufferAttribute>(null);
  const index = useRef<THREE.BufferAttribute>(null);
  useEffect(() => {
    if (!position.current || !index.current) return;

    position.current.array = lofted.vertices;
    position.current.needsUpdate = true;

    index.current.array = lofted.indices;
    index.current.needsUpdate = true;
  }, [lofted]);

  const displayStats = useAtomValue(stats);
  const displayGrid = useAtomValue(grid);
  const displayWireframe = useAtomValue(wireframe);

  return (
    <Canvas camera={{ position: [0, 30, 30] }}>
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
        id="floor"
        path={floor.map(toVector3)}
        color="blue"
        dragging={dragging}
        onStartDrag={i => setDragging(["floor", i])}
        onMovePoint={(i, { x, y, z }) => {
          if (dragging?.[0] !== "floor" || dragging?.[1] !== i) return;

          const point = floor.get(i);
          point.set("x", x);
          point.set("y", y);
          point.set("z", z);
        }}
        onAddPoint={(i, point) => {
          setDragging(["floor", i]);
          floor.insert(i, [toYMap(point)]);
        }}
        onRemovePoint={i => floor.delete(i)}
        onEndDrag={() => setDragging(undefined)}
      />

      <Plane
        id="ceiling"
        path={ceiling.map(toVector3)}
        color="blue"
        dragging={dragging}
        onStartDrag={i => setDragging(["ceiling", i])}
        onMovePoint={(i, { x, y, z }) => {
          if (dragging?.[0] !== "ceiling" || dragging?.[1] !== i) return;

          const point = ceiling.get(i);
          point.set("x", x);
          point.set("y", y);
          point.set("z", z);
        }}
        onAddPoint={(i, point) => {
          setDragging(["ceiling", i]);
          ceiling.insert(i, [toYMap(point)]);
        }}
        onRemovePoint={i => ceiling.delete(i)}
        onEndDrag={() => setDragging(undefined)}
      />
    </Canvas>
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
